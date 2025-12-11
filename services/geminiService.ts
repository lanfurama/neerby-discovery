
import { GoogleGenAI } from "@google/genai";
import { Coordinates, Restaurant, GroundingSource, SearchResult } from '../types';

// Debug: Log API key status (without exposing the full key)
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("API_KEY environment variable not set");
    console.error("process.env.API_KEY:", process.env.API_KEY ? "***" + process.env.API_KEY.slice(-4) : "undefined");
    console.error("process.env.GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "***" + process.env.GEMINI_API_KEY.slice(-4) : "undefined");
    throw new Error("API_KEY environment variable not set");
}

console.log("API Key loaded:", apiKey ? "***" + apiKey.slice(-4) : "NOT FOUND");

const ai = new GoogleGenAI({ apiKey });

interface SearchParams {
  categories: string[];
  radius: number;
  isThinkingMode: boolean;
  location: Coordinates;
}

// Retry helper function with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (503, 429, or network errors)
      const errorMessage = error?.message || '';
      const isRetryable = 
        errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('UNAVAILABLE');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Unknown error occurred');
};

export const findEateries = async ({ categories, radius, isThinkingMode, location }: SearchParams): Promise<SearchResult> => {
  const modelName = 'gemini-2.5-flash'; // Using Flash with Search is faster and very effective for this
  const query = categories.join(' or ');
  
  // We use Google Search to find menus and Grab/Shopee presence, which Maps tool often lacks.
  // We explicitly ask for JSON output in the prompt because we cannot use responseSchema with googleSearch.
  const prompt = `
    Bạn là một chuyên gia phân tích thị trường chuyên nghiệp.
    Thực hiện tìm kiếm cho "${query}" trong bán kính ${radius}km từ tọa độ latitude ${location.latitude}, longitude ${location.longitude}.
    
    Mục tiêu nghiên cứu cụ thể:
    1. Xác định các cơ sở được đánh giá cao nhất.
    2. TÌM THÔNG TIN LIÊN HỆ: Tìm số điện thoại và email (kiểm tra Facebook/Instagram/Website nếu có).
    3. SỰ HIỆN DIỆN TRÊN NỀN TẢNG GIAO HÀNG: Tìm kiếm cụ thể xem họ có được liệt kê trên "GrabFood" hoặc "ShopeeFood" không.
    4. PHÂN TÍCH MENU ĐẦY ĐỦ: Trích xuất menu HOÀN CHỈNH với tất cả các món. Đối với mỗi nhà hàng, tìm:
       - Tất cả các món ăn với tên
       - Giá (nếu có)
       - Danh mục (ví dụ: "Khai vị", "Món chính", "Tráng miệng", "Đồ uống")
       - Mô tả bằng TIẾNG VIỆT (nếu có, mô tả ngắn gọn về món ăn)
       - Cố gắng lấy ít nhất 10-20 món ăn cho mỗi nhà hàng, càng nhiều càng tốt
    
    Định dạng đầu ra:
    Bạn phải xuất JSON hợp lệ nghiêm ngặt trong khối code \`\`\`json ... \`\`\`.
    Cấu trúc JSON phải là một danh sách các đối tượng với các trường sau:
    - name (string: tên nhà hàng)
    - address (string: địa chỉ)
    - description (string: tóm tắt chuyên nghiệp về doanh nghiệp)
    - email (string | null)
    - phone (string | null)
    - menu (mảng các đối tượng với: name (tên món), price (giá, tùy chọn), description (mô tả bằng TIẾNG VIỆT, tùy chọn), category (danh mục bằng TIẾNG VIỆT, tùy chọn))
    - platforms (mảng các chuỗi: ví dụ ["GrabFood", "ShopeeFood", "Gojek"])
    - rating (string | null: ví dụ "4.5/5")

    KHÔNG bao gồm văn bản markdown bên ngoài khối JSON.
    QUAN TRỌNG: Tất cả description của menu items phải được viết bằng TIẾNG VIỆT.
  `;

  const config: any = { 
    tools: [{ googleSearch: {} }],
  };
      
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });
    });

    const textResponse = response.text || "";
    
    // Extract JSON from the markdown code block
    let restaurants: Restaurant[] = [];
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/```([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
        try {
            restaurants = JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error("Failed to parse JSON from model output", e);
        }
    } else {
        // Fallback: try parsing raw text if model forgot code blocks
        try {
            const cleanText = textResponse.replace(/```json/g, '').replace(/```/g, '');
            restaurants = JSON.parse(cleanText);
        } catch (e) {
            console.warn("Could not parse JSON structure from response.");
        }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
        .map((chunk: any) => {
            const web = chunk.web;
            if (web && web.uri && web.title) {
                return { uri: web.uri, title: web.title };
            }
            return null;
        })
        .filter((source: GroundingSource | null): source is GroundingSource => source !== null);

    // If parsing failed completely but we have text, return a dummy error entry so the user sees something
    if (restaurants.length === 0 && textResponse.length > 0) {
        return { 
            restaurants: [{ 
                name: "Analysis Error", 
                address: "N/A", 
                description: "The AI conducted the research but the data structure was malformed. Please try again.",
                menuHighlights: [],
                platforms: []
            }], 
            sources 
        };
    }

    return { restaurants, sources };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
