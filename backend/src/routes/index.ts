// Archivo: src/routes/index.ts
// Propósito: Enrutador principal de la API. Agrega todos los demás enrutadores.

import { Router } from 'express';
import authRouter from './auth.routes';
import tripRouter from './trip.routes';
import packingRouter from './packing.routes';
import expenseRouter from './expense.routes';
import gearRouter from './gear.routes';
import reservationRouter from './reservation.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/trips', tripRouter);
router.use('/packing', packingRouter);
router.use('/expenses', expenseRouter);
router.use('/gear', gearRouter);
router.use('/reservations', reservationRouter);

export default router;