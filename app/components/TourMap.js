'use client'; // Bắt buộc để Next.js hiểu đây là Client Component

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Tách phần chứa iframe ra để lazy load an toàn dưới trình duyệt
const MapIframe = dynamic(
  () => Promise.resolve(({ mapUrl, tourTitle, locationName }) => (
    <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
        <MapPin className="text-blue-600" /> Điểm đến trên bản đồ
      </h3>
      <div className="rounded-2xl overflow-hidden h-[400px] bg-slate-200 relative shadow-inner border border-slate-100">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={tourTitle}
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <MapPin size={48} className="text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">{locationName}</p>
              <p className="text-slate-400 text-sm mt-2 italic">Bản đồ tour đang được cập nhật...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )),
  { 
    ssr: false, // Ép chạy hoàn toàn dưới Client để chặn đứng Hydration Mismatch
    loading: () => (
      <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
        <div className="h-8 w-48 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="rounded-2xl h-[400px] bg-slate-100 animate-pulse" />
      </div>
    )
  }
);

export default function TourMap({ mapUrl, tourTitle, locationName }) {
  return <MapIframe mapUrl={mapUrl} tourTitle={tourTitle} locationName={locationName} />;
}