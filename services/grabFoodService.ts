import axios from 'axios';
import { Restaurant } from '../types';

interface GrabFoodSearchResult {
  name: string;
  url?: string;
  menuItems?: string[];
  rating?: string;
}

/**
 * Search for restaurant on GrabFood
 * Note: GrabFood doesn't have a public API, so we'll use web scraping approach
 * For production, consider using a proper scraping service or GrabFood's partner API if available
 */
export const searchGrabFood = async (
  restaurantName: string,
  location?: { latitude: number; longitude: number }
): Promise<GrabFoodSearchResult | null> => {
  try {
    // Since GrabFood doesn't have a public API, we'll construct a search URL
    // and attempt to find the restaurant
    // In a real implementation, you might want to use a scraping service or proxy
    
    const searchQuery = encodeURIComponent(`${restaurantName} grab food`);
    const grabFoodSearchUrl = `https://food.grab.com/vn/en/search?q=${searchQuery}`;
    
    // For now, we'll return a structured result that can be enhanced with actual scraping
    // In production, you would:
    // 1. Use a headless browser (Puppeteer/Playwright) to scrape
    // 2. Or use a scraping service like ScraperAPI, Bright Data, etc.
    // 3. Or use GrabFood's partner API if you have access
    
    return {
      name: restaurantName,
      url: grabFoodSearchUrl,
      menuItems: [],
      rating: undefined,
    };
  } catch (error) {
    console.error('Error searching GrabFood:', error);
    return null;
  }
};

/**
 * Enhanced GrabFood search using Gemini AI to extract information from web search
 * This is a workaround since we don't have direct API access
 */
export const findGrabFoodInfo = async (
  restaurantName: string,
  address: string,
  geminiService?: any
): Promise<{
  url?: string;
  menuItems?: string[];
  rating?: string;
  available: boolean;
}> => {
  try {
    // Construct search query
    const searchQuery = `${restaurantName} ${address} grab food vietnam`;
    
    // If Gemini service is available, use it to search for GrabFood info
    if (geminiService) {
      // This would be called from the main service that has Gemini access
      // For now, return basic structure
    }
    
    // Return basic info - in production, implement actual scraping
    return {
      url: `https://food.grab.com/vn/en/search?q=${encodeURIComponent(searchQuery)}`,
      menuItems: [],
      rating: undefined,
      available: false, // Set to true when actual scraping is implemented
    };
  } catch (error) {
    console.error('Error finding GrabFood info:', error);
    return {
      available: false,
    };
  }
};

/**
 * Update restaurant with GrabFood information
 */
export const enrichRestaurantWithGrabFood = async (
  restaurant: Restaurant
): Promise<Restaurant> => {
  const grabFoodInfo = await findGrabFoodInfo(restaurant.name, restaurant.address);
  
  if (grabFoodInfo.available && grabFoodInfo.url) {
    return {
      ...restaurant,
      grabFoodUrl: grabFoodInfo.url,
      menuHighlights: grabFoodInfo.menuItems || restaurant.menuHighlights,
      platforms: grabFoodInfo.available
        ? [...(restaurant.platforms || []), 'GrabFood']
        : restaurant.platforms,
    };
  }
  
  return restaurant;
};

