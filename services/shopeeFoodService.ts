import axios from 'axios';
import { Restaurant } from '../types';

interface ShopeeFoodSearchResult {
  name: string;
  url?: string;
  menuItems?: string[];
  rating?: string;
}

/**
 * Search for restaurant on ShopeeFood
 * Note: ShopeeFood doesn't have a public API, similar to GrabFood
 */
export const searchShopeeFood = async (
  restaurantName: string,
  location?: { latitude: number; longitude: number }
): Promise<ShopeeFoodSearchResult | null> => {
  try {
    const searchQuery = encodeURIComponent(`${restaurantName} shopee food`);
    const shopeeFoodSearchUrl = `https://shopee.vn/food/search?q=${searchQuery}`;
    
    // Similar to GrabFood, actual implementation would require scraping
    return {
      name: restaurantName,
      url: shopeeFoodSearchUrl,
      menuItems: [],
      rating: undefined,
    };
  } catch (error) {
    console.error('Error searching ShopeeFood:', error);
    return null;
  }
};

/**
 * Enhanced ShopeeFood search
 */
export const findShopeeFoodInfo = async (
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
    const searchQuery = `${restaurantName} ${address} shopee food vietnam`;
    
    return {
      url: `https://shopee.vn/food/search?q=${encodeURIComponent(searchQuery)}`,
      menuItems: [],
      rating: undefined,
      available: false,
    };
  } catch (error) {
    console.error('Error finding ShopeeFood info:', error);
    return {
      available: false,
    };
  }
};

/**
 * Update restaurant with ShopeeFood information
 */
export const enrichRestaurantWithShopeeFood = async (
  restaurant: Restaurant
): Promise<Restaurant> => {
  const shopeeFoodInfo = await findShopeeFoodInfo(restaurant.name, restaurant.address);
  
  if (shopeeFoodInfo.available && shopeeFoodInfo.url) {
    return {
      ...restaurant,
      shopeeFoodUrl: shopeeFoodInfo.url,
      menuHighlights: shopeeFoodInfo.menuItems || restaurant.menuHighlights,
      platforms: shopeeFoodInfo.available
        ? [...(restaurant.platforms || []), 'ShopeeFood']
        : restaurant.platforms,
    };
  }
  
  return restaurant;
};

