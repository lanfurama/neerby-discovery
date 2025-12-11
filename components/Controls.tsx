
import React, { useState } from 'react';
import { SearchIcon, BrainIcon } from './icons';

interface ControlsProps {
  onSearch: (categories: string[], radius: number, isThinkingMode: boolean) => void;
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
}

const CATEGORIES = ["Coffee", "Restaurant", "Bistro", "Street Food", "Bakery"];

const Controls: React.FC<ControlsProps> = ({ onSearch, isLoading, viewMode, setViewMode }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Restaurant']);
  const [radius, setRadius] = useState<number>(2);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(true); // Default to Thinking/Pro mode for manager view

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length > 0) {
      onSearch(selectedCategories, radius, isThinkingMode);
    }
  };

  return (
    <div className="sticky top-4 z-10 bg-white/90 backdrop-blur-lg p-3 rounded-lg shadow-xl border border-gray-200 mb-6 transition-all">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            
            {/* View Mode Toggle (Manager vs Discovery) */}
            <div className="flex bg-gray-100 p-0.5 rounded shrink-0">
                <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Discovery
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span>Manager View</span>
                </button>
            </div>

            {/* Radius */}
             <div className="flex items-center gap-2 w-full lg:w-auto">
                <label htmlFor="radius" className="text-sm font-medium text-gray-600 shrink-0">Range:</label>
                <input
                    id="radius"
                    type="range"
                    min="1"
                    max="10"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full lg:w-32 h-2 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-500"
                    disabled={isLoading}
                />
                <span className="text-sm font-mono text-blue-600 w-12">{radius}km</span>
            </div>
            
            {/* Search Button */}
             <button
              type="submit"
              disabled={isLoading || selectedCategories.length === 0}
              className={`w-full lg:w-auto px-6 py-2 font-semibold rounded text-white shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400' : 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-400'}`}
            >
              {isLoading ? (
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                </div>
              ) : (
                <>
                    <SearchIcon className="w-5 h-5 mr-2" />
                    <span>{viewMode === 'table' ? 'Run Market Analysis' : 'Find Places'}</span>
                </>
              )}
            </button>
        </div>

        {/* Categories */}
        <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                    <button
                        type="button"
                        key={category}
                        onClick={() => !isLoading && handleCategoryToggle(category)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 text-xs uppercase tracking-wider font-bold rounded border transition-all duration-200 ${
                            selectedCategories.includes(category)
                                ? viewMode === 'table' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
      </form>
    </div>
  );
};

export default Controls;
