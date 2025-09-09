// Archivo: src/validators/trip.validator.ts
// Propósito: Define esquemas de validación con Zod para las rutas de viajes.

import { z } from 'zod';

export const createTripSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'El título es requerido'),
    destination: z.string().min(1, 'El destino es requerido'),
    startDate: z.string().transform((date, ctx) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // FIX: Use 'custom' issue code as 'invalid_format' requires a 'format' property not provided.
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de fecha debe ser YYYY-MM-DD" });
            return z.NEVER;
        }
        return date;
    }),
    endDate: z.string().transform((date, ctx) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // FIX: Use 'custom' issue code as 'invalid_format' requires a 'format' property not provided.
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de fecha debe ser YYYY-MM-DD" });
            return z.NEVER;
        }
        return date;
    }),
    budget: z.number().optional(),
    // Otros campos opcionales pueden ser añadidos aquí
  }).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
      message: 'La fecha de fin no puede ser anterior a la de inicio.',
      path: ['endDate'],
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    destination: z.string().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    budget: z.number().optional(),
    pace: z.enum(['relaxed', 'moderate', 'fast-paced']).optional(),
    interests: z.array(z.string()).optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  }, {
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
    path: ['endDate'],
  }),
});


export const shareTripSchema = z.object({
  body: z.object({
    email: z.string().email('Debe ser un email válido'),
    permissionLevel: z.enum(['EDITOR', 'VIEWER']),
  }),
});