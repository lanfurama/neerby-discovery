import { Coordinates } from '../types';

/**
 * Tính khoảng cách giữa hai điểm tọa độ (Haversine formula)
 * Trả về khoảng cách tính bằng km
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Bán kính Trái Đất tính bằng km
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Chuyển đổi độ sang radian
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

