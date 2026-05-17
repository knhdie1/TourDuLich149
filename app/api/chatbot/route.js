import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    const filePath = path.join(process.cwd(), "faq.md");
    let knowledge = "";
    try {
      knowledge = fs.readFileSync(filePath, "utf8");
    } catch (fileError) {
      console.error("Lỗi đọc file tri thức:", fileError);
      return NextResponse.json(
        { text: "Hệ thống đang cập nhật tệp dữ liệu tri thức faq.md. Vui lòng thử lại sau!" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `Bạn là trợ lý ảo AI chuyên nghiệp của Hoa Binh Travel. Nhiệm vụ của bạn là đọc hiểu và sử dụng nguồn dữ liệu tri thức được cung cấp dưới đây để trả lời câu hỏi của khách hàng một cách ngắn gọn, thân thiện và chính xác bằng tiếng Việt.\n\nNếu thông tin khách hỏi không có trong tài liệu tri thức, hãy khéo léo từ chối và hướng dẫn họ để lại số điện thoại hoặc liên hệ Hotline/Zalo hiển thị trên màn hình để được nhân viên hỗ trợ trực tiếp.\n\nNguồn dữ liệu tri thức:\n${knowledge}`,
    });

    let cleanHistory = history || [];
    if (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
      cleanHistory = cleanHistory.slice(1);
    }

    const chatSession = model.startChat({
      history: cleanHistory,
    });

    const result = await chatSession.sendMessage(message);
    let responseText = result.response.text();

    // Tự động làm sạch đường dẫn tuyệt đối
    if (responseText) {
      responseText = responseText.replace(/https?:\/\/(www\.)?travelluxury\.id\.vn/g, "");
      responseText = responseText.replace(/https?:\/\/localhost:\d+/g, "");
    }

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("Lỗi nghiêm trọng tại Chatbot API Route:", error);
    return NextResponse.json(
      { text: "Dạ, hệ thống AI đang bận xử lý dữ liệu chuyến đi, bạn chờ em một xíu nhé!" },
      { status: 500 }
    );
  }
}