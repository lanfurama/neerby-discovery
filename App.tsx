
import React, { useState, useEffect, useCallback } from 'react';
import { Coordinates, Restaurant, GroundingSource } from './types';
import { findEateries } from './services/restaurantDataService';
import Header from './components/Header';
import Controls from './components/Controls';
import ResultsGrid from './components/ResultsGrid';
import { LocationIcon, WarningIcon } from './components/icons';

const App: React.FC = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (err) => {
          setLocationError(`Error getting location: ${err.message}. Please enable location services.`);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleSearch = useCallback(async (categories: string[], radius: number, isThinkingMode: boolean) => {
    if (!location) {
      setError("Cannot search without your location. Please enable location services.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSources([]);
    setHasSearched(true);

    try {
      const searchResult = await findEateries({ categories, radius, isThinkingMode, location });
      setResults(searchResult.restaurants);
      setSources(searchResult.sources);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to get results: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  return (
    <div className={`min-h-screen text-gray-800 flex flex-col items-center p-3 sm:p-4 lg:p-6 transition-colors duration-500 ${viewMode === 'table' ? 'bg-slate-50' : 'bg-slate-100'}`}>
      <div className="w-full max-w-6xl mx-auto">
        <Header />
        
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative my-3 flex items-center" role="alert">
            <WarningIcon className="w-6 h-6 mr-3"/>
            <span className="block sm:inline">{locationError}</span>
          </div>
        )}

        {location ? (
          <Controls 
            onSearch={handleSearch} 
            isLoading={isLoading} 
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        ) : (
          !locationError && (
            <div className="flex items-center justify-center bg-white/50 rounded p-4 my-3">
              <LocationIcon className="w-6 h-6 mr-3 animate-pulse text-gray-500" />
              <p className="text-lg text-gray-500">Getting your location...</p>
            </div>
          )
        )}
        
        <ResultsGrid 
          results={results} 
          sources={sources} 
          isLoading={isLoading} 
          error={error} 
          hasSearched={hasSearched}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default App;
