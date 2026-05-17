'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // Để mảng rỗng ban đầu để tránh lệch dữ liệu Server-Client
  const [isMounted, setIsMounted] = useState(false); // Kiểm tra xem Client đã load xong chưa

  // 1. Chỉ chạy dưới Client sau khi trang đã mount thành công
  useEffect(() => {
    setIsMounted(true);

    // Đọc lịch sử chat thực tế dưới máy người dùng
    const savedMessages = localStorage.getItem('viet_chat_history');
    if (savedMessages) {
      try { 
        setMessages(JSON.parse(savedMessages)); 
      } catch (e) { 
        console.error(e); 
      }
    } else {
      // Nếu là lần đầu tiên vào web (chưa có lịch sử), gán câu chào mặc định
      setMessages([
        { sender: "bot", text: "Chào bạn! VietTravel có thể giúp gì cho bạn không? ✈️" }
      ]);
    }

    // Đọc trạng thái đóng/mở
    const savedOpenState = localStorage.getItem('viet_chat_open');
    if (savedOpenState) {
      setIsOpen(savedOpenState === 'true');
    }
  }, []);

  // 2. LẮNG NGHE SỰ KIỆN THAY ĐỔI TỪ TAB KHÁC
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'viet_chat_history' && e.newValue) {
        setMessages(JSON.parse(e.newValue));
      }
      if (e.key === 'viet_chat_open' && e.newValue) {
        setIsOpen(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 3. Hàm cập nhật trạng thái đóng/mở
  const toggleChat = (openState) => {
    setIsOpen(openState);
    localStorage.setItem('viet_chat_open', openState);
  };

  // 4. Hàm cập nhật tin nhắn
  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem('viet_chat_history', JSON.stringify(newMessages));
  };

  const clearChat = () => {
    localStorage.removeItem('viet_chat_history');
    localStorage.removeItem('viet_chat_open');
    setMessages([{ sender: "bot", text: "Chào bạn! VietTravel có thể giúp gì cho bạn không? ✈️" }]);
    setIsOpen(false);
  };

  // Nếu phía client chưa sẵn sàng, trả về giao diện rỗng tạm thời để tránh lỗi đồng bộ Next.js
  if (!isMounted) return <>{children}</>;

  return (
    <ChatContext.Provider value={{ isOpen, toggleChat, messages, updateMessages, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}
// Đảm bảo phải có từ khóa return và truyền đúng biến ChatContext vào trong
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat phải được sử dụng bên trong một ChatProvider");
  }
  return context;
};