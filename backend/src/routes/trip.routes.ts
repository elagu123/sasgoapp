// Archivo: src/routes/trip.routes.ts
// Propósito: Define las rutas para las operaciones CRUD de viajes.

import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { 
    createTripHandler,
    deleteTripHandler,
    getAllTripsHandler,
    getTripByIdHandler,
    shareTripHandler,
    updateTripHandler
} from '../controllers/trip.controller';
import { createTripSchema, updateTripSchema, shareTripSchema } from '../validators/trip.validator';

const router = Router();

// Todas las rutas de viajes están protegidas y requieren autenticación
router.use(protect);

router.route('/')
    .get(getAllTripsHandler)
    .post(validate(createTripSchema), createTripHandler);

router.route('/:id')
    .get(getTripByIdHandler)
    .put(validate(updateTripSchema), updateTripHandler)
    .delete(deleteTripHandler);
    
router.post('/:id/share', validate(shareTripSchema), shareTripHandler);

export default router;
