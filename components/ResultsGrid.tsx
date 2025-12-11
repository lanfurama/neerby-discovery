
import React, { useState } from 'react';
import { Restaurant, GroundingSource } from '../types';
import RestaurantCard from './RestaurantCard';
import MenuModal from './MenuModal';
import { CompassIcon, ExternalLinkIcon, WarningIcon } from './icons';

interface ResultsGridProps {
  results: Restaurant[];
  sources: GroundingSource[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  viewMode: 'grid' | 'table';
}

const SkeletonCard: React.FC = () => (
  <div className="bg-white p-4 rounded-lg border border-gray-200">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
  </div>
);

const SkeletonTable: React.FC = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-200"></div>
        {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 flex items-center px-4 gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
        ))}
    </div>
);

const TableView: React.FC<{ results: Restaurant[] }> = ({ results }) => {
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

    const handleMenuClick = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setIsMenuModalOpen(true);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Establishment</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platforms</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((r, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{r.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 max-w-xs">{r.address}</div>
                                                {r.rating && <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">★ {r.rating}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.menu && r.menu.length > 0 ? (
                                            <div>
                                                <button
                                                    onClick={() => handleMenuClick(r)}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                                                >
                                                    View Full Menu ({r.menu.length} items)
                                                </button>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {r.menu.slice(0, 3).map((item, i) => (
                                                        <div key={i} className="truncate max-w-[200px]">
                                                            {item.name} {item.price && `- ${item.price}`}
                                                        </div>
                                                    ))}
                                                    {r.menu.length > 3 && (
                                                        <div className="text-gray-400 italic">+ {r.menu.length - 3} more items</div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">No menu data</span>
                                        )}
                                    </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                    {r.platforms && r.platforms.length > 0 ? (
                                        r.platforms.map((p, i) => (
                                            <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                p.toLowerCase().includes('grab') ? 'bg-green-100 text-green-800' :
                                                p.toLowerCase().includes('shopee') ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {p}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">Not detected</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex flex-col gap-1">
                                    {r.phone ? (
                                        <a href={`tel:${r.phone}`} className="text-blue-600 hover:underline">{r.phone}</a>
                                    ) : <span className="text-gray-400">No phone</span>}
                                    {r.email ? (
                                        <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline truncate max-w-[150px]">{r.email}</a>
                                    ) : <span className="text-gray-400">No email</span>}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
                * Availability on platforms (Grab/Shopee) and menu items are estimated by AI based on public search results.
            </p>
        </div>
    </div>
    
    {/* Menu Modal */}
    <MenuModal
        restaurant={selectedRestaurant}
        isOpen={isMenuModalOpen}
        onClose={() => {
            setIsMenuModalOpen(false);
            setSelectedRestaurant(null);
        }}
    />
    </>
    );
};

const ResultsGrid: React.FC<ResultsGridProps> = ({ results, sources, isLoading, error, hasSearched, viewMode }) => {
  if (isLoading) {
    if (viewMode === 'table') return <SkeletonTable />;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative my-4 flex items-center justify-center text-center" role="alert">
            <WarningIcon className="w-6 h-6 mr-3"/>
            <span className="block sm:inline">{error}</span>
        </div>
    );
  }

  if (!hasSearched) {
      return (
        <div className="text-center py-16 px-4">
            <CompassIcon className="mx-auto h-16 w-16 text-gray-400"/>
            <h3 className="mt-4 text-2xl font-semibold text-gray-700">Ready to Research?</h3>
            <p className="mt-2 text-gray-500">
                {viewMode === 'table' 
                    ? "Switching to Manager View. Select a category to analyze competitors, menus, and delivery channels."
                    : "Select a category above to find amazing places near you."
                }
            </p>
        </div>
      );
  }
  
  if (results.length === 0) {
    return (
       <div className="text-center py-16 px-4">
            <CompassIcon className="mx-auto h-16 w-16 text-gray-400"/>
            <h3 className="mt-4 text-2xl font-semibold text-gray-700">No results found</h3>
            <p className="mt-2 text-gray-500">Try a different category or expand your search radius.</p>
        </div>
    );
  }

  return (
    <div>
        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((restaurant, index) => (
                    <RestaurantCard key={index} restaurant={restaurant} index={index} />
                ))}
            </div>
        ) : (
            <TableView results={results} />
        )}

        {sources.length > 0 && (
            <div className="mt-8 p-3 bg-white/70 border border-gray-200 rounded">
                <h3 className="text-lg font-semibold text-indigo-600 mb-2">Research Sources</h3>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, index) => (
                        <a 
                            key={index}
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center px-2.5 py-1 rounded bg-white border border-gray-200 text-xs text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                        >
                            <ExternalLinkIcon className="w-3 h-3 mr-1.5 shrink-0"/>
                            <span className="truncate max-w-[200px]">{source.title}</span>
                        </a>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ResultsGrid;
