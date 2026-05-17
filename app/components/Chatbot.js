"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import { Send, X, Bot, User } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Xin chào! Em là trợ lý ảo của VietTravel. Em có thể giúp gì cho anh/chị ạ? ✈️" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Lắng nghe lệnh MỞ chính xác
  useEffect(() => {
    const openMe = () => setIsOpen(true);
    window.addEventListener('openChatbot', openMe);
    return () => window.removeEventListener('openChatbot', openMe);
  }, []);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // CHỐT CHẶN: Ngăn chặn nhấn lần 2
    }
    setIsOpen(false);
    // Phát lệnh HIỆN LẠI cho bộ icon
    window.dispatchEvent(new CustomEvent('closeChatbot'));
  };

  // CHUYỂN ĐỔI SANG THAO TÁC BẤT ĐỒNG BỘ GỌI API GEMINI RAG
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageText = input.trim();
    setMessages(prev => [...prev, { sender: "user", text: userMessageText }]);
    setInput("");
    setIsTyping(true);

    try {
      // 1. Chuyển đổi lịch sử chat hiện tại sang định dạng chuẩn cấu hình SDK của Google
      // Cấu trúc yêu cầu: { role: "user" | "model", parts: [{ text: "..." }] }
      const formattedHistory = messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: typeof msg.text === "string" ? msg.text : "" }]
      }));

      // 2. Gửi request POST đến API Route xử lý RAG (/api/chatbot)
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageText,
          history: formattedHistory,
        }),
      });

      const data = await response.json();

      // 3. Cập nhật phản hồi từ chatbot vào giao diện
      if (response.ok && data.text) {
        setMessages(prev => [...prev, { sender: "bot", text: data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: "bot", text: "Dạ, hệ thống đang bận một chút, anh/chị thử lại sau nhé." }]);
      }
    } catch (error) {
      console.error("Lỗi kết nối API Chatbot:", error);
      setMessages(prev => [...prev, { sender: "bot", text: "Kết nối mạng không ổn định. Vui lòng kiểm tra lại." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null; // Sử dụng render điều kiện sạch sẽ

  return (
    <div className="fixed bottom-8 right-8 z-[10000] w-[90vw] md:w-[380px] animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col h-[500px] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
              <Bot className="text-white" size={18} />
            </div>
            <h3 className="text-white font-black text-sm">Hoa Binh Travel AI</h3>
          </div>
          {/* NÚT X - NHẤN PHÁT ĂN NGAY NHỜ STOP PROPAGATION */}
          <button 
            onClick={handleClose} 
            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* Thêm lớp 'whitespace-pre-line' để hỗ trợ tự động xuống hàng khi nhận format từ Markdown dữ liệu của Gemini */}
              <div className={`max-w-[80%] p-3.5 rounded-[20px] text-xs font-bold shadow-sm whitespace-pre-line ${
                msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* Hiệu ứng hiển thị trạng thái đang xử lý câu trả lời */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-400 p-3 rounded-[20px] rounded-bl-none text-[11px] font-medium shadow-sm animate-pulse">
                VietTravel AI đang xử lý...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-5 bg-white border-t border-slate-100">
          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-blue-600 transition-all">
            <input
              type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi của anh/chị..."
              disabled={isTyping}
              className="flex-1 bg-transparent px-3 py-1.5 font-bold text-slate-700 outline-none text-[13px] disabled:opacity-50"
            />
            <button 
              onClick={handleSend} 
              disabled={isTyping}
              className="bg-blue-600 text-white p-2.5 rounded-xl active:scale-90 transition-all disabled:bg-slate-300 disabled:scale-100"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}