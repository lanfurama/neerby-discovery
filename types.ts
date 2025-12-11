
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MenuItem {
  name: string;
  price?: string;
  description?: string;
  category?: string;
}

export interface Restaurant {
  name: string;
  address: string;
  description: string;
  email?: string;
  phone?: string;
  website?: string;
  menuHighlights?: string[]; // Deprecated: use menu instead
  menu?: MenuItem[]; // Full menu items
  platforms?: string[]; // e.g. "GrabFood", "ShopeeFood"
  rating?: string;
  placeId?: string; // Google Places ID
  latitude?: number;
  longitude?: number;
  priceLevel?: number; // 0-4 from Google Places
  openingHours?: string[];
  photos?: string[]; // Photo URLs
  grabFoodUrl?: string;
  shopeeFoodUrl?: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SearchResult {
    restaurants: Restaurant[];
    sources: GroundingSource[];
}
