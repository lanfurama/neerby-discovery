
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
    Act as a professional Market Research Analyst.
    Conduct a search for "${query}" within a ${radius}km radius of latitude ${location.latitude}, longitude ${location.longitude}.
    
    Specific Research Objectives:
    1. Identify top-rated establishments.
    2. FIND CONTACT INFO: Look for phone numbers and emails (check their Facebook/Instagram/Website if found).
    3. DELIVERY PRESENCE: Specifically search if they are listed on "GrabFood" or "ShopeeFood".
    4. FULL MENU ANALYSIS: Extract the COMPLETE menu with all items. For each restaurant, find:
       - All menu items with names
       - Prices (if available)
       - Categories (e.g., "Appetizers", "Main Courses", "Desserts", "Beverages")
       - Descriptions (if available)
       - Try to get at least 10-20 menu items per restaurant, more if possible
    
    Output Format:
    You must output strictly valid JSON inside a code block \`\`\`json ... \`\`\`.
    The JSON structure must be a list of objects with these fields:
    - name (string)
    - address (string)
    - description (string: professional business summary)
    - email (string | null)
    - phone (string | null)
    - menu (array of objects with: name, price (optional), description (optional), category (optional))
    - platforms (array of strings: e.g. ["GrabFood", "ShopeeFood", "Gojek"])
    - rating (string | null: e.g. "4.5/5")

    Do not include markdown text outside the JSON block.
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
