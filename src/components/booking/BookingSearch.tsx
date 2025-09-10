import React, { useState } from 'react';
import { Calendar, MapPin, Users, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface BookingSearchProps {
  type: 'hotel' | 'flight' | 'activity';
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

export const BookingSearch: React.FC<BookingSearchProps> = ({ type, onSearch, isLoading }) => {
  const [searchParams, setSearchParams] = useState<any>({
    hotel: {
      location: '',
      checkIn: '',
      checkOut: '',
      guests: 2,
      budget: { min: '', max: '', currency: 'USD' },
      rating: '',
      amenities: [],
      sortBy: 'price',
      sortOrder: 'asc'
    },
    flight: {
      origin: '',
      destination: '',
      departureDate: '',
      returnDate: '',
      passengers: 1,
      class: 'economy'
    },
    activity: {
      location: '',
      date: '',
      category: '',
      budget: { min: '', max: '', currency: 'USD' },
      difficulty: '',
      sortBy: 'price'
    }
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setSearchParams((prev: any) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleBudgetChange = (field: string, value: string) => {
    setSearchParams((prev: any) => ({
      ...prev,
      [type]: {
        ...prev[type],
        budget: {
          ...prev[type].budget,
          [field]: value
        }
      }
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = searchParams[type].amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a: string) => a !== amenity)
      : [...currentAmenities, amenity];
    
    handleInputChange('amenities', newAmenities);
  };

  const handleSearch = () => {
    const params = searchParams[type];
    
    // Basic validation
    if (type === 'hotel' && (!params.location || !params.checkIn || !params.checkOut)) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (type === 'flight' && (!params.origin || !params.destination || !params.departureDate)) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (type === 'activity' && !params.location) {
      alert('Please enter a location');
      return;
    }

    onSearch(params);
  };

  const renderHotelSearch = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Destination"
            value={searchParams.hotel.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="date"
            placeholder="Check-in"
            value={searchParams.hotel.checkIn}
            onChange={(e) => handleInputChange('checkIn', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="date"
            placeholder="Check-out"
            value={searchParams.hotel.checkOut}
            onChange={(e) => handleInputChange('checkOut', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <select
            value={searchParams.hotel.guests}
            onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (USD)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={searchParams.hotel.budget.min}
                  onChange={(e) => handleBudgetChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={searchParams.hotel.budget.max}
                  onChange={(e) => handleBudgetChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select
                value={searchParams.hotel.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={searchParams.hotel.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {['WiFi', 'Pool', 'Gym', 'Spa', 'Breakfast', 'Parking', 'Pet Friendly'].map(amenity => (
                <button
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    searchParams.hotel.amenities?.includes(amenity)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFlightSearch = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <input
            type="text"
            placeholder="Airport code (e.g., JFK)"
            value={searchParams.flight.origin}
            onChange={(e) => handleInputChange('origin', e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <input
            type="text"
            placeholder="Airport code (e.g., LAX)"
            value={searchParams.flight.destination}
            onChange={(e) => handleInputChange('destination', e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Departure</label>
          <input
            type="date"
            value={searchParams.flight.departureDate}
            onChange={(e) => handleInputChange('departureDate', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Return (optional)</label>
          <input
            type="date"
            value={searchParams.flight.returnDate}
            onChange={(e) => handleInputChange('returnDate', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
          <select
            value={searchParams.flight.passengers}
            onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={searchParams.flight.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivitySearch = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Destination"
            value={searchParams.activity.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="date"
            placeholder="Date"
            value={searchParams.activity.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <select
            value={searchParams.activity.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All categories</option>
            <option value="sightseeing">Sightseeing</option>
            <option value="adventure">Adventure</option>
            <option value="culture">Culture</option>
            <option value="food">Food & Drink</option>
            <option value="outdoor">Outdoor</option>
            <option value="entertainment">Entertainment</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (USD)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={searchParams.activity.budget.min}
                  onChange={(e) => handleBudgetChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={searchParams.activity.budget.max}
                  onChange={(e) => handleBudgetChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={searchParams.activity.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any difficulty</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={searchParams.activity.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="duration">Duration</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {type === 'hotel' && 'Find Hotels'}
          {type === 'flight' && 'Search Flights'}
          {type === 'activity' && 'Discover Activities'}
        </h2>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {type === 'hotel' && renderHotelSearch()}
      {type === 'flight' && renderFlightSearch()}
      {type === 'activity' && renderActivitySearch()}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-5 w-5" />
          <span>{isLoading ? 'Searching...' : 'Search'}</span>
        </button>
      </div>
    </div>
  );
};