import { Coordinates } from '../types';

/**
 * Parse Google Maps URL và trích xuất tọa độ (latitude, longitude)
 * Hỗ trợ các định dạng:
 * - https://www.google.com/maps?q=lat,lng
 * - https://www.google.com/maps/@lat,lng,zoom
 * - https://www.google.com/maps/place/.../@lat,lng,zoom
 * - https://maps.google.com/?q=lat,lng
 * - https://goo.gl/maps/... (shortened URL - cần resolve)
 */
export const parseGoogleMapsUrl = (url: string): Coordinates | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Loại bỏ khoảng trắng và trim
    const cleanUrl = url.trim();

    // Pattern 1: ?q=lat,lng hoặc ?q=lat,lng&...
    const qParamMatch = cleanUrl.match(/[?&]q=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (qParamMatch) {
      const lat = parseFloat(qParamMatch[1]);
      const lng = parseFloat(qParamMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) {
        return { latitude: lat, longitude: lng };
      }
    }

    // Pattern 2: /@lat,lng,zoom hoặc /@lat,lng
    const atSymbolMatch = cleanUrl.match(/@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (atSymbolMatch) {
      const lat = parseFloat(atSymbolMatch[1]);
      const lng = parseFloat(atSymbolMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) {
        return { latitude: lat, longitude: lng };
      }
    }

    // Pattern 3: /place/.../@lat,lng,zoom
    const placeMatch = cleanUrl.match(/\/place\/[^@]+@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) {
        return { latitude: lat, longitude: lng };
      }
    }

    // Pattern 4: /dir/.../@lat,lng,zoom
    const dirMatch = cleanUrl.match(/\/dir\/[^@]+@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
    if (dirMatch) {
      const lat = parseFloat(dirMatch[1]);
      const lng = parseFloat(dirMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) {
        return { latitude: lat, longitude: lng };
      }
    }

    // Pattern 5: Thử parse từ URL object nếu có query params khác
    try {
      const urlObj = new URL(cleanUrl);
      const ll = urlObj.searchParams.get('ll');
      if (ll) {
        const [lat, lng] = ll.split(',').map(parseFloat);
        if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) {
          return { latitude: lat, longitude: lng };
        }
      }
    } catch (e) {
      // URL không hợp lệ, bỏ qua
    }

    return null;
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    return null;
  }
};

/**
 * Kiểm tra tọa độ có hợp lệ không
 */
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

