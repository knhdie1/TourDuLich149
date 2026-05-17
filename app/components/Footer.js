import { Mail, Phone, MapPin } from "lucide-react";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white">Viet<span className="text-blue-400">Travel</span></h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Trải nghiệm du lịch Luxury cùng trí tuệ nhân tạo số 1 Việt Nam. Khám phá những hành trình đáng nhớ.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-white">Liên kết nhanh</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">Trang chủ</Link></li>
              <li><Link href="/search" className="hover:text-blue-400 transition-colors">Tìm tour</Link></li>
              <li><Link href="/customer/bookings" className="hover:text-blue-400 transition-colors">Lịch sử đặt tour</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Đăng nhập</Link></li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-white">Điểm đến nổi bật</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link href="/search?q=Đà Nẵng" className="hover:text-blue-400 transition-colors">Tour Đà Nẵng</Link></li>
              <li><Link href="/search?q=Phú Quốc" className="hover:text-blue-400 transition-colors">Tour Phú Quốc</Link></li>
              <li><Link href="/search?q=Hà Nội" className="hover:text-blue-400 transition-colors">Tour Hà Nội</Link></li>
              <li><Link href="/search?q=TP.HCM" className="hover:text-blue-400 transition-colors">Tour TP.HCM</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-white">Liên hệ</h4>
            <div className="space-y-3 text-slate-400 text-sm">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-blue-400" />
                <span>0862 640 720</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-blue-400" />
                <span>info@viettravel.vn</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-blue-400" />
                <span>484 Lạch Tray, Đổng Quốc Bình, Hải Phòng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400 text-sm">
          <p> 2026 VietTravel - Hệ thống đặt tour du lịch</p>
          <p className="mt-2"> VietTravel - Hướng tới trải nghiệm du lịch tốt nhất</p>
        </div>
      </div>
    </footer>
  );
}