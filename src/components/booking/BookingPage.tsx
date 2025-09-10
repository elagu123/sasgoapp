import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingSearch } from './BookingSearch';
import { BookingResults } from './BookingResults';
import { bookingService } from '../../services/bookingService';
import { useToast } from '../../hooks/useToast';
import { Plane, Building, Calendar, ArrowLeft } from 'lucide-react';

type BookingType = 'hotel' | 'flight' | 'activity';

export const BookingPage: React.FC = () => {
  const { tripId, type } = useParams<{ tripId: string; type: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [bookingType, setBookingType] = useState<BookingType>((type as BookingType) || 'hotel');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  useEffect(() => {
    if (type && ['hotel', 'flight', 'activity'].includes(type)) {
      setBookingType(type as BookingType);
    }
  }, [type]);

  const handleSearch = async (searchParams: any) => {
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      let results: any[] = [];
      
      switch (bookingType) {
        case 'hotel':
          results = await bookingService.searchHotels(searchParams);
          break;
        case 'flight':
          results = await bookingService.searchFlights(searchParams);
          break;
        case 'activity':
          results = await bookingService.searchActivities(searchParams);
          break;
      }
      
      setSearchResults(results);
      
      if (results.length === 0) {
        addToast('No results found. Try adjusting your search criteria.', 'info');
      } else {
        addToast(`Found ${results.length} result${results.length !== 1 ? 's' : ''}`, 'success');
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      addToast('Search failed. Please try again.', 'error');
      
      // Use mock data for demonstration
      let mockResults: any[] = [];
      switch (bookingType) {
        case 'hotel':
          mockResults = bookingService.getMockHotels();
          break;
        case 'flight':
          mockResults = bookingService.getMockFlights();
          break;
        case 'activity':
          mockResults = bookingService.getMockActivities();
          break;
      }
      setSearchResults(mockResults);
      addToast(`Showing demo results (${mockResults.length} items)`, 'info');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetQuote = async (item: any) => {
    if (bookingType === 'hotel') {
      try {
        const quote = await bookingService.getHotelQuote(
          item.id,
          '2024-06-01', // These would come from search params in real implementation
          '2024-06-05',
          2
        );
        setSelectedQuote({ ...item, quote });
        addToast('Quote retrieved successfully', 'success');
      } catch (error) {
        console.error('Quote failed:', error);
        // Mock quote for demo
        const mockQuote = {
          providerId: 'booking_com',
          totalPrice: item.price * 4 + 50, // 4 nights + taxes/fees
          currency: 'USD',
          taxes: item.price * 4 * 0.15,
          fees: 25,
          basePrice: item.price * 4,
          availability: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          cancellationPolicy: 'Free cancellation until 24 hours before check-in',
          refundPolicy: 'Full refund available within cancellation period',
          terms: 'Standard booking terms apply'
        };
        setSelectedQuote({ ...item, quote: mockQuote });
        addToast('Demo quote generated', 'info');
      }
    }
  };

  const handleSelectItem = (item: any) => {
    // Navigate to booking confirmation page
    const bookingData = {
      tripId,
      type: bookingType,
      item,
      quote: selectedQuote?.quote
    };
    
    // Store booking data temporarily (in real app, this would be in state management)
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    
    navigate(`/app/trips/${tripId}/booking/${bookingType}/confirm`);
  };

  const handleTypeChange = (newType: BookingType) => {
    setBookingType(newType);
    setSearchResults([]);
    setHasSearched(false);
    setSelectedQuote(null);
    navigate(`/app/trips/${tripId}/booking/${newType}`);
  };

  const getIcon = (type: BookingType) => {
    switch (type) {
      case 'hotel':
        return <Building className="h-5 w-5" />;
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'activity':
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getTitle = (type: BookingType) => {
    switch (type) {
      case 'hotel':
        return 'Hotels & Accommodations';
      case 'flight':
        return 'Flights';
      case 'activity':
        return 'Activities & Experiences';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/app/trips/${tripId}`)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Trip</span>
              </button>
              
              <div className="h-6 border-l border-gray-300"></div>
              
              <h1 className="text-xl font-semibold text-gray-900">
                Book {getTitle(bookingType)}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Type Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(['hotel', 'flight', 'activity'] as BookingType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  bookingType === type
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getIcon(type)}
                <span className="capitalize">{type}s</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <BookingSearch
            type={bookingType}
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        </div>

        {/* Quote Display */}
        {selectedQuote && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Quote for {selectedQuote.name}
                </h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Base Price: {bookingService.formatPrice(selectedQuote.quote.basePrice, selectedQuote.quote.currency)}</p>
                  <p>Taxes: {bookingService.formatPrice(selectedQuote.quote.taxes, selectedQuote.quote.currency)}</p>
                  <p>Fees: {bookingService.formatPrice(selectedQuote.quote.fees, selectedQuote.quote.currency)}</p>
                  <p className="font-semibold">
                    Total: {bookingService.formatPrice(selectedQuote.quote.totalPrice, selectedQuote.quote.currency)}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-blue-700">
                <p>Expires in 15 minutes</p>
                <p className="text-xs mt-1">{selectedQuote.quote.cancellationPolicy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <BookingResults
            type={bookingType}
            results={searchResults}
            isLoading={isSearching}
            onSelect={handleSelectItem}
            onGetQuote={bookingType === 'hotel' ? handleGetQuote : undefined}
          />
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              {getIcon(bookingType)}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Ready to find the perfect {bookingType}?
            </h3>
            <p className="text-gray-600">
              Use the search form above to discover amazing {bookingType}s for your trip.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};