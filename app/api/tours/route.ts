import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/middleware';
import { tourSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS } from '@/lib/cache';

// GET all tours with caching
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    logger.apiRequest('GET', '/api/tours', undefined);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const q = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Create cache key based on filters
    const cacheKey = `${CACHE_KEYS.TOURS}:${JSON.stringify({ category, location, q, minPrice, maxPrice, sortBy, page, limit })}`;

    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Tours served from cache', { cacheKey }, undefined, requestId);
      return NextResponse.json(cached);
    }

    // Build where clause for filtering
    const where: {
      is_active: boolean;
      is_deleted: boolean;
      category_id?: number;
      location_name?: { contains: string; mode: 'insensitive' };
      title?: { contains: string; mode: 'insensitive' };
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; location_name?: { contains: string; mode: 'insensitive' } }>;
      price?: { gte?: bigint; lte?: bigint };
    } = {
      is_active: true,
      is_deleted: false
    };

    if (category) {
      where.category_id = parseInt(category);
    }

    if (location) {
      where.location_name = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Search by q parameter (title or location_name)
    if (q) {
      console.log('Searching for:', q);
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { location_name: { contains: q, mode: 'insensitive' } }
      ];
      console.log('Where clause with OR:', JSON.stringify(where));
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = BigInt(parseInt(minPrice));
      if (maxPrice) where.price.lte = BigInt(parseInt(maxPrice));
    }

    // Get total count for pagination
    const total = await prisma.tours.count({ where });

    // Build orderBy based on sortBy parameter
    let orderBy: any = { id: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else {
      orderBy = { id: 'desc' }; // newest
    }

    // Get tours with pagination
    const tours = await prisma.tours.findMany({
      where,
      include: {
        tour_categories: {
          select: {
            id: true,
            category_name: true
          }
        },
        tour_images: {
          take: 1
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Get all reviews and bookings in single queries to avoid N+1
    const tourIds = tours.map(t => t.id);
    const [allReviews, allBookings, bookingCounts] = await Promise.all([
      tourIds.length > 0 ? prisma.reviews.findMany({
        where: { tour_id: { in: tourIds }, is_deleted: false },
        select: { tour_id: true, rating: true }
      }) : [],
      tourIds.length > 0 ? prisma.bookings.groupBy({
        by: ['tour_id'],
        where: { tour_id: { in: tourIds } },
        _count: { id: true }
      }) : [],
      tourIds.length > 0 ? prisma.bookings.groupBy({
        by: ['tour_id'],
        where: { 
          tour_id: { in: tourIds },
          status: { not: 'cancelled' }
        },
        _count: { id: true }
      }) : []
    ]);

    // Aggregate reviews and bookings by tour_id
    const reviewsByTour: Record<number, number[]> = allReviews.reduce((acc, r) => {
      if (!acc[r.tour_id]) acc[r.tour_id] = [];
      if (r.rating !== null) acc[r.tour_id].push(r.rating);
      return acc;
    }, {} as Record<number, number[]>);

    const bookingsByTour: Record<number, number> = allBookings.reduce((acc, b) => {
      acc[b.tour_id] = b._count.id;
      return acc;
    }, {} as Record<number, number>);

    const activeBookingsByTour: Record<number, number> = bookingCounts.reduce((acc, b) => {
      acc[b.tour_id] = b._count.id;
      return acc;
    }, {} as Record<number, number>);

    // Format response with pre-calculated stats
    const toursFormatted = tours.map(tour => {
      const tourReviews = reviewsByTour[tour.id] || [];
      const averageRating = tourReviews.length > 0
        ? tourReviews.reduce((sum: number, r: number) => sum + r, 0) / tourReviews.length
        : 0;

      const activeBookings = activeBookingsByTour[tour.id] || 0;
      const remainingSlots = tour.max_slots ? Math.max(0, tour.max_slots - activeBookings) : null;

      return {
        ...tour,
        price: tour.price.toString(),
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: tourReviews.length,
        totalBookings: bookingsByTour[tour.id] || 0,
        remainingSlots,
        maxSlots: tour.max_slots
      };
    });

    const response = {
      tours: toursFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the result for 5 minutes
    cache.set(cacheKey, response, 5 * 60 * 1000);

    logger.info(`Tours retrieved in ${Date.now() - startTime}ms`, { count: tours.length, cacheKey }, undefined, requestId);

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.apiError('GET', '/api/tours', error instanceof Error ? error : new Error(String(error)), undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST Create new tour
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = tourSchema.parse(body);

    const tour = await prisma.tours.create({
      data: {
        title: validatedData.title,
        location_name: validatedData.location_name,
        price: BigInt(validatedData.price),
        category_id: Number(validatedData.category_id),
        description: validatedData.description,
        sub_title: (validatedData as any).sub_title,
        is_active: true,
        // ĐÃ SỬA: Thêm dòng này để khi admin lưu tour mới sẽ nhận luôn link map_url
        map_url: (validatedData as any).map_url || null
      }
    });

    // ĐÃ SỬA: Xóa sạch bộ nhớ đệm cũ để dữ liệu bản đồ mới hiển thị ngay lập tức lên web
    if (cache && typeof cache.clear === 'function') {
      cache.clear();
    }

    return NextResponse.json({ 
      success: true, 
      tour: { 
        ...tour, 
        price: tour.price.toString() 
      } 
    });
  } catch (error) {
    console.error('Create tour error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}