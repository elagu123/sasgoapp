import { z } from 'zod';

export const reservationSchema = z.object({
  body: z.object({
    tripId: z.string().cuid(),
    type: z.enum(['FLIGHT', 'HOTEL', 'CAR_RENTAL', 'OTHER']),
    title: z.string().min(1, 'El título es requerido'),
    // FIX: Explicitly define key and value types for z.record to resolve error.
    details: z.record(z.string(), z.any()), // Allow any JSON object
    startDate: z.string().min(1, 'La fecha de inicio es requerida').refine((val) => !isNaN(Date.parse(val)), { message: "La fecha de inicio debe ser una fecha y hora válidas" }),
    endDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), { message: "La fecha de fin debe ser una fecha y hora válidas" }),
  }),
});