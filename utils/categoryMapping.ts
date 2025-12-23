/**
 * Map categories từ UI sang Google Places API types
 */
export const getGooglePlacesTypes = (category: string): string[] => {
  const mapping: Record<string, string[]> = {
    'Coffee': ['cafe', 'coffee_shop'],
    'Restaurant': ['restaurant', 'food', 'meal_delivery', 'meal_takeaway'],
    'Bistro': ['restaurant', 'food'],
    'Street Food': ['food', 'meal_takeaway', 'street_food'],
    'Bakery': ['bakery', 'food'],
    'Resort/Hotel': ['lodging', 'resort', 'hotel'],
  };
  
  return mapping[category] || ['establishment'];
};

/**
 * Kiểm tra xem một place có match với category đã chọn không
 */
export const matchesCategory = (placeTypes: string[] | undefined, selectedCategories: string[]): boolean => {
  // Nếu không có placeTypes, giữ lại (có thể API không trả về, nhưng query đã filter)
  if (!placeTypes || placeTypes.length === 0) {
    console.warn('Place has no types, keeping it (query-based filtering)');
    return true; // Giữ lại nếu không có types vì query đã filter
  }
  
  // Lấy tất cả types hợp lệ từ các categories đã chọn
  const validTypes = new Set<string>();
  selectedCategories.forEach(category => {
    const types = getGooglePlacesTypes(category);
    types.forEach(type => validTypes.add(type));
  });
  
  // Kiểm tra xem có type nào của place match với valid types không
  const matches = placeTypes.some(type => validTypes.has(type));
  
  if (!matches) {
    console.log(`Place types [${placeTypes.join(', ')}] don't match categories [${selectedCategories.join(', ')}]`);
  }
  
  return matches;
};

