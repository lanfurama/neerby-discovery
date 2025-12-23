import React, { useState, useEffect, useRef } from 'react';
import { Coordinates } from '../types';
import { parseGoogleMapsUrl } from '../utils/parseGoogleMapsUrl';
import { LocationIcon } from './icons';

interface LocationInputProps {
  onLocationSet: (location: Coordinates) => void;
  currentLocation: Coordinates | null;
}

const LocationInput: React.FC<LocationInputProps> = ({ onLocationSet, currentLocation }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processUrl = (url: string) => {
    if (!url || !url.trim()) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const coordinates = parseGoogleMapsUrl(url);
      
      if (coordinates) {
        onLocationSet(coordinates);
        setError(null);
      } else {
        // Chỉ hiển thị lỗi nếu URL có vẻ là Google Maps link nhưng không parse được
        if (url.includes('google.com/maps') || url.includes('maps.google.com') || url.includes('goo.gl/maps')) {
          setError('Không thể trích xuất tọa độ từ link này. Vui lòng kiểm tra lại link Google Maps.');
        }
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xử lý link. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (error) {
      setError(null);
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Tự động xử lý sau 500ms khi người dùng ngừng gõ/dán
    timeoutRef.current = setTimeout(() => {
      if (newValue.trim()) {
        processUrl(newValue.trim());
      }
    }, 500);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Xử lý ngay khi paste
    setTimeout(() => {
      const pastedValue = e.currentTarget.value;
      if (pastedValue.trim()) {
        processUrl(pastedValue.trim());
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-lg p-4 rounded-lg shadow-lg border border-gray-200 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <LocationIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-700">Nhập vị trí từ Google Maps</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onPaste={handlePaste}
            placeholder="Dán link Google Maps vào đây (tự động xử lý)..."
            className="flex-1 px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          />
          {isProcessing && (
            <div className="flex items-center px-4 py-2 text-sm text-gray-600">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        
        {currentLocation && (
          <p className="text-xs text-gray-500 mt-1">
            Vị trí hiện tại: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationInput;

