// Archivo: src/services/trip.service.ts
// Propósito: Contiene la lógica de negocio y las operaciones de base de datos para los viajes.

import prisma from '../lib/prisma';
import type { Trip, User, SharedTrip, PackingList, PackingListItem, Expense } from '@prisma/client';
import { findUserByEmail } from './user.service';

// Tipos que representan la estructura que espera el Frontend
type RoleFE = 'OWNER' | 'EDITOR' | 'VIEWER';
interface TripMemberFE {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: RoleFE;
}
interface TripFE extends Omit<Trip, 'userId' | 'startDate' | 'endDate'> {
    dates: {
        start: string;
        end: string;
    };
    members: TripMemberFE[];
}

// Objeto de inclusión de Prisma para obtener todas las relaciones necesarias en una sola consulta.
const tripWithIncludes = {
    include: {
        user: true, // El propietario del viaje
        sharedWith: { // Los usuarios con quienes se compartió
            include: {
                user: true // Los detalles de cada usuario compartido
            }
        },
        packingList: {
            include: {
                items: { orderBy: { order: 'asc' } }
            }
        },
        expenses: {
            orderBy: { date: 'desc' }
        }
    }
};

// Tipo derivado para el objeto Trip con todas sus relaciones incluidas.
type PrismaTripWithRelations = Trip & {
    user: User;
    sharedWith: (SharedTrip & { user: User })[];
    packingList: (PackingList & { items: PackingListItem[] }) | null;
    expenses: Expense[];
};

/**
 * Transforma un objeto de viaje de Prisma a la estructura que espera el frontend.
 * Principalmente, unifica `user` y `sharedWith` en un único array `members`.
 * @param trip - El objeto de viaje completo desde Prisma.
 * @returns Un objeto de viaje formateado para el frontend.
 */
const transformTrip = (trip: PrismaTripWithRelations): TripFE => {
    const owner: TripMemberFE = {
        id: trip.user.id,
        name: trip.user.name,
        email: trip.user.email,
        avatarUrl: `https://i.pravatar.cc/150?u=${trip.user.email}`,
        role: 'OWNER',
    };

    const sharedMembers: TripMemberFE[] = trip.sharedWith.map((share) => ({
        id: share.user.id,
        name: share.user.name,
        email: share.user.email,
        avatarUrl: `https://i.pravatar.cc/150?u=${share.user.email}`,
        role: share.permissionLevel as RoleFE,
    }));
    
    // --- N+1 Optimization: Calculate derived properties here ---
    const packingProgress = trip.packingList
      ? {
          total: trip.packingList.items.length,
          packed: trip.packingList.items.filter(item => item.packed).length
        }
      : undefined;
      
    const totalDays = trip.startDate && trip.endDate
        ? Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 0;

    const itineraryJson = trip.itinerary as any[] || [];
    const plannedDaysCount = new Set(itineraryJson.flatMap(day => (day.blocks && day.blocks.length > 0) ? [day.date] : [])).size;
    
    const itineraryCompletion = totalDays > 0 ? Math.round((plannedDaysCount / totalDays) * 100) : 0;

    const { user, sharedWith, userId, startDate, endDate, ...rest } = trip;
    
    return {
        ...rest,
        dates: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
        },
        members: [owner, ...sharedMembers],
        itinerary: trip.itinerary ? trip.itinerary as any[] : [],
        expenses: trip.expenses.map(e => ({
            ...e,
            date: e.date.toISOString().split('T')[0],
        })),
        packingProgress,
        itineraryCompletion,
    };
};

/**
 * Encuentra todos los viajes asociados a un usuario.
 * @param userId - El ID del usuario.
 * @returns Una promesa que resuelve a un array de viajes formateados para el frontend.
 */
export const findTripsByUserId = async (userId: string): Promise<TripFE[]> => {
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { userId },
        { sharedWith: { some: { userId } } },
      ],
    },
    orderBy: {
      startDate: 'asc',
    },
    ...tripWithIncludes
  });
  return trips.map(transformTrip);
};

/**
 * Encuentra un viaje específico por su ID, verificando el permiso del usuario.
 * @param tripId - El ID del viaje.
 * @param userId - El ID del usuario que solicita.
 * @returns Una promesa que resuelve al viaje formateado o null.
 */
export const findTripById = async (tripId: string, userId: string): Promise<TripFE | null> => {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId },
          { sharedWith: { some: { userId } } },
        ],
      },
      ...tripWithIncludes
    });
    return trip ? transformTrip(trip) : null;
};

/**
 * Crea un nuevo viaje para un usuario.
 * @param data - Datos para crear el viaje.
 * @param userId - El ID del usuario propietario.
 * @returns Una promesa que resuelve al viaje recién creado y formateado.
 */
export const createTrip = async (data: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'itinerary' | 'privacy' | 'itineraryCompletion' | 'packingListId' | 'version' | 'weather' | 'packingProgress' | 'imageUrl' | 'selectedAccommodationId' | 'travelers' | 'pace' | 'budget' | 'interests'>, userId: string): Promise<TripFE> => {
    const trip = await prisma.trip.create({
      data: {
        ...data,
        user: {
          connect: { id: userId }
        }
      },
      ...tripWithIncludes
    });
    return transformTrip(trip);
};

/**
 * Actualiza un viaje existente. Solo el propietario puede actualizar.
 * @param tripId - El ID del viaje a actualizar.
 * @param data - Los campos a actualizar.
 * @param userId - El ID del usuario propietario.
 * @returns Una promesa que resuelve al viaje actualizado y formateado, o null.
 */
export const updateTrip = async (tripId: string, data: Partial<Trip>, userId: string): Promise<TripFE | null> => {
    const updateResult = await prisma.trip.updateMany({
        where: {
            id: tripId,
            userId, 
        },
        data: data as any,
    });
    
    if (updateResult.count === 0) {
        return null;
    }

    return findTripById(tripId, userId);
};

/**
 * Elimina un viaje. Solo el propietario puede eliminar.
 * @param tripId - El ID del viaje a eliminar.
 * @param userId - El ID del usuario propietario.
 * @returns Una promesa que resuelve a true si se eliminó, false en caso contrario.
 */
export const deleteTrip = async (tripId: string, userId: string): Promise<boolean> => {
    const deleteResult = await prisma.trip.deleteMany({
        where: {
            id: tripId,
            userId,
        },
    });
    return deleteResult.count > 0;
};

/**
 * Comparte un viaje con otro usuario.
 * @param tripId - El ID del viaje a compartir.
 * @param ownerId - El ID del propietario del viaje.
 * @param targetUserEmail - El email del usuario con quien se compartirá.
 * @param permissionLevel - El nivel de permiso ('EDITOR' o 'VIEWER').
 * @returns El viaje actualizado y formateado con el nuevo miembro.
 */
export const shareTrip = async (tripId: string, ownerId: string, targetUserEmail: string, permissionLevel: 'EDITOR' | 'VIEWER'): Promise<TripFE | null> => {
    const targetUser = await findUserByEmail(targetUserEmail);
    if (!targetUser) {
        throw new Error('Usuario a compartir no encontrado.');
    }
    
    if (targetUser.id === ownerId) {
        throw new Error('No puedes compartir un viaje contigo mismo.');
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== ownerId) {
        throw new Error('Viaje no encontrado o no tienes permiso para compartirlo.');
    }

    await prisma.sharedTrip.upsert({
        where: {
            tripId_userId: {
                tripId,
                userId: targetUser.id,
            },
        },
        update: {
            permissionLevel,
        },
        create: {
            tripId,
            userId: targetUser.id,
            permissionLevel,
        },
    });

    return findTripById(tripId, ownerId);
};