import { z } from 'zod';

const expenseCategories = z.enum(['alojamiento', 'comida', 'transporte', 'ocio', 'compras', 'otros']);

export const createExpenseSchema = z.object({
  body: z.object({
    tripId: z.string().cuid(),
    description: z.string().min(1, 'La descripción es requerida'),
    amount: z.number().positive('El monto debe ser positivo'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Formato de fecha inválido' }),
    category: expenseCategories,
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Formato de fecha inválido' }).optional(),
    category: expenseCategories.optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  })
});
