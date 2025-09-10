import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { loggingService } from '../services/logging.service';
import { metricsService } from '../services/metrics.service';
import { z } from 'zod';

const logger = loggingService;
const metrics = metricsService;

// Validation schemas
const SearchHotelsSchema = z.object({
  location: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1).max(20),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().length(3).optional()
  }).optional(),
  rating: z.number().min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

const HotelQuoteSchema = z.object({
  hotelId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1).max(20)
});

const BookHotelSchema = z.object({
  tripId: z.string(),
  hotelId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1).max(20),
  roomType: z.string(),
  paymentInfo: z.object({
    method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
    cardNumber: z.string().optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).optional(),
    cvv: z.string().optional(),
    holderName: z.string().optional(),
    billingAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string()
    }).optional()
  })
});

const SearchFlightsSchema = z.object({
  origin: z.string().min(3).max(3), // Airport code
  destination: z.string().min(3).max(3), // Airport code
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().optional(),
  passengers: z.number().int().min(1).max(9).default(1),
  flightClass: z.enum(['economy', 'business', 'first']).default('economy')
});

const BookFlightSchema = z.object({
  tripId: z.string(),
  flightId: z.string(),
  passengers: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    type: z.enum(['adult', 'child', 'infant'])
  })),
  paymentInfo: z.object({
    method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
    cardNumber: z.string().optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).optional(),
    cvv: z.string().optional(),
    holderName: z.string().optional()
  })
});

const SearchActivitiesSchema = z.object({
  location: z.string().min(1),
  date: z.string().datetime().optional(),
  category: z.string().optional(),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().length(3).optional()
  }).optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  sortBy: z.enum(['price', 'rating', 'duration', 'popularity']).optional()
});

const BookActivitySchema = z.object({
  tripId: z.string(),
  activityId: z.string(),
  dateTime: z.string().datetime(),
  participants: z.number().int().min(1).max(50),
  paymentInfo: z.object({
    method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
    cardNumber: z.string().optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).optional(),
    cvv: z.string().optional(),
    holderName: z.string().optional()
  })
});

export class BookingController {
  
  // Hotel Methods
  async searchHotels(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const validatedData = SearchHotelsSchema.parse(req.query);
      
      // Only pass budget if all required fields are present
      const budget = validatedData.budget?.min !== undefined && 
                     validatedData.budget?.max !== undefined && 
                     validatedData.budget?.currency !== undefined 
        ? validatedData.budget as { min: number; max: number; currency: string }
        : undefined;

      const hotels = await bookingService.searchHotels(
        validatedData.location,
        new Date(validatedData.checkIn),
        new Date(validatedData.checkOut),
        validatedData.guests,
        {
          budget,
          rating: validatedData.rating,
          amenities: validatedData.amenities,
          sortBy: validatedData.sortBy,
          sortOrder: validatedData.sortOrder
        }
      );

      metrics.recordHistogram('booking_search_duration', Date.now() - startTime, {
        type: 'hotel',
        results_count: hotels.length.toString()
      });

      res.json({
        success: true,
        data: hotels,
        meta: {
          count: hotels.length,
          searchParams: validatedData
        }
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { 
        method: 'searchHotels',
        error_type: error instanceof z.ZodError ? 'validation' : 'service'
      });

      logger.error('Hotel search failed in controller', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        query: req.query,
        userId: req.user?.id
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Hotel search failed'
        });
      }
    }
  }

  async getHotelQuote(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = HotelQuoteSchema.parse(req.query);

      const quote = await bookingService.getHotelQuote(
        validatedData.hotelId,
        new Date(validatedData.checkIn),
        new Date(validatedData.checkOut),
        validatedData.guests
      );

      res.json({
        success: true,
        data: quote
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'getHotelQuote' });
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid quote parameters',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get hotel quote'
        });
      }
    }
  }

  async bookHotel(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = BookHotelSchema.parse(req.body);
      const userId = req.user!.id;

      const booking = await bookingService.bookHotel(
        validatedData.tripId,
        userId,
        validatedData.hotelId,
        new Date(validatedData.checkIn),
        new Date(validatedData.checkOut),
        validatedData.guests,
        validatedData.roomType,
        validatedData.paymentInfo
      );

      logger.info('Hotel booking created', {
        bookingId: booking.id,
        userId,
        tripId: validatedData.tripId,
        hotelId: validatedData.hotelId,
        totalPrice: booking.totalPrice
      });

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'bookHotel' });
      
      logger.error('Hotel booking failed in controller', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        body: req.body,
        userId: req.user?.id
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: (error as Error).message || 'Hotel booking failed'
        });
      }
    }
  }

  // Flight Methods
  async searchFlights(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const validatedData = SearchFlightsSchema.parse(req.query);

      const flights = await bookingService.searchFlights(
        validatedData.origin,
        validatedData.destination,
        new Date(validatedData.departureDate),
        validatedData.returnDate ? new Date(validatedData.returnDate) : undefined,
        validatedData.passengers,
        validatedData.flightClass
      );

      metrics.recordHistogram('booking_search_duration', Date.now() - startTime, {
        type: 'flight',
        results_count: flights.length.toString()
      });

      res.json({
        success: true,
        data: flights,
        meta: {
          count: flights.length,
          searchParams: validatedData
        }
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'searchFlights' });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Flight search failed'
        });
      }
    }
  }

  async bookFlight(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = BookFlightSchema.parse(req.body);
      const userId = req.user!.id;

      const booking = await bookingService.bookFlight(
        validatedData.tripId,
        userId,
        validatedData.flightId,
        validatedData.passengers,
        validatedData.paymentInfo
      );

      logger.info('Flight booking created', {
        bookingId: booking.id,
        userId,
        tripId: validatedData.tripId,
        flightId: validatedData.flightId
      });

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'bookFlight' });
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Flight booking failed'
        });
      }
    }
  }

  // Activity Methods
  async searchActivities(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const validatedData = SearchActivitiesSchema.parse(req.query);

      // Only pass budget if all required fields are present
      const budget = validatedData.budget?.min !== undefined && 
                     validatedData.budget?.max !== undefined && 
                     validatedData.budget?.currency !== undefined 
        ? validatedData.budget as { min: number; max: number; currency: string }
        : undefined;

      const activities = await bookingService.searchActivities(
        validatedData.location,
        validatedData.date ? new Date(validatedData.date) : undefined,
        validatedData.category,
        {
          budget,
          sortBy: validatedData.sortBy as any
        }
      );

      metrics.recordHistogram('booking_search_duration', Date.now() - startTime, {
        type: 'activity',
        results_count: activities.length.toString()
      });

      res.json({
        success: true,
        data: activities,
        meta: {
          count: activities.length,
          searchParams: validatedData
        }
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'searchActivities' });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Activity search failed'
        });
      }
    }
  }

  async bookActivity(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = BookActivitySchema.parse(req.body);
      const userId = req.user!.id;

      const booking = await bookingService.bookActivity(
        validatedData.tripId,
        userId,
        validatedData.activityId,
        new Date(validatedData.dateTime),
        validatedData.participants,
        validatedData.paymentInfo
      );

      logger.info('Activity booking created', {
        bookingId: booking.id,
        userId,
        tripId: validatedData.tripId,
        activityId: validatedData.activityId
      });

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'bookActivity' });
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Activity booking failed'
        });
      }
    }
  }

  // General Booking Management
  async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const tripId = req.query.tripId as string | undefined;

      const bookings = await bookingService.getUserBookings(userId, tripId);

      res.json({
        success: true,
        data: bookings,
        meta: {
          totalBookings: bookings.hotels.length + bookings.flights.length + bookings.activities.length
        }
      });
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'getUserBookings' });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings'
      });
    }
  }

  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { type } = req.body;

      if (!['hotel', 'flight', 'activity'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking type'
        });
        return;
      }

      const success = await bookingService.cancelBooking(bookingId, type);

      if (success) {
        logger.info('Booking cancelled', {
          bookingId,
          type,
          userId: req.user?.id
        });

        res.json({
          success: true,
          message: 'Booking cancelled successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to cancel booking'
        });
      }
    } catch (error) {
      metrics.incrementCounter('booking_controller_errors', { method: 'cancelBooking' });
      
      res.status(500).json({
        success: false,
        error: 'Booking cancellation failed'
      });
    }
  }
}

export const bookingController = new BookingController();