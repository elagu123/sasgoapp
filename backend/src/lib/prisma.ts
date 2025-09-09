// Archivo: src/lib/prisma.ts
// Propósito: Inicializa y exporta una única instancia del cliente de Prisma.
// Esto previene la creación de múltiples conexiones a la base de datos.

// FIX: Changed from namespace import to a named import to resolve module resolution issues.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;