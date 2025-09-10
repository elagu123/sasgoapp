import { api } from './api';

export interface BookingSearchParams {
  hotel?: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    budget?: { min?: number; max?: number; currency: string };
    rating?: number;
    amenities?: string[];
    sortBy?: string;
    sortOrder?: string;
  };
  flight?: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    class: string;
  };
  activity?: {
    location: string;
    date?: string;
    category?: string;
    budget?: { min?: number; max?: number; currency: string };
    difficulty?: string;
    sortBy?: string;
  };
}

export interface BookingQuote {
  providerId: string;
  totalPrice: number;
  currency: string;
  taxes: number;
  fees: number;
  basePrice: number;
  availability: boolean;
  expiresAt: string;
  cancellationPolicy: string;
  refundPolicy: string;
  terms: string;
}

export interface PaymentInfo {
  method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  holderName?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface Booking {
  id: string;
  type: 'hotel' | 'flight' | 'activity';
  tripId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationCode?: string;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  lastModified: string;
  details: any;
}

class BookingService {
  // Hotel methods
  async searchHotels(params: BookingSearchParams['hotel']): Promise<any[]> {
    try {
      const response = await api.get('/bookings/hotels/search', { params });
      return response.data.data;
    } catch (error) {
      console.error('Hotel search failed:', error);
      throw new Error('Failed to search hotels');
    }
  }

  async getHotelQuote(
    hotelId: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<BookingQuote> {
    try {
      const response = await api.get('/bookings/hotels/quote', {
        params: { hotelId, checkIn, checkOut, guests }
      });
      return response.data.data;
    } catch (error) {
      console.error('Hotel quote failed:', error);
      throw new Error('Failed to get hotel quote');
    }
  }

  async bookHotel(
    tripId: string,
    hotelId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    roomType: string,
    paymentInfo: PaymentInfo
  ): Promise<Booking> {
    try {
      const response = await api.post('/bookings/hotels/book', {
        tripId,
        hotelId,
        checkIn,
        checkOut,
        guests,
        roomType,
        paymentInfo
      });
      return response.data.data;
    } catch (error) {
      console.error('Hotel booking failed:', error);
      throw new Error('Failed to book hotel');
    }
  }

  // Flight methods
  async searchFlights(params: BookingSearchParams['flight']): Promise<any[]> {
    try {
      const response = await api.get('/bookings/flights/search', { params });
      return response.data.data;
    } catch (error) {
      console.error('Flight search failed:', error);
      throw new Error('Failed to search flights');
    }
  }

  async bookFlight(
    tripId: string,
    flightId: string,
    passengers: Array<{ firstName: string; lastName: string; type: 'adult' | 'child' | 'infant' }>,
    paymentInfo: PaymentInfo
  ): Promise<Booking> {
    try {
      const response = await api.post('/bookings/flights/book', {
        tripId,
        flightId,
        passengers,
        paymentInfo
      });
      return response.data.data;
    } catch (error) {
      console.error('Flight booking failed:', error);
      throw new Error('Failed to book flight');
    }
  }

  // Activity methods
  async searchActivities(params: BookingSearchParams['activity']): Promise<any[]> {
    try {
      const response = await api.get('/bookings/activities/search', { params });
      return response.data.data;
    } catch (error) {
      console.error('Activity search failed:', error);
      throw new Error('Failed to search activities');
    }
  }

  async bookActivity(
    tripId: string,
    activityId: string,
    dateTime: string,
    participants: number,
    paymentInfo: PaymentInfo
  ): Promise<Booking> {
    try {
      const response = await api.post('/bookings/activities/book', {
        tripId,
        activityId,
        dateTime,
        participants,
        paymentInfo
      });
      return response.data.data;
    } catch (error) {
      console.error('Activity booking failed:', error);
      throw new Error('Failed to book activity');
    }
  }

  // General booking management
  async getUserBookings(tripId?: string): Promise<{
    hotels: Booking[];
    flights: Booking[];
    activities: Booking[];
  }> {
    try {
      const params = tripId ? { tripId } : undefined;
      const response = await api.get('/bookings/user/bookings', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  async cancelBooking(bookingId: string, type: 'hotel' | 'flight' | 'activity'): Promise<boolean> {
    try {
      const response = await api.post(`/bookings/cancel/${bookingId}`, { type });
      return response.data.success;
    } catch (error) {
      console.error('Booking cancellation failed:', error);
      throw new Error('Failed to cancel booking');
    }
  }

  // Utility methods
  async validatePaymentInfo(paymentInfo: PaymentInfo): Promise<boolean> {
    // Basic client-side validation
    if (paymentInfo.method === 'credit_card' || paymentInfo.method === 'debit_card') {
      if (!paymentInfo.cardNumber || !paymentInfo.expiryMonth || !paymentInfo.expiryYear || !paymentInfo.cvv) {
        return false;
      }
      
      // Basic card number validation (Luhn algorithm can be added here)
      if (paymentInfo.cardNumber.length < 13 || paymentInfo.cardNumber.length > 19) {
        return false;
      }
      
      // Expiry date validation
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      if (paymentInfo.expiryYear < currentYear || 
          (paymentInfo.expiryYear === currentYear && paymentInfo.expiryMonth < currentMonth)) {
        return false;
      }
    }
    
    return true;
  }

  formatPrice(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  calculateTotalNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isValidAirportCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  // Mock data for development/testing
  getMockHotels(): any[] {
    return [
      {
        id: 'hotel_1',
        name: 'Grand Plaza Hotel',
        location: 'Downtown',
        rating: 4.5,
        price: 150,
        currency: 'USD',
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym'],
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop']
      },
      {
        id: 'hotel_2',
        name: 'City Center Inn',
        location: 'City Center',
        rating: 4.0,
        price: 120,
        currency: 'USD',
        amenities: ['WiFi', 'Breakfast'],
        images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop']
      },
      {
        id: 'hotel_3',
        name: 'Luxury Resort & Spa',
        location: 'Beachfront',
        rating: 5.0,
        price: 350,
        currency: 'USD',
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Beach Access', 'Restaurant'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop']
      }
    ];
  }

  getMockFlights(): any[] {
    return [
      {
        id: 'flight_1',
        airline: 'American Airlines',
        flightNumber: 'AA123',
        origin: 'JFK',
        destination: 'LAX',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        price: 299,
        currency: 'USD',
        class: 'economy'
      },
      {
        id: 'flight_2',
        airline: 'Delta Airlines',
        flightNumber: 'DL456',
        origin: 'JFK',
        destination: 'LAX',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        price: 329,
        currency: 'USD',
        class: 'economy'
      }
    ];
  }

  getMockActivities(): any[] {
    return [
      {
        id: 'activity_1',
        name: 'City Walking Tour',
        description: 'Explore the historic downtown area with a knowledgeable local guide',
        location: 'Downtown',
        category: 'sightseeing',
        duration: 180,
        price: 45,
        currency: 'USD',
        rating: 4.7,
        difficulty: 'easy',
        images: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop']
      },
      {
        id: 'activity_2',
        name: 'Mountain Hiking Adventure',
        description: 'Challenge yourself with a guided hike through scenic mountain trails',
        location: 'Mountain Range',
        category: 'adventure',
        duration: 360,
        price: 89,
        currency: 'USD',
        rating: 4.5,
        difficulty: 'moderate',
        images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop']
      },
      {
        id: 'activity_3',
        name: 'Cooking Class Experience',
        description: 'Learn to cook authentic local cuisine with a professional chef',
        location: 'Culinary Center',
        category: 'food',
        duration: 240,
        price: 75,
        currency: 'USD',
        rating: 4.8,
        difficulty: 'easy',
        images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop']
      }
    ];
  }
}

export const bookingService = new BookingService();