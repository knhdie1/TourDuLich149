import fs from 'fs';
import path from 'path';
import FAQClient from './faqclient'; // Import file xử lý giao diện

export default async function FAQPage() {
  // Đọc file .md từ thư mục dự án
  const filePath = path.join(process.cwd(), 'data', 'faq.md');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Khởi tạo mảng bóc tách câu hỏi từ file .md
  const faqs = [];
  const lines = fileContent.split('\n');
  let currentFaq = {};

  lines.forEach(line => {
    if (line.startsWith('Q: ')) {
      currentFaq = { question: line.replace('Q: ', '').trim() };
    } else if (line.startsWith('A: ')) {
      currentFaq.answer = line.replace('A: ', '').trim();
      faqs.push(currentFaq);
    }
  });

  // Truyền mảng faqs đã bóc tách sang Client Component
  return <FAQClient faqs={faqs} />;
}