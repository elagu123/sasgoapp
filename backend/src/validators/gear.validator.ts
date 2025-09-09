import { z } from 'zod';

export const registerGearSchema = z.object({
  body: z.object({
    serial: z.string().min(1, 'El número de serie es requerido'),
    qrCode: z.string().min(1, 'El código QR es requerido'),
    modelName: z.string().min(1, 'El nombre del modelo es requerido'),
    color: z.string().min(1, 'El color es requerido'),
    size: z.string().min(1, 'El tamaño es requerido'),
    purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Formato de fecha de compra inválido' }),
    channel: z.string().min(1, 'El canal de compra es requerido'),
    warrantyExpiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Formato de fecha de garantía inválido' }),
  }),
});
