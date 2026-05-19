const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Bắt đầu tối ưu hóa từ khóa và cập nhật bản đồ chuẩn xác cho các tour...');

  const allTours = await prisma.tours.findMany();
  console.log(`📊 Tìm thấy tổng cộng ${allTours.length} tour cần xử lý.`);

  let count = 0;

  for (const tour of allTours) {
    const province = (tour.location_name && tour.location_name.trim() !== 'Việt Nam') ? tour.location_name.trim() : '';
    let tourTitle = tour.title ? tour.title.trim() : '';

    // Bước 1: Bóc tách lấy địa danh cốt lõi từ tiêu đề tour
    let corePlace = tourTitle;
    
    // Nếu có dấu gạch ngang " - ", thường địa danh cụ thể nằm ở vế sau (Ví dụ: "Hà Nội - Vịnh Hạ Long")
    if (corePlace.includes(' - ')) {
      const parts = corePlace.split(' - ');
      corePlace = parts[1] ? parts[1].trim() : parts[0].trim();
    }
    
    // Nếu có dấu gạch chéo " / " hoặc " | "
    if (corePlace.includes('/')) corePlace = corePlace.split('/')[0].trim();
    if (corePlace.includes('|')) corePlace = corePlace.split('|')[0].trim();

    // Bước 2: Lọc bỏ toàn bộ "từ rác" ngành du lịch để tránh làm nhiễu Google Maps
    let cleanSearchText = corePlace
      // Xóa các cụm từ marketing/loại hình tour tiếng Việt
      .replace(/Hành trình di sản|Hành trình|Xuyên Việt|Khám phá|Du ngoạn|Nghỉ dưỡng|Trọn gói|Giá tốt/gi, '')
      .replace(/Kinh đô|Tuyệt tác|Thiên đường|Kỳ quan|Huyền thoại|Tour du lịch|Tour/gi, '')
      .replace(/Khởi hành từ|Bay từ|Mùa hoa|Mùa thu|Mùa hè/gi, '')
      // Xóa các từ tiếng Anh chuyên ngành du lịch
      .replace(/MICE|Business Retreat|Luxury|Organic|Food Tour|Adventure|Retreat|Classic|Daily/gi, '')
      // Xóa thông tin thời gian (Ngày, Đêm, 4N3Đ, 3N2Đ...)
      .replace(/Ngày|Đêm/gi, '')
      .replace(/\d+\s*[nN]\s*\d+\s*[đĐ]/g, '') // Xóa dạng 4N3Đ, 3n2đ
      .replace(/\d+/g, '')                      // Xóa số lẻ còn sót lại
      .replace(/[()-]/g, '')                    // Xóa các ký tự ngoặc đơn hoặc gạch ngang thừa
      .replace(/\s+/g, ' ')                     // Thu gọn khoảng trắng thừa
      .trim();

    // Bước 3: Tổ hợp từ khóa thông minh giữa Tỉnh (Province) và Địa danh cụ thể
    let finalQuery = '';
    if (province) {
      // Nếu trong tên địa danh đã chứa tên Tỉnh/Thành rồi thì không cộng chuỗi trùng lặp
      if (cleanSearchText.toLowerCase().includes(province.toLowerCase())) {
        finalQuery = cleanSearchText;
      } else {
        // Kết hợp dạng: "Vịnh Hạ Long Quảng Ninh" hoặc "Bà Nà Hills Đà Nẵng" -> Google tìm chính xác 100%
        finalQuery = `${cleanSearchText} ${province}`;
      }
    } else {
      finalQuery = cleanSearchText || 'Việt Nam';
    }

    // Làm sạch lại một lần cuối trước khi mã hóa URL
    finalQuery = finalQuery.replace(/\s+/g, ' ').trim();

    // Bước 4: Mã hóa chuỗi thành chuẩn URL và tạo link Embed CHÍNH THỨC của Google Maps
    const queryEncoded = encodeURIComponent(finalQuery);
    
    // Cấu trúc URL nhúng Iframe chuẩn của Google, hỗ trợ zoom (z=13) tốt cho khu du lịch
    const standardGoogleMapEmbedUrl = `https://maps.google.com/maps?q=${queryEncoded}&z=13&output=embed`;

    // Cập nhật vào Cơ sở dữ liệu
    await prisma.tours.update({
      where: { id: tour.id },
      data: { map_url: standardGoogleMapEmbedUrl },
    });

    console.log(`📍 Tour ID ${tour.id}: "${tourTitle}" ➔ Từ khóa tìm bản đồ: "${finalQuery}"`);
    count++;
  }

  console.log(`\n✅ Thành công! Đã tối ưu hóa và chèn bản đồ chuẩn xác cho ${count} tour.`);
}

main()
  .catch((e) => {
    console.error('❌ Gặp lỗi khi chạy script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });