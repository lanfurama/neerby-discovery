import { Coordinates, Restaurant, SearchResult, GroundingSource } from '../types';
import { searchNearbyPlaces } from './googlePlacesService';
import { enrichRestaurantWithGrabFood } from './grabFoodService';
import { enrichRestaurantWithShopeeFood } from './shopeeFoodService';
import { findEateries as findEateriesWithGemini } from './geminiService';

/**
 * Main service that aggregates data from multiple sources:
 * 1. Google Places API (for accurate restaurant data)
 * 2. Gemini AI with Google Search (for menu items, reviews, etc.)
 * 3. GrabFood (for delivery platform info)
 * 4. ShopeeFood (for delivery platform info)
 */
export const findEateries = async ({
  categories,
  radius,
  isThinkingMode,
  location,
}: {
  categories: string[];
  radius: number;
  isThinkingMode: boolean;
  location: Coordinates;
}): Promise<SearchResult> => {
  const query = categories.join(' or ');
  
  // Step 1: Get restaurants from Google Places API (most accurate)
  console.log('Fetching restaurants from Google Places API...');
  const placesResults = await searchNearbyPlaces(location, query, radius * 1000);
  
  // Step 2: Get additional insights from Gemini AI
  console.log('Fetching additional insights from Gemini AI...');
  let geminiResults: SearchResult = { restaurants: [], sources: [] };
  
  try {
    geminiResults = await findEateriesWithGemini({
      categories,
      radius,
      isThinkingMode,
      location,
    });
  } catch (error) {
    console.warn('Gemini API failed, continuing with Places data only:', error);
  }
  
  // Step 3: Merge and enrich data
  const enrichedRestaurants: Restaurant[] = [];
  const sources: GroundingSource[] = [...geminiResults.sources];
  
  // Start with Google Places results (most reliable)
  for (const place of placesResults) {
    // Try to find matching Gemini result for additional info
    const geminiMatch = geminiResults.restaurants.find(
      (g) =>
        g.name.toLowerCase().includes(place.name.toLowerCase()) ||
        place.name.toLowerCase().includes(g.name.toLowerCase())
    );
    
    let enriched: Restaurant = {
      ...place,
      // Merge Gemini data if available
      description: geminiMatch?.description || place.description,
      email: geminiMatch?.email || place.email,
      menu: geminiMatch?.menu || place.menu, // Use full menu from Gemini if available
      menuHighlights: geminiMatch?.menuHighlights || place.menuHighlights, // Keep for backward compatibility
      platforms: place.platforms || [],
    };
    
    // Enrich with GrabFood info
    try {
      enriched = await enrichRestaurantWithGrabFood(enriched);
    } catch (error) {
      console.warn(`Failed to enrich ${enriched.name} with GrabFood:`, error);
    }
    
    // Enrich with ShopeeFood info
    try {
      enriched = await enrichRestaurantWithShopeeFood(enriched);
    } catch (error) {
      console.warn(`Failed to enrich ${enriched.name} with ShopeeFood:`, error);
    }
    
    enrichedRestaurants.push(enriched);
  }
  
  // Add any unique Gemini results that weren't in Places
  for (const geminiRestaurant of geminiResults.restaurants) {
    const exists = enrichedRestaurants.some(
      (r) =>
        r.name.toLowerCase() === geminiRestaurant.name.toLowerCase() ||
        (r.address && geminiRestaurant.address &&
          r.address.toLowerCase().includes(geminiRestaurant.address.toLowerCase()))
    );
    
    if (!exists) {
      // Try to enrich Gemini-only results
      let enriched = geminiRestaurant;
      
      try {
        enriched = await enrichRestaurantWithGrabFood(enriched);
      } catch (error) {
        console.warn(`Failed to enrich ${enriched.name} with GrabFood:`, error);
      }
      
      try {
        enriched = await enrichRestaurantWithShopeeFood(enriched);
      } catch (error) {
        console.warn(`Failed to enrich ${enriched.name} with ShopeeFood:`, error);
      }
      
      enrichedRestaurants.push(enriched);
    }
  }
  
  // Sort by rating (if available) or name
  enrichedRestaurants.sort((a, b) => {
    const ratingA = a.rating ? parseFloat(a.rating.split('/')[0]) : 0;
    const ratingB = b.rating ? parseFloat(b.rating.split('/')[0]) : 0;
    return ratingB - ratingA;
  });
  
  return {
    restaurants: enrichedRestaurants,
    sources,
  };
};

