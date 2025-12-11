import React, { useState } from 'react';
import { Restaurant } from '../types';
import { MapPinIcon } from './icons';
import MenuModal from './MenuModal';

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, index }) => {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const googleMapsUrl = restaurant.placeId 
    ? `https://www.google.com/maps/place/?q=place_id:${restaurant.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name}, ${restaurant.address}`)}`;
  const animationDelay = `${index * 100}ms`;

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col opacity-0 animate-fade-in-up"
      style={{ animationDelay }}
    >
      {/* Photo */}
      {restaurant.photos && restaurant.photos.length > 0 && (
        <div className="w-full h-48 overflow-hidden bg-gray-200">
          <img 
            src={restaurant.photos[0]} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-4 flex-grow">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-blue-600 flex-1">{restaurant.name}</h3>
          {restaurant.rating && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
              ★ {restaurant.rating.split('(')[0].trim()}
            </span>
          )}
        </div>
        
        {restaurant.address && (
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <MapPinIcon className="w-4 h-4 mr-1.5 shrink-0" />
            {restaurant.address}
          </p>
        )}
        
        <p className="text-gray-700 mt-4 text-base">
          {restaurant.description}
        </p>
        
        {/* Platforms */}
        {restaurant.platforms && restaurant.platforms.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {restaurant.platforms.map((platform, i) => (
              <span 
                key={i} 
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  platform.toLowerCase().includes('grab') ? 'bg-green-100 text-green-800' :
                  platform.toLowerCase().includes('shopee') ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {platform}
              </span>
            ))}
          </div>
        )}
        
        {/* Contact Info */}
        {(restaurant.phone || restaurant.email || restaurant.website) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-1 text-sm">
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="block text-blue-600 hover:underline">
                  📞 {restaurant.phone}
                </a>
              )}
              {restaurant.email && (
                <a href={`mailto:${restaurant.email}`} className="block text-blue-600 hover:underline truncate">
                  ✉️ {restaurant.email}
                </a>
              )}
              {restaurant.website && (
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">
                  🌐 Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 pt-0 mt-auto space-y-2">
        {/* View Menu Button */}
        {(restaurant.menu && restaurant.menu.length > 0) && (
          <button
            onClick={() => setIsMenuModalOpen(true)}
            className="w-full text-center bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            View Menu ({restaurant.menu.length} items)
          </button>
        )}
        
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full text-center bg-gray-100 text-blue-600 font-semibold py-2 px-4 rounded hover:bg-gray-200 transition-colors"
        >
          View on Map
        </a>
        
        <div className="flex gap-2">
          {restaurant.grabFoodUrl && (
            <a
              href={restaurant.grabFoodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600 transition-colors text-sm"
            >
              GrabFood
            </a>
          )}
          {restaurant.shopeeFoodUrl && (
            <a
              href={restaurant.shopeeFoodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-orange-500 text-white font-semibold py-2 px-4 rounded hover:bg-orange-600 transition-colors text-sm"
            >
              ShopeeFood
            </a>
          )}
        </div>
      </div>
      
      {/* Menu Modal */}
      <MenuModal
        restaurant={restaurant}
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
      />
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RestaurantCard;