import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().positive(),
  category: z.string(),
  notes: z.string().optional(),
});

export const createPackingListSchema = z.object({
  body: z.object({
    tripId: z.string().cuid(),
    title: z.string().min(1),
    items: z.array(itemSchema),
  }),
});

export const patchPackingListSchema = z.object({
  body: z.object({
    op: z.enum(['add', 'replace', 'remove', 'move']),
    payload: z.any(),
  }),
});
