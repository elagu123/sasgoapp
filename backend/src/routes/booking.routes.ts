import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { bookingController } from '../controllers/booking.controller';

const router = Router();

// Apply authentication to all booking routes
router.use(authenticateToken);

// Hotel booking routes
router.get('/hotels/search', 
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 20 }), // 20 searches per minute
  cacheMiddleware({ 
    ttl: 1800, // 30 minutes
    varyBy: ['location', 'checkIn', 'checkOut', 'guests'],
    keyPrefix: 'hotel_search'
  }),
  bookingController.searchHotels.bind(bookingController)
);

router.get('/hotels/quote',
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 30 }), // 30 quotes per minute
  cacheMiddleware({ 
    ttl: 900, // 15 minutes
    varyBy: ['hotelId', 'checkIn', 'checkOut', 'guests'],
    keyPrefix: 'hotel_quote'
  }),
  bookingController.getHotelQuote.bind(bookingController)
);

router.post('/hotels/book',
  rateLimitMiddleware({ windowMs: 300000, maxRequests: 5 }), // 5 bookings per 5 minutes
  bookingController.bookHotel.bind(bookingController)
);

// Flight booking routes
router.get('/flights/search',
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 15 }), // 15 searches per minute
  cacheMiddleware({ 
    ttl: 3600, // 1 hour
    varyBy: ['origin', 'destination', 'departureDate', 'returnDate', 'passengers', 'class'],
    keyPrefix: 'flight_search'
  }),
  bookingController.searchFlights.bind(bookingController)
);

router.post('/flights/book',
  rateLimitMiddleware({ windowMs: 300000, maxRequests: 3 }), // 3 bookings per 5 minutes
  bookingController.bookFlight.bind(bookingController)
);

// Activity booking routes
router.get('/activities/search',
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 25 }), // 25 searches per minute
  cacheMiddleware({ 
    ttl: 7200, // 2 hours
    varyBy: ['location', 'date', 'category'],
    keyPrefix: 'activity_search'
  }),
  bookingController.searchActivities.bind(bookingController)
);

router.post('/activities/book',
  rateLimitMiddleware({ windowMs: 300000, maxRequests: 10 }), // 10 bookings per 5 minutes
  bookingController.bookActivity.bind(bookingController)
);

// General booking management
router.get('/user/bookings',
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 }), // 10 requests per minute
  cacheMiddleware({ 
    ttl: 300, // 5 minutes
    varyBy: ['userId', 'tripId'],
    keyPrefix: 'user_bookings'
  }),
  bookingController.getUserBookings.bind(bookingController)
);

router.post('/cancel/:bookingId',
  rateLimitMiddleware({ windowMs: 300000, maxRequests: 5 }), // 5 cancellations per 5 minutes
  bookingController.cancelBooking.bind(bookingController)
);

export default router;