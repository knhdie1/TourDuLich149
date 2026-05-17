import { prisma } from "@/lib/prisma";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import dynamic from "next/dynamic";
import { MapPin, Info, CheckCircle2, Globe, Star, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import Image from 'next/image';

// Lazy load heavy components
const BookingForm = dynamic(() => import("../../components/BookingForm"), {
  loading: () => <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
});

const ReviewSystem = dynamic(() => import("../../components/ReviewSystem"), {
  loading: () => <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
});

// SEO Mượt mà: Tự động đổi tiêu đề trang theo tên Tour
export async function generateMetadata({ params }) {
  // BẮT BUỘC: Phải await params trước khi dùng id
  const { id } = await params; 
  
  // Validate id
  if (!id || isNaN(Number(id))) {
    return {
      title: "Tour không tìm thấy | VietTravel Luxury",
      description: "Tour không tồn tại hoặc ID không hợp lệ",
    };
  }
  
  const tour = await prisma.tours.findUnique({ 
    where: { id: Number(id) } 
  });

  return {
    title: `${tour?.title || "Tour du lịch"} | VietTravel Luxury`,
    description: tour?.description?.substring(0, 160) || "Khám phá Việt Nam cùng trợ lý AI",
  };
}

export default async function TourDetailPage({ params }) {
  // BẮT BUỘC: Giải nén params bằng await để tránh lỗi P1001/Validation
  const { id } = await params; 

  // Validate id
  if (!id || isNaN(Number(id))) {
    return notFound();
  }

  const tour = await prisma.tours.findUnique({
    where: { id: Number(id) },
    include: { 
      tour_categories: true, 
      tour_images: {
        where: { is_primary: true },
        take: 1
      }
    }
  });

  if (!tour) return notFound();

  // Fetch applicable promotions for this tour
  const now = new Date();
  const applicablePromotions = await prisma.promotions.findMany({
    where: {
      is_active: true,
      start_date: { lte: now },
      end_date: { gte: now },
      OR: [
        { category_name: null },
        { category_name: tour.tour_categories?.category_name }
      ]
    },
    orderBy: { discount_value: 'desc' }
  });

  // Calculate best discount
  let bestDiscount = null;
  let discountedPrice = Number(tour.price);

  if (applicablePromotions.length > 0) {
    for (const promo of applicablePromotions) {
      let discountAmount = 0;
      if (promo.discount_type === 'percentage') {
        discountAmount = (Number(tour.price) * Number(promo.discount_value)) / 100;
      } else {
        discountAmount = Number(promo.discount_value);
      }
      
      if (discountAmount > 0) {
        const finalPrice = Math.max(0, Number(tour.price) - discountAmount);
        if (finalPrice < discountedPrice) {
          discountedPrice = finalPrice;
          bestDiscount = {
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            discount_amount: discountAmount
          };
        }
      }
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          
          {/* Cột trái: Thông tin chi tiết */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-slate-900">
                {tour.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold">
                <span className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs uppercase tracking-widest">
                  {tour.tour_categories?.category_name || "Tour Đặc Sắc"}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <MapPin size={18} /> {tour.location_name}
                </span>
                <span className="flex items-center gap-1 text-orange-400">
                  <Star size={18} fill="currentColor" /> 4.9 (Đánh giá cao)
                </span>
              </div>
            </div>

            {/* Ảnh Tour */}
            <div className="rounded-[48px] overflow-hidden h-[400px] md:h-[650px] shadow-2xl relative">
              <Image 
                src={tour.tour_images[0]?.image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200"} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
                alt={tour.title}
                fill
                sizes="(max-width: 1200px)"
              />
            </div>

            {/* Mô tả chi tiết hành trình */}
            <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Info className="text-blue-600" /> Chi tiết hành trình
              </h3>
              <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap mb-8">
                {tour.description || "Hành trình đẳng cấp đang chờ đón bạn khám phá..."}
              </div>

              {/* Lịch trình theo ngày */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-800 mb-4">Lịch trình chi tiết</h4>
                {tour.duration_days ? (
                  Array.from({ length: tour.duration_days }, (_, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-800 mb-1">Ngày {i + 1}</h5>
                        <p className="text-slate-600 text-sm">
                          {i === 0 ? 'Khởi hành từ điểm tập kết, bắt đầu hành trình khám phá' : 
                           i === tour.duration_days - 1 ? 'Kết thúc hành trình, trở về điểm xuất phát' :
                           `Tiếp tục khám phá các điểm đến hấp dẫn theo lịch trình`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-800 mb-1">Ngày 1</h5>
                      <p className="text-slate-600 text-sm">Khởi hành và khám phá theo lịch trình tour</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
{/* Bản đồ */}
<div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
  <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
    <MapPin className="text-blue-600" /> Điểm đến trên bản đồ
  </h3>
  <div className="rounded-2xl overflow-hidden h-[400px] bg-slate-200 relative shadow-inner border border-slate-100">
    {tour.map_url ? (
      /* KHÔNG DÙNG KEY: Nhúng trực tiếp iframe chính xác của tour này từ DB */
      <iframe
        src={tour.map_url}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={tour.title}
      ></iframe>
    ) : (
      /* Trạng thái hiển thị dự phòng nếu bạn chưa kịp chèn link nhúng vào Database */
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <MapPin size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">{tour.location_name}</p>
          <p className="text-slate-400 text-sm mt-2 italic">Bản đồ tour đang được cập nhật...</p>
        </div>
      </div>
    )}
  </div>
</div>

            {/* Đánh giá */}
            <ReviewSystem tourId={tour.id} />
          </div>

          {/* Cột phải: Form đặt chỗ */}
          <aside className="lg:col-span-1">
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl sticky top-28 border border-white/5">
              <div className="mb-10">
                {bestDiscount ? (
                  <>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Giá gốc</p>
                    <p className="text-2xl font-black text-slate-400 line-through mb-2">
                      {Number(tour.price).toLocaleString()}đ
                    </p>
                    <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                      Giảm {bestDiscount.discount_type === 'percentage' ? `${bestDiscount.discount_value}%` : `${Number(bestDiscount.discount_value).toLocaleString()}đ`}
                    </p>
                    <h2 className="text-5xl font-black text-green-400">
                      {discountedPrice.toLocaleString()}đ
                    </h2>
                    <div className="mt-2 bg-green-500/20 border border-green-500/30 rounded-xl px-3 py-2">
                      <p className="text-green-300 text-xs font-bold">
                        Mã: {bestDiscount.code}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Giá khởi hành</p>
                    <h2 className="text-5xl font-black text-blue-400">
                      {Number(tour.price).toLocaleString()}đ
                    </h2>
                  </>
                )}
              </div>

              {/* Form đặt tour - Truyền dữ liệu sang component con */}
              <BookingForm tourId={tour.id} price={discountedPrice} originalPrice={tour.price} bestDiscount={bestDiscount} />

              {/* Cam kết dịch vụ */}
              <div className="mt-8 space-y-4 pt-8 border-t border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-blue-500" /> Bảo hiểm du lịch 1 tỷ đồng
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-blue-500" /> Hoàn hủy miễn phí 24h
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}