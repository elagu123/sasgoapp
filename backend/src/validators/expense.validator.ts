import { z } from 'zod';

const expenseCategories = z.enum(['alojamiento', 'comida', 'transporte', 'ocio', 'compras', 'otros']);

export const createExpenseSchema = z.object({
  body: z.object({
    tripId: z.string().cuid(),
    title: z.string().min(1, 'El título es requerido'),
    amount: z.number().int().positive('El monto debe ser positivo'),
    currency: z.enum(['USD', 'ARS', 'EUR']),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Formato de fecha inválido' }),
    category: expenseCategories,
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    amount: z.number().int().positive().optional(),
    currency: z.enum(['USD', 'ARS', 'EUR']).optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Formato de fecha inválido' }).optional(),
    category: expenseCategories.optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  })
});
