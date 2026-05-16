'use client';



import { useState } from 'react';

import Header from "../components/Header";

import Footer from "../components/Footer";

import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";



const faqs = [

  {

    question: "Làm thế nào để đặt tour?",

    answer: "Bạn có thể đặt tour trực tiếp trên website bằng cách chọn tour mong muốn, điền thông tin liên lạc và thanh toán. Hoặc bạn có thể gọi hotline 1900 1234 để được hỗ trợ đặt tour qua điện thoại."

  },

  {

    question: "Các phương thức thanh toán được chấp nhận?",

    answer: "Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ, ví điện tử (Momo, ZaloPay) và tiền mặt tại văn phòng."

  },

  {

    question: "Tôi có thể hủy hoặc đổi tour sau khi đặt không?",

    answer: "Có, bạn có thể hủy hoặc đổi tour miễn phí trong vòng 24 giờ sau khi đặt. Sau thời gian này, phí hủy/đổi sẽ được áp dụng tùy theo thời điểm hủy trước ngày khởi hành."

  },

  {

    question: "Giá tour đã bao gồm những gì?",

    answer: "Giá tour thường bao gồm: vé máy bay/khách sạn theo lịch trình, xe đưa đón, ăn uống theo chương trình, vé tham quan, hướng dẫn viên du lịch. Chi phí cá nhân và bảo hiểm du lịch có thể không bao gồm."

  },

  {

    question: "Tour có phù hợp cho trẻ em và người cao tuổi không?",

    answer: "Hầu hết các tour của chúng tôi đều phù hợp cho mọi lứa tuổi. Tuy nhiên, một số tour trekking hoặc mạo hiểm có thể có giới hạn độ tuổi. Vui lòng kiểm tra chi tiết tour trước khi đặt."

  },

  {

    question: "Tôi cần chuẩn bị gì trước khi đi tour?",

    answer: "Sau khi đặt tour, chúng tôi sẽ gửi email hướng dẫn chi tiết về việc chuẩn bị giấy tờ, hành lý, và các lưu ý quan trọng. Bạn cũng có thể liên hệ với chúng tôi bất cứ lúc nào để được tư vấn."

  },

  {

    question: "Có bảo hiểm du lịch không?",

    answer: "Có, tất cả các tour của chúng tôi đều bao gồm bảo hiểm du lịch với mức bảo hiểm lên đến 1 tỷ đồng. Bạn có thể mua thêm bảo hiểm nâng cao nếu mong muốn."

  },

  {

    question: "Làm thế nào để liên hệ hỗ trợ trong chuyến đi?",

    answer: "Mỗi tour đều có hướng dẫn viên đi kèm và số hotline hỗ trợ 24/7. Bạn có thể liên hệ bất cứ lúc nào khi cần hỗ trợ khẩn cấp."

  }

];



export default function FAQPage() {

  const [openIndex, setOpenIndex] = useState(null);



  const toggleFAQ = (index) => {

    setOpenIndex(openIndex === index ? null : index);

  };



  return (

    <div className="min-h-screen bg-white">

      <Header />

      <main className="container mx-auto px-4 py-24">

        <div className="max-w-4xl mx-auto">

          {/* Header */}

          <div className="text-center mb-16">

            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">

              <HelpCircle className="text-blue-600" size={40} />

            </div>

            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4">

              Câu hỏi thường gặp

            </h1>

            <p className="text-xl text-slate-600 font-bold max-w-2xl mx-auto">

              Tìm câu trả lời cho những thắc mắc phổ biến về dịch vụ của chúng tôi

            </p>

          </div>



          {/* FAQ List */}

          <div className="space-y-4">

            {faqs.map((faq, index) => (

              <div

                key={index}

                className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"

              >

                <button

                  onClick={() => toggleFAQ(index)}

                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"

                >

                  <span className="font-black text-slate-800 text-lg pr-4">

                    {faq.question}

                  </span>

                  {openIndex === index ? (

                    <ChevronUp className="text-blue-600 flex-shrink-0" size={24} />

                  ) : (

                    <ChevronDown className="text-slate-400 flex-shrink-0" size={24} />

                  )}

                </button>

                {openIndex === index && (

                  <div className="px-6 pb-5 pt-0">

                    <p className="text-slate-600 leading-relaxed">

                      {faq.answer}

                    </p>

                  </div>

                )}

              </div>

            ))}

          </div>



          {/* Contact CTA */}

          <div className="mt-16 bg-gradient-to-r from-blue-600 to-slate-900 rounded-3xl p-8 text-center text-white">

            <h2 className="text-2xl font-black mb-4">Không tìm thấy câu trả lời?</h2>

            <p className="text-blue-100 mb-6">

              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp bạn

            </p>

            <a

              href="/contact"

              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-black hover:bg-blue-50 transition-colors"

            >

              Liên hệ ngay

            </a>

          </div>

        </div>

      </main>

      <Footer />

    </div>

  );

}