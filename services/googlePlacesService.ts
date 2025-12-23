import axios from 'axios';
import { Coordinates, Restaurant } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  types?: string[];
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
}

interface PlaceDetailsResponse {
  result: {
    formatted_phone_number?: string;
    website?: string;
    email?: string;
    opening_hours?: {
      weekday_text: string[];
    };
    types?: string[];
  };
  status: string;
}

export const searchNearbyPlaces = async (
  location: Coordinates,
  query: string,
  radius: number = 5000
): Promise<Restaurant[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not set, skipping Places search');
    return [];
  }

  try {
    // Step 1: Text Search for places
    const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const searchParams = new URLSearchParams({
      query: query,
      location: `${location.latitude},${location.longitude}`,
      radius: radius.toString(),
      key: GOOGLE_PLACES_API_KEY,
    });

    const searchResponse = await axios.get<GooglePlacesResponse>(
      `${searchUrl}?${searchParams.toString()}`
    );

    if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', searchResponse.data.status);
      return [];
    }

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return [];
    }

    // Step 2: Get detailed information for each place
    const places: Restaurant[] = await Promise.all(
      searchResponse.data.results.slice(0, 10).map(async (place) => {
        // Get place details for additional info
        let placeDetails: PlaceDetailsResponse | null = null;
        try {
          const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
          const detailsParams = new URLSearchParams({
            place_id: place.place_id,
            fields: 'formatted_phone_number,website,email,opening_hours,types',
            key: GOOGLE_PLACES_API_KEY,
          });

          const detailsResponse = await axios.get<PlaceDetailsResponse>(
            `${detailsUrl}?${detailsParams.toString()}`
          );

          if (detailsResponse.data.status === 'OK') {
            placeDetails = detailsResponse.data;
          }
        } catch (error) {
          console.warn(`Failed to get details for place ${place.place_id}:`, error);
        }

        // Build photo URLs
        const photos: string[] = [];
        if (place.photos && place.photos.length > 0) {
          place.photos.slice(0, 3).forEach((photo) => {
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
            photos.push(photoUrl);
          });
        }

        // Lấy types từ place details hoặc từ place result
        const placeTypes = placeDetails?.result?.types || place.types || [];
        
        const restaurant: Restaurant = {
          name: place.name,
          address: place.formatted_address,
          description: `Restaurant located at ${place.formatted_address}`,
          phone: placeDetails?.result?.formatted_phone_number || place.formatted_phone_number,
          website: placeDetails?.result?.website || place.website,
          email: placeDetails?.result?.email,
          rating: place.rating ? `${place.rating.toFixed(1)}/5 (${place.user_ratings_total || 0} reviews)` : undefined,
          placeId: place.place_id,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          priceLevel: place.price_level,
          openingHours: placeDetails?.result?.opening_hours?.weekday_text || place.opening_hours?.weekday_text,
          photos: photos.length > 0 ? photos : undefined,
          menuHighlights: [],
          platforms: [],
          // Lưu types để filter sau
          placeTypes: placeTypes,
        };

        return restaurant;
      })
    );

    return places;
  } catch (error) {
    console.error('Error fetching Google Places data:', error);
    return [];
  }
};

