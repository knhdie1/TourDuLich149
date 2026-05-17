'use client';

import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { Send, X, MessageSquare, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'; // Import Link của Next.js để chuyển trang không bị reload

// ========================================================
// 1. ĐỊNH NGHĨA CONTEXT KHÉP KÍN ĐỂ ĐẢM BẢO THỨ TỰ TẢI
// ========================================================
const ChatContext = createContext(undefined);

function LocalChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Xin chào! Tôi là trợ lý ảo của VietTravel. Tôi có thể giúp gì cho chuyến đi của bạn?' }
  ]);
  
  // Thêm một state để xác định xem component đã được nạp hoàn toàn ở client chưa
  const [mounted, setMounted] = useState(false);

  // Chỉ đọc localStorage SAU KHI component đã mounted ở client (Chặn đứng lỗi Hydration)
  useEffect(() => {
    setMounted(true);

    const savedStatus = localStorage.getItem('chat_status');
    if (savedStatus === 'open') {
      setIsOpen(true);
    }

    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Lỗi parse lịch sử chat:", e);
      }
    }
  }, []);

  // Lắng nghe thay đổi giữa các tab
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e) => {
      if (e.key === 'chat_messages' && e.newValue) {
        setMessages(JSON.parse(e.newValue));
      }
      if (e.key === 'chat_status' && e.newValue) {
        setIsOpen(e.newValue === 'open');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  const toggleChat = (status) => {
    const nextStatus = typeof status === 'boolean' ? status : !isOpen;
    setIsOpen(nextStatus);
    localStorage.setItem('chat_status', nextStatus ? 'open' : 'closed');
  };

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem('chat_messages', JSON.stringify(newMessages));
  };

  const clearChat = () => {
    const initialMsg = [{ sender: 'bot', text: 'Xin chào! Tôi là trợ lý ảo của VietTravel. Tôi có thể giúp gì cho chuyến đi của bạn?' }];
    setMessages(initialMsg);
    localStorage.setItem('chat_messages', JSON.stringify(initialMsg));
  };

  // Nếu chưa mounted (vẫn đang ở server hoặc vừa nạp), render giao diện ẩn để khớp với server HTML
  if (!mounted) {
    return (
      <ChatContext.Provider value={{ isOpen: false, toggleChat, messages, updateMessages, clearChat }}>
        {children}
      </ChatContext.Provider>
    );
  }

  return (
    <ChatContext.Provider value={{ isOpen, toggleChat, messages, updateMessages, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

function useLocalChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat phải được sử dụng bên trong một ChatProvider');
  }
  return context;
}

// ========================================================
// 2. GIAO DIỆN VÀ LOGIC CHAT THỰC TẾ
// ========================================================
function ChatbotInner() {
  const { isOpen, toggleChat, messages, updateMessages, clearChat } = useLocalChat();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageText = input.trim();
    const updatedMessages = [...messages, { sender: "user", text: userMessageText }];
    
    updateMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const formattedHistory = updatedMessages.map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: typeof msg.text === "string" ? msg.text : "" }]
      }));

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageText,
          history: formattedHistory,
        }),
      });

      const data = await response.json();

      if (response.ok && data.text) {
        updateMessages([...updatedMessages, { sender: "bot", text: data.text }]);
      } else {
        updateMessages([...updatedMessages, { sender: "bot", text: "Dạ, hệ thống đang bận một chút, bạn thử lại sau nhé." }]);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      updateMessages([...updatedMessages, { sender: "bot", text: "Kết nối mạng không ổn định." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[99999] flex flex-col items-end gap-4 selection:bg-none">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[90vw] md:w-[380px] h-[500px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex justify-between items-center text-white">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><Bot size={20} /></div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">VietTravel AI</h3>
                    {messages.length > 1 && (
                      <button onClick={() => { if(confirm("Xóa lịch sử chat?")) clearChat(); }} className="text-[10px] text-white/70 hover:text-white underline block text-left">Xóa lịch sử</button>
                    )}
                  </div>
               </div>
               <button onClick={() => toggleChat(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
            </div>

            {/* Khung tin nhắn */}
            <div ref={scrollRef} className="flex-1 p-5 bg-slate-50/50 overflow-y-auto space-y-4">
               {messages.map((msg, index) => (
                 <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    <div className={`max-w-[85%] p-3.5 rounded-[20px] text-xs font-bold shadow-sm whitespace-pre-line ${
                      msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                    }`}>
                      {msg.sender === 'user' ? (
                        msg.text
                      ) : (
                        (() => {
                          const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                          const hasLink = markdownLinkRegex.test(msg.text);
                          if (!hasLink) return msg.text;

                          const parts = [];
                          let lastIndex = 0;
                          let match;
                          markdownLinkRegex.lastIndex = 0;

                          while ((match = markdownLinkRegex.exec(msg.text)) !== null) {
                            if (match.index > lastIndex) parts.push(msg.text.substring(lastIndex, match.index));
                            
                            const url = match[2];
                            const isInternalLink = url.startsWith('/');

                            parts.push(
                              isInternalLink ? (
                                /* SỬA TẠI ĐÂY: Sử dụng <Link> của Next.js cho đường dẫn tương đối để chuyển trang SPA mượt mà */
                                <Link 
                                  key={match.index} 
                                  href={url} 
                                  className="block my-2 p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all text-center cursor-pointer"
                                >
                                  {match[1]} →
                                </Link>
                              ) : (
                                /* Giữ nguyên thẻ <a> cho các liên kết bên ngoài (Zalo, Facebook) */
                                <a 
                                  key={match.index} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="block my-2 p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all text-center cursor-pointer"
                                >
                                  {match[1]} →
                                </a>
                              )
                            );
                            lastIndex = markdownLinkRegex.lastIndex;
                          }
                          if (lastIndex < msg.text.length) parts.push(msg.text.substring(lastIndex));
                          return <div className="space-y-1">{parts}</div>;
                        })()
                      )}
                    </div>
                 </div>
               ))}
               {isTyping && <div className="text-[10px] font-black text-slate-400 ml-2 animate-pulse uppercase">AI đang xử lý...</div>}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
               <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-blue-600 transition-all">
                  <input 
                    type="text" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập tin nhắn..." disabled={isTyping}
                    className="flex-1 bg-transparent px-3 py-1.5 outline-none text-xs font-bold text-slate-700" 
                  />
                  <button onClick={handleSend} disabled={isTyping} className="bg-blue-600 text-white p-2.5 rounded-xl active:scale-90 transition-all disabled:bg-slate-300">
                    <Send size={16} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nút Toggle */}
      <div className="flex flex-col gap-4 items-center">
        {!isOpen && (
          <>
            <motion.a initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} href="https://www.facebook.com/phamdangtien888/" target="_blank" className="bg-white p-1 rounded-[22px] shadow-xl hover:-translate-y-1 transition-all">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#1877F2"/><path d="M29.5 24H25.5V36H20.5V24H18.5V20H20.5V17.5C20.5 14.5 22.3 12.5 25.5 12.5C27 12.5 28.5 12.7 28.5 12.7V16.5H26.5C25.1 16.5 24.5 17.3 24.5 18.2V20H29L28.2 24H29.5Z" fill="white"/></svg>
            </motion.a>
            <motion.a initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} href="https://zalo.me/0862640720" target="_blank" className="bg-white p-1 rounded-[22px] shadow-xl hover:-translate-y-1 transition-all">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M0 12C0 5.37258 5.37258 0 12 0H36C42.6274 0 48 5.37258 48 12V36C48 42.6274 42.6274 48 36 48H12C5.37258 48 0 42.6274 0 36V12Z" fill="#0068FF"/><path d="M14 34.5V31.5L25.5 21.5H15.5V17.5H33.5V20.5L22 30.5H34.5V34.5H14Z" fill="white"/></svg>
            </motion.a>
          </>
        )}
        <button onClick={() => toggleChat(!isOpen)} className={`${isOpen ? 'bg-slate-800' : 'bg-gradient-to-br from-purple-600 to-indigo-700'} text-white w-16 h-16 rounded-[22px] shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300`}>
          {isOpen ? <X size={30} /> : <MessageSquare size={30} fill="white" />}
        </button>
      </div>
    </div>
  );
}

// ========================================================
// 3. EXPORT CHÍNH KHỐI ĐỘC LẬP ĐÃ BAO GỒM CẢ PROVIDER BÊN TRONG
// ========================================================
export default function FloatingContact() {
  return (
    <LocalChatProvider>
      <ChatbotInner />
    </LocalChatProvider>
  );
}