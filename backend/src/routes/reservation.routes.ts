import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    createReservationHandler,
    deleteReservationHandler,
    getReservationsHandler
} from '../controllers/reservation.controller';
import validate from '../middleware/validate.middleware';
import { reservationSchema } from '../validators/reservation.validator';

const router = Router();

// Todas las rutas de reservas están protegidas
router.use(protect);

router.route('/')
    .get(getReservationsHandler)
    .post(validate(reservationSchema), createReservationHandler);

router.route('/:id')
    // .put(...) // Placeholder for future update functionality
    .delete(deleteReservationHandler);

export default router;
