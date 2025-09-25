import { getCacheService } from './cache.service';
import { loggingService } from './logging.service';
import { metricsService } from './metrics.service';

export interface BookingProvider {
  id: string;
  name: string;
  type: 'hotel' | 'flight' | 'activity' | 'transport';
  apiEndpoint: string;
  rateLimit: number;
  commission: number;
}

export interface HotelBooking {
  id: string;
  providerId: string;
  tripId: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  location: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  guests: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationCode?: string;
  cancellationPolicy: string;
  amenities: string[];
  rating?: number;
  images: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    address: string;
  };
  bookingDate: Date;
  lastModified: Date;
}

export interface FlightBooking {
  id: string;
  providerId: string;
  tripId: string;
  userId: string;
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
    dateTime: Date;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
    dateTime: Date;
  };
  passengers: Array<{
    firstName: string;
    lastName: string;
    type: 'adult' | 'child' | 'infant';
    seatNumber?: string;
  }>;
  flightClass: 'economy' | 'business' | 'first';
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationCode?: string;
  pnr?: string;
  baggage: {
    carry: number;
    checked: number;
  };
  bookingDate: Date;
  lastModified: Date;
}

export interface ActivityBooking {
  id: string;
  providerId: string;
  tripId: string;
  userId: string;
  activityId: string;
  name: string;
  description: string;
  location: string;
  dateTime: Date;
  duration: number;
  participants: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationCode?: string;
  category: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  ageRestriction?: {
    min: number;
    max?: number;
  };
  includes: string[];
  meetingPoint: string;
  cancellationPolicy: string;
  bookingDate: Date;
  lastModified: Date;
}

export interface BookingSearchFilters {
  location?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  rating?: number;
  amenities?: string[];
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingQuote {
  providerId: string;
  totalPrice: number;
  currency: string;
  taxes: number;
  fees: number;
  basePrice: number;
  availability: boolean;
  expiresAt: Date;
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

export class BookingService {
  private cache: any; // CacheService instance
  private logger: any; // LoggingService instance  
  private metrics: any; // MetricsService instance
  private providers: Map<string, BookingProvider> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.cache = getCacheService();
    this.logger = loggingService;
    this.metrics = metricsService;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Mock providers - in production, these would be real booking APIs
    const providers: BookingProvider[] = [
      {
        id: 'booking_com',
        name: 'Booking.com',
        type: 'hotel',
        apiEndpoint: 'https://api.booking.com/v1',
        rateLimit: 1000,
        commission: 0.15
      },
      {
        id: 'amadeus',
        name: 'Amadeus',
        type: 'flight',
        apiEndpoint: 'https://api.amadeus.com/v1',
        rateLimit: 2000,
        commission: 0.02
      },
      {
        id: 'viator',
        name: 'Viator',
        type: 'activity',
        apiEndpoint: 'https://api.viator.com/v1',
        rateLimit: 500,
        commission: 0.20
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  private async checkRateLimit(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    const now = Date.now();
    const limiter = this.rateLimiters.get(providerId);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(providerId, {
        count: 1,
        resetTime: now + 60000 // Reset every minute
      });
      return true;
    }

    if (limiter.count >= provider.rateLimit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  // Hotel Booking Methods
  async searchHotels(
    location: string,
    checkIn: Date,
    checkOut: Date,
    guests: number,
    filters?: BookingSearchFilters
  ): Promise<any[]> {
    const cacheKey = `hotels:search:${location}:${checkIn.toISOString()}:${checkOut.toISOString()}:${guests}`;
    const cached = await this.cache.get(cacheKey) as any[];
    
    if (cached) {
      this.metrics.incrementCounter('booking_cache_hits');
      return cached;
    }

    this.metrics.incrementCounter('booking_searches', { type: 'hotel' });
    
    try {
      // Mock hotel search - in production, this would call real APIs
      const hotels = await this.mockHotelSearch(location, checkIn, checkOut, guests, filters);
      
      // Cache for 30 minutes
      await this.cache.set(cacheKey, hotels, 1800);
      
      this.logger.info('Hotel search completed', {
        location,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
        resultsCount: hotels.length
      });

      return hotels;
    } catch (error) {
      this.logger.error('Hotel search failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        location, 
        guests
      });
      this.metrics.incrementCounter('booking_errors', { type: 'hotel', operation: 'search' });
      throw error;
    }
  }

  async getHotelQuote(hotelId: string, checkIn: Date, checkOut: Date, guests: number): Promise<BookingQuote> {
    const cacheKey = `hotel:quote:${hotelId}:${checkIn.toISOString()}:${checkOut.toISOString()}:${guests}`;
    const cached = await this.cache.get(cacheKey) as BookingQuote;
    
    if (cached) {
      return cached;
    }

    const quote = await this.mockHotelQuote(hotelId, checkIn, checkOut, guests);
    
    // Cache for 15 minutes (quotes expire quickly)
    await this.cache.set(cacheKey, quote, 900);
    
    return quote;
  }

  async bookHotel(
    tripId: string,
    userId: string,
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number,
    roomType: string,
    paymentInfo: PaymentInfo
  ): Promise<HotelBooking> {
    this.metrics.incrementCounter('booking_attempts', { type: 'hotel' });
    
    try {
      // Validate quote is still valid
      const quote = await this.getHotelQuote(hotelId, checkIn, checkOut, guests);
      if (!quote.availability) {
        throw new Error('Hotel is no longer available');
      }

      // Process payment (mock)
      const paymentResult = await this.processPayment(quote.totalPrice, quote.currency, paymentInfo);
      
      if (!paymentResult.success) {
        throw new Error('Payment failed');
      }

      // Create booking record
      const booking: HotelBooking = {
        id: `hotel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerId: 'booking_com',
        tripId,
        userId,
        hotelId,
        hotelName: `Hotel ${hotelId}`,
        location: 'Sample Location',
        checkIn,
        checkOut,
        roomType,
        guests,
        totalPrice: quote.totalPrice,
        currency: quote.currency,
        status: 'confirmed',
        confirmationCode: `CONF${Date.now()}`,
        cancellationPolicy: quote.cancellationPolicy,
        amenities: ['WiFi', 'Breakfast', 'Pool'],
        rating: 4.2,
        images: [],
        contactInfo: {
          phone: '+1-555-0123',
          email: 'reservations@hotel.com',
          address: '123 Hotel Street'
        },
        bookingDate: new Date(),
        lastModified: new Date()
      };

      // Save to database
      await this.saveHotelBooking(booking);
      
      // Invalidate related caches
      await this.invalidateHotelCaches(hotelId);

      this.metrics.incrementCounter('booking_success', { type: 'hotel' });
      this.logger.info('Hotel booking completed', {
        bookingId: booking.id,
        userId,
        tripId,
        hotelId,
        totalPrice: booking.totalPrice
      });

      return booking;
    } catch (error) {
      this.metrics.incrementCounter('booking_errors', { type: 'hotel', operation: 'book' });
      this.logger.error('Hotel booking failed', error as Error, { userId, tripId, hotelId });
      throw error;
    }
  }

  // Flight Booking Methods
  async searchFlights(
    origin: string,
    destination: string,
    departureDate: Date,
    returnDate?: Date,
    passengers: number = 1,
    flightClass: 'economy' | 'business' | 'first' = 'economy'
  ): Promise<any[]> {
    const cacheKey = `flights:search:${origin}:${destination}:${departureDate.toISOString()}:${returnDate?.toISOString() || 'oneway'}:${passengers}:${flightClass}`;
    const cached = await this.cache.get(cacheKey) as any[];
    
    if (cached) {
      this.metrics.incrementCounter('booking_cache_hits');
      return cached;
    }

    this.metrics.incrementCounter('booking_searches', { type: 'flight' });
    
    try {
      const flights = await this.mockFlightSearch(origin, destination, departureDate, returnDate, passengers, flightClass);
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, flights, 3600);
      
      this.logger.info('Flight search completed', {
        origin,
        destination,
        departureDate: departureDate.toISOString(),
        passengers,
        resultsCount: flights.length
      });

      return flights;
    } catch (error) {
      this.logger.error('Flight search failed', error as Error, { origin, destination });
      this.metrics.incrementCounter('booking_errors', { type: 'flight', operation: 'search' });
      throw error;
    }
  }

  async bookFlight(
    tripId: string,
    userId: string,
    flightId: string,
    passengers: Array<{ firstName: string; lastName: string; type: 'adult' | 'child' | 'infant' }>,
    paymentInfo: PaymentInfo
  ): Promise<FlightBooking> {
    this.metrics.incrementCounter('booking_attempts', { type: 'flight' });
    
    try {
      // Mock flight booking
      const booking: FlightBooking = {
        id: `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerId: 'amadeus',
        tripId,
        userId,
        flightNumber: 'AA123',
        airline: 'American Airlines',
        departure: {
          airport: 'JFK',
          city: 'New York',
          country: 'USA',
          dateTime: new Date()
        },
        arrival: {
          airport: 'LAX',
          city: 'Los Angeles',
          country: 'USA',
          dateTime: new Date()
        },
        passengers,
        flightClass: 'economy',
        totalPrice: 299.99,
        currency: 'USD',
        status: 'confirmed',
        confirmationCode: `FLIGHT${Date.now()}`,
        pnr: `PNR${Date.now()}`,
        baggage: {
          carry: 1,
          checked: 1
        },
        bookingDate: new Date(),
        lastModified: new Date()
      };

      await this.saveFlightBooking(booking);
      
      this.metrics.incrementCounter('booking_success', { type: 'flight' });
      this.logger.info('Flight booking completed', {
        bookingId: booking.id,
        userId,
        tripId,
        flightNumber: booking.flightNumber
      });

      return booking;
    } catch (error) {
      this.metrics.incrementCounter('booking_errors', { type: 'flight', operation: 'book' });
      this.logger.error('Flight booking failed', error as Error, { userId, tripId });
      throw error;
    }
  }

  // Activity Booking Methods
  async searchActivities(
    location: string,
    date?: Date,
    category?: string,
    filters?: BookingSearchFilters
  ): Promise<any[]> {
    const cacheKey = `activities:search:${location}:${date?.toISOString() || 'any'}:${category || 'all'}`;
    const cached = await this.cache.get(cacheKey) as any[];
    
    if (cached) {
      this.metrics.incrementCounter('booking_cache_hits');
      return cached;
    }

    this.metrics.incrementCounter('booking_searches', { type: 'activity' });
    
    try {
      const activities = await this.mockActivitySearch(location, date, category, filters);
      
      // Cache for 2 hours
      await this.cache.set(cacheKey, activities, 7200);
      
      return activities;
    } catch (error) {
      this.logger.error('Activity search failed', error as Error, { location, category });
      this.metrics.incrementCounter('booking_errors', { type: 'activity', operation: 'search' });
      throw error;
    }
  }

  async bookActivity(
    tripId: string,
    userId: string,
    activityId: string,
    dateTime: Date,
    participants: number,
    paymentInfo: PaymentInfo
  ): Promise<ActivityBooking> {
    this.metrics.incrementCounter('booking_attempts', { type: 'activity' });
    
    try {
      const booking: ActivityBooking = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerId: 'viator',
        tripId,
        userId,
        activityId,
        name: 'Sample Activity',
        description: 'A wonderful activity experience',
        location: 'Sample Location',
        dateTime,
        duration: 180, // 3 hours
        participants,
        totalPrice: 89.99 * participants,
        currency: 'USD',
        status: 'confirmed',
        confirmationCode: `ACT${Date.now()}`,
        category: 'sightseeing',
        difficulty: 'easy',
        includes: ['Guide', 'Transportation', 'Refreshments'],
        meetingPoint: 'Main entrance of attraction',
        cancellationPolicy: 'Free cancellation up to 24 hours before',
        bookingDate: new Date(),
        lastModified: new Date()
      };

      await this.saveActivityBooking(booking);
      
      this.metrics.incrementCounter('booking_success', { type: 'activity' });
      
      return booking;
    } catch (error) {
      this.metrics.incrementCounter('booking_errors', { type: 'activity', operation: 'book' });
      this.logger.error('Activity booking failed', error as Error, { userId, tripId });
      throw error;
    }
  }

  // Booking Management Methods
  async getUserBookings(userId: string, tripId?: string): Promise<{
    hotels: HotelBooking[];
    flights: FlightBooking[];
    activities: ActivityBooking[];
  }> {
    const cacheKey = `bookings:user:${userId}${tripId ? `:trip:${tripId}` : ''}`;
    const cached = await this.cache.get(cacheKey) as any;
    
    if (cached) {
      return cached;
    }

    const bookings = {
      hotels: await this.getHotelBookings(userId, tripId),
      flights: await this.getFlightBookings(userId, tripId),
      activities: await this.getActivityBookings(userId, tripId)
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, bookings, 300);
    
    return bookings;
  }

  async cancelBooking(bookingId: string, bookingType: 'hotel' | 'flight' | 'activity'): Promise<boolean> {
    try {
      switch (bookingType) {
        case 'hotel':
          await this.cancelHotelBooking(bookingId);
          break;
        case 'flight':
          await this.cancelFlightBooking(bookingId);
          break;
        case 'activity':
          await this.cancelActivityBooking(bookingId);
          break;
      }

      this.metrics.incrementCounter('booking_cancellations', { type: bookingType });
      this.logger.info('Booking cancelled', { bookingId, type: bookingType });
      
      return true;
    } catch (error) {
      this.logger.error('Booking cancellation failed', error as Error, { bookingId, bookingType });
      return false;
    }
  }

  // Private helper methods
  private async mockHotelSearch(
    location: string,
    checkIn: Date,
    checkOut: Date,
    guests: number,
    filters?: BookingSearchFilters
  ): Promise<any[]> {
    // Mock implementation
    return [
      {
        id: 'hotel_1',
        name: 'Grand Plaza Hotel',
        location,
        rating: 4.5,
        price: 150,
        currency: 'USD',
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym'],
        images: []
      },
      {
        id: 'hotel_2',
        name: 'City Center Inn',
        location,
        rating: 4.0,
        price: 120,
        currency: 'USD',
        amenities: ['WiFi', 'Breakfast'],
        images: []
      }
    ];
  }

  private async mockHotelQuote(hotelId: string, checkIn: Date, checkOut: Date, guests: number): Promise<BookingQuote> {
    const basePrice = Math.floor(Math.random() * 200) + 100;
    const taxes = basePrice * 0.15;
    const fees = 25;

    return {
      providerId: 'booking_com',
      totalPrice: basePrice + taxes + fees,
      currency: 'USD',
      taxes,
      fees,
      basePrice,
      availability: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      cancellationPolicy: 'Free cancellation until 24 hours before check-in',
      refundPolicy: 'Full refund available within cancellation period',
      terms: 'Standard booking terms apply'
    };
  }

  private async mockFlightSearch(
    origin: string,
    destination: string,
    departureDate: Date,
    returnDate?: Date,
    passengers: number = 1,
    flightClass: string = 'economy'
  ): Promise<any[]> {
    return [
      {
        id: 'flight_1',
        airline: 'American Airlines',
        flightNumber: 'AA123',
        origin,
        destination,
        departureTime: departureDate,
        arrivalTime: new Date(departureDate.getTime() + 5 * 60 * 60 * 1000),
        price: 299,
        currency: 'USD',
        flightClass
      }
    ];
  }

  private async mockActivitySearch(
    location: string,
    date?: Date,
    category?: string,
    filters?: BookingSearchFilters
  ): Promise<any[]> {
    return [
      {
        id: 'activity_1',
        name: 'City Walking Tour',
        description: 'Explore the historic downtown area',
        location,
        category: 'sightseeing',
        duration: 180,
        price: 45,
        currency: 'USD',
        rating: 4.7
      }
    ];
  }

  private async processPayment(amount: number, currency: string, paymentInfo: PaymentInfo): Promise<{ success: boolean; transactionId?: string }> {
    // Mock payment processing
    return {
      success: true,
      transactionId: `txn_${Date.now()}`
    };
  }

  private async saveHotelBooking(booking: HotelBooking): Promise<void> {
    // Save to database
    this.logger.info('Saving hotel booking', { bookingId: booking.id });
  }

  private async saveFlightBooking(booking: FlightBooking): Promise<void> {
    // Save to database
    this.logger.info('Saving flight booking', { bookingId: booking.id });
  }

  private async saveActivityBooking(booking: ActivityBooking): Promise<void> {
    // Save to database
    this.logger.info('Saving activity booking', { bookingId: booking.id });
  }

  private async getHotelBookings(userId: string, tripId?: string): Promise<HotelBooking[]> {
    // Fetch from database
    return [];
  }

  private async getFlightBookings(userId: string, tripId?: string): Promise<FlightBooking[]> {
    // Fetch from database
    return [];
  }

  private async getActivityBookings(userId: string, tripId?: string): Promise<ActivityBooking[]> {
    // Fetch from database
    return [];
  }

  private async cancelHotelBooking(bookingId: string): Promise<void> {
    // Cancel hotel booking
  }

  private async cancelFlightBooking(bookingId: string): Promise<void> {
    // Cancel flight booking
  }

  private async cancelActivityBooking(bookingId: string): Promise<void> {
    // Cancel activity booking
  }

  private async invalidateHotelCaches(hotelId: string): Promise<void> {
    // Invalidate relevant cache entries
    await this.cache.deletePattern(`hotel:*:${hotelId}:*`);
  }
}

export const bookingService = new BookingService();