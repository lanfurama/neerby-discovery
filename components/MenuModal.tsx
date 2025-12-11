import React from 'react';
import { Restaurant, MenuItem } from '../types';
import { XIcon } from './icons';

interface MenuModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ restaurant, isOpen, onClose }) => {
  if (!isOpen || !restaurant) return null;

  const menu = restaurant.menu || [];
  
  // Group menu items by category if available
  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const hasCategories = Object.keys(groupedMenu).length > 0 && 
    Object.keys(groupedMenu).some(key => key !== 'Other' || Object.keys(groupedMenu).length === 1);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div 
          className="inline-block align-bottom bg-white rounded text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{restaurant.name}</h3>
              {restaurant.address && (
                <p className="text-blue-100 text-sm mt-1">{restaurant.address}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1.5 rounded hover:bg-white/20"
              aria-label="Close"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">
            {menu.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Menu information not available</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try checking their website or delivery platforms for the full menu
                </p>
                {restaurant.grabFoodUrl && (
                  <a
                    href={restaurant.grabFoodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    View on GrabFood
                  </a>
                )}
                {restaurant.shopeeFoodUrl && (
                  <a
                    href={restaurant.shopeeFoodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 ml-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    View on ShopeeFood
                  </a>
                )}
              </div>
            ) : hasCategories ? (
              // Grouped by category
              <div className="space-y-6">
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      {category}
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {items.map((item, index) => (
                        <div 
                          key={index}
                          className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-900 flex-1">{item.name}</h5>
                            {item.price && (
                              <span className="ml-4 text-blue-600 font-bold whitespace-nowrap">
                                {item.price}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Simple list without categories
              <div className="grid gap-3 md:grid-cols-2">
                {menu.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-gray-900 flex-1">{item.name}</h5>
                      {item.price && (
                        <span className="ml-4 text-blue-600 font-bold whitespace-nowrap">
                          {item.price}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {menu.length > 0 && (
                <span>{menu.length} items</span>
              )}
            </div>
            <div className="flex gap-2">
              {restaurant.grabFoodUrl && (
                <a
                  href={restaurant.grabFoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Order on GrabFood
                </a>
              )}
              {restaurant.shopeeFoodUrl && (
                <a
                  href={restaurant.shopeeFoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Order on ShopeeFood
                </a>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;

