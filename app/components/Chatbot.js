"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Send, X, Bot } from "lucide-react";
import axios from "axios"; // Đảm bảo bạn đã install bằng lệnh: npm install axios

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Chào bạn! Mình là trợ lý ảo của Hoa Binh Travel. Bạn cần mình tư vấn điều gì? ✈️" }
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
      e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt
    }
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('closeChatbot'));
  };

  // HÀM XỬ LÝ GỬI TIN NHẮN GỌI API THẬT
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    // 1. Đẩy tin nhắn của User lên màn hình chat ngay lập tức
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true); // Bật trạng thái AI đang gõ

    try {
      // 2. Gọi API đến Backend Node.js của bạn
      // Thay đổi URL 'http://localhost:5000/api/chat' cho đúng với port backend của bạn
      const response = await axios.post("http://localhost:5000/api/chat", {
        message: userMsg
      });

      setIsTyping(false);

      if (response.data && response.data.reply) {
        // 3. Đẩy câu trả lời thông minh của Gemini API lên màn hình
        setMessages(prev => [...prev, { sender: "bot", text: response.data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: "bot", text: "Hệ thống đang bận, bạn vui lòng thử lại sau nhé!" }]);
      }

    } catch (error) {
      console.error("Lỗi kết nối Chatbot API:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: "bot", text: "Kết nối đến máy chủ thất bại. Vui lòng kiểm tra lại!" }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[10000] w-[90vw] md:w-[380px] animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col h-[500px] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
              <Bot className="text-white" size={18} />
            </div>
            {/* Đổi tên hiển thị cho chuẩn thương hiệu đồ án của bạn */}
            <h3 className="text-white font-black text-sm">Hoa Binh Travel AI</h3>
          </div>
          <button 
            onClick={handleClose} 
            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Khu vực hiển thị đoạn chat */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3.5 rounded-[20px] text-xs font-bold shadow-sm whitespace-pre-line ${
                msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Hiệu ứng bong bóng ba chấm khi AI đang xử lý */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-400 p-3.5 rounded-[20px] rounded-bl-none text-xs shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-5 bg-white border-t border-slate-100">
          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-blue-600 transition-all">
            <input
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} // Cập nhật từ onKeyPress sang onKeyDown chuẩn React mới
              placeholder="Hỏi về tour, giá vé, chính sách hoàn hủy..."
              className="flex-1 bg-transparent px-3 py-1.5 font-bold text-slate-700 outline-none text-[13px]"
            />
            <button onClick={handleSend} className="bg-blue-600 text-white p-2.5 rounded-xl active:scale-90 transition-all">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}