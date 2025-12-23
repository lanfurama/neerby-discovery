
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
  // Tạo mô tả category rõ ràng hơn
  const categoryDescriptions: Record<string, string> = {
    'Coffee': 'coffee shops, cafes, coffee houses',
    'Restaurant': 'restaurants, dining establishments',
    'Bistro': 'bistros, casual dining restaurants',
    'Street Food': 'street food vendors, food stalls, street food establishments',
    'Bakery': 'bakeries, pastry shops',
    'Resort/Hotel': 'resorts, hotels, lodging establishments, accommodation facilities',
  };
  
  const categoryQuery = categories.map(cat => {
    const desc = categoryDescriptions[cat] || cat.toLowerCase();
    return desc;
  }).join(' or ');
  
  const prompt = `
    Use Google Maps to search for ${categoryQuery} within ${radius}km radius from coordinates: ${location.latitude}, ${location.longitude}.
    
    CRITICAL REQUIREMENTS:
    1. Use Google Maps search tool to find places near the specified coordinates
    2. Only return establishments that match the requested category: ${categories.join(', ')}
    3. If searching for "Resort/Hotel", do NOT include cafes, coffee shops, or restaurants
    4. If searching for "Coffee", do NOT include hotels or resorts
    5. Each result MUST include latitude and longitude coordinates from Google Maps
    6. Filter results to only include places within ${radius}km from the center point
    
    For each establishment found, extract:
    1. Name, address, and exact coordinates (latitude, longitude) from Google Maps
    2. Contact information: phone numbers and emails (check their websites/social media if found)
    3. Rating and review information
    4. Delivery platform presence: Check if listed on "GrabFood" or "ShopeeFood" (if applicable)
    5. Menu items (if applicable): Complete menu with names, prices, categories, descriptions
    
    Output Format:
    You must output strictly valid JSON inside a code block \`\`\`json ... \`\`\`. 
    The JSON structure must be a list of objects with these REQUIRED fields:
    - name (string)
    - address (string)
    - latitude (number) - REQUIRED: exact latitude from Google Maps
    - longitude (number) - REQUIRED: exact longitude from Google Maps
    - description (string: professional business summary)
    - email (string | null)
    - phone (string | null)
    - menu (array of objects with: name, price (optional), description (optional), category (optional))
    - platforms (array of strings: e.g. ["GrabFood", "ShopeeFood", "Gojek"])
    - rating (string | null: e.g. "4.5/5")

    Do not include markdown text outside the JSON block.
  `;

  const config: any = { 
    tools: [{ googleMaps: {} }],
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
    
    // Validate và đảm bảo có tọa độ
    restaurants = restaurants.filter((r: any) => {
        if (!r.latitude || !r.longitude) {
            console.warn(`Restaurant ${r.name} missing coordinates, skipping`);
            return false;
        }
        return true;
    });
    
    console.log(`Gemini found ${restaurants.length} establishments with coordinates`);

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
