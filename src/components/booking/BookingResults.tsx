import React, { useState } from 'react';
import { Star, MapPin, Clock, Users, Plane, Calendar, ChevronRight, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface BookingResultsProps {
  type: 'hotel' | 'flight' | 'activity';
  results: any[];
  isLoading?: boolean;
  onSelect: (item: any) => void;
  onGetQuote?: (item: any) => void;
}

export const BookingResults: React.FC<BookingResultsProps> = ({
  type,
  results,
  isLoading,
  onSelect,
  onGetQuote
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingQuotes, setLoadingQuotes] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const handleGetQuote = async (item: any) => {
    if (!onGetQuote) return;
    
    setLoadingQuotes(prev => new Set(prev).add(item.id));
    try {
      await onGetQuote(item);
    } finally {
      setLoadingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-48 h-32 bg-gray-300 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-gray-400 mb-4">
          {type === 'hotel' && <MapPin className="h-16 w-16 mx-auto" />}
          {type === 'flight' && <Plane className="h-16 w-16 mx-auto" />}
          {type === 'activity' && <Calendar className="h-16 w-16 mx-auto" />}
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600">
          Try adjusting your search criteria or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  const renderHotelResult = (hotel: any) => (
    <div key={hotel.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex">
        <div className="w-48 h-48">
          <img
            src={hotel.images?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop`}
            alt={hotel.name}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>
        
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{hotel.location}</span>
              </div>
            </div>
            
            <button
              onClick={() => toggleFavorite(hotel.id)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Heart
                className={`h-5 w-5 ${
                  favorites.has(hotel.id) ? 'text-red-500 fill-current' : 'text-gray-400'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center space-x-4 mb-3">
            {hotel.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium">{hotel.rating}</span>
              </div>
            )}
            
            {hotel.amenities && (
              <div className="flex space-x-2">
                {hotel.amenities.slice(0, 3).map((amenity: string) => (
                  <span
                    key={amenity}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
                {hotel.amenities.length > 3 && (
                  <span className="text-gray-500 text-xs">+{hotel.amenities.length - 3} more</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              Starting from
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${hotel.price}
                <span className="text-sm font-normal text-gray-600"> /night</span>
              </div>
              <div className="flex space-x-2 mt-2">
                {onGetQuote && (
                  <button
                    onClick={() => handleGetQuote(hotel)}
                    disabled={loadingQuotes.has(hotel.id)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                  >
                    {loadingQuotes.has(hotel.id) ? 'Getting Quote...' : 'Get Quote'}
                  </button>
                )}
                <button
                  onClick={() => onSelect(hotel)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
                >
                  <span>Book Now</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFlightResult = (flight: any) => (
    <div key={flight.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Plane className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{flight.airline}</h3>
            <p className="text-gray-600">{flight.flightNumber}</p>
          </div>
        </div>
        
        <button
          onClick={() => toggleFavorite(flight.id)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Heart
            className={`h-5 w-5 ${
              favorites.has(flight.id) ? 'text-red-500 fill-current' : 'text-gray-400'
            }`}
          />
        </button>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{flight.origin}</div>
          <div className="text-sm text-gray-600">
            {format(new Date(flight.departureTime), 'HH:mm')}
          </div>
        </div>
        
        <div className="flex-1 mx-8">
          <div className="relative">
            <div className="h-px bg-gray-300"></div>
            <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 bg-white" />
          </div>
          <div className="text-center text-sm text-gray-600 mt-1">
            Direct • 5h 30m
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{flight.destination}</div>
          <div className="text-sm text-gray-600">
            {format(new Date(flight.arrivalTime), 'HH:mm')}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
            {flight.class}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${flight.price}
            <span className="text-sm font-normal text-gray-600"> /person</span>
          </div>
          <button
            onClick={() => onSelect(flight)}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
          >
            <span>Select Flight</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderActivityResult = (activity: any) => (
    <div key={activity.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex">
        <div className="w-48 h-48">
          <img
            src={activity.images?.[0] || `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop`}
            alt={activity.name}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>
        
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{activity.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{activity.location}</span>
              </div>
            </div>
            
            <button
              onClick={() => toggleFavorite(activity.id)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Heart
                className={`h-5 w-5 ${
                  favorites.has(activity.id) ? 'text-red-500 fill-current' : 'text-gray-400'
                }`}
              />
            </button>
          </div>
          
          <p className="text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
          
          <div className="flex items-center space-x-4 mb-3">
            {activity.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium">{activity.rating}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{activity.duration}min</span>
            </div>
            
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
              {activity.category}
            </span>
            
            {activity.difficulty && (
              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                activity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                activity.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {activity.difficulty}
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              From
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${activity.price}
                <span className="text-sm font-normal text-gray-600"> /person</span>
              </div>
              <button
                onClick={() => onSelect(activity)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <span>Book Activity</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </h3>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Sort by:</span>
          <select className="border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500">
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="distance">Distance</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {results.map(result => {
          switch (type) {
            case 'hotel':
              return renderHotelResult(result);
            case 'flight':
              return renderFlightResult(result);
            case 'activity':
              return renderActivityResult(result);
            default:
              return null;
          }
        })}
      </div>

      {results.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
};