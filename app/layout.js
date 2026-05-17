import { Be_Vietnam_Pro } from "next/font/google";
import FloatingContact from './components/FloatingContact';
import { Toaster } from 'react-hot-toast';
import "./globals.css"; 

// 1. Cấu hình Font và Metadata phải được đưa lên TRÊN CÙNG
const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '700', '900'],
  subsets: ["vietnamese"],
  variable: "--font-be-vietnam",
});

export const metadata = {
  title: "VietTravel Luxury - Du lịch cao cấp",
  description: "Hệ thống đặt tour du lịch cao cấp",
};

// 2. Hàm render chính luôn nằm ở cuối cùng sau khi các cấu hình đã sẵn sàng
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      {/* Áp dụng class font biến toàn cục vào body để tối ưu hiển thị chữ tiếng Việt */}
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {children}
        
        {/* Chỉ gọi duy nhất FloatingContact ở đây */}
        <FloatingContact /> 
        
        <Toaster />
      </body>
    </html>
  );
}