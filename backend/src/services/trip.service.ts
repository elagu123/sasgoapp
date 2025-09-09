// Archivo: src/services/trip.service.ts
// Propósito: Contiene la lógica de negocio y las operaciones de base de datos para los viajes.

import prisma from '../lib/prisma';
import type { Trip, User, SharedTrip, PackingList, PackingListItem, Expense } from '@prisma/client';
import { Prisma } from '@prisma/client';
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
    expenses: any[];
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
                items: { orderBy: { order: Prisma.SortOrder.asc } }
            }
        },
        expenses: {
            orderBy: { date: Prisma.SortOrder.desc }
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

    const itineraryJson = trip.itinerary ? JSON.parse(trip.itinerary) : [];
    const plannedDaysCount = new Set(itineraryJson.flatMap((day: any) => (day.blocks && day.blocks.length > 0) ? [day.date] : [])).size;
    
    const itineraryCompletion = totalDays > 0 ? Math.round((plannedDaysCount / totalDays) * 100) : 0;

    const { user, sharedWith, userId, startDate, endDate, ...rest } = trip;
    
    return {
        ...rest,
        destination: trip.destination.split(', '), // Convert string back to array for frontend
        dates: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
        },
        members: [owner, ...sharedMembers],
        itinerary: itineraryJson,
        expenses: trip.expenses.map(e => ({
            ...e,
            date: e.date.toISOString().split('T')[0],
        })),
        packingProgress: packingProgress ? JSON.stringify(packingProgress) : null,
        itineraryCompletion,
        travelers: trip.travelers || 1,
        pace: trip.pace || 'moderate',
        budget: trip.budget || 0,
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
export const createTrip = async (data: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'itinerary' | 'privacy' | 'itineraryCompletion' | 'packingListId' | 'version' | 'weather' | 'packingProgress' | 'imageUrl' | 'selectedAccommodationId' | 'interests'>, userId: string): Promise<TripFE> => {
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
 * Comparte un viaje con otro usuario creando una invitación.
 * @param tripId - El ID del viaje a compartir.
 * @param ownerId - El ID del propietario del viaje.
 * @param targetUserEmail - El email del usuario con quien se compartirá.
 * @param permissionLevel - El nivel de permiso ('EDITOR' o 'VIEWER').
 * @returns El viaje actualizado y formateado con la nueva invitación.
 */
export const shareTrip = async (tripId: string, ownerId: string, targetUserEmail: string, permissionLevel: 'EDITOR' | 'VIEWER'): Promise<TripFE | null> => {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== ownerId) {
        throw new Error('Viaje no encontrado o no tienes permiso para compartirlo.');
    }

    if (targetUserEmail === (await prisma.user.findUnique({ where: { id: ownerId } }))?.email) {
        throw new Error('No puedes compartir un viaje contigo mismo.');
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findUnique({
        where: {
            tripId_email: {
                tripId,
                email: targetUserEmail,
            },
        },
    });

    if (existingInvitation) {
        // Update existing invitation if it's pending or cancelled
        if (existingInvitation.status === 'PENDING' || existingInvitation.status === 'CANCELLED') {
            await prisma.invitation.update({
                where: { id: existingInvitation.id },
                data: {
                    permissionLevel,
                    status: 'PENDING',
                    invitedAt: new Date(),
                    respondedAt: null,
                },
            });
        } else {
            throw new Error('Ya existe una invitación activa para este email.');
        }
    } else {
        // Create new invitation
        await prisma.invitation.create({
            data: {
                tripId,
                email: targetUserEmail,
                permissionLevel,
                invitedById: ownerId,
            },
        });
    }

    return findTripById(tripId, ownerId);
};

/**
 * Obtiene los miembros de un viaje con sus roles y las invitaciones pendientes.
 * @param tripId - El ID del viaje.
 * @param userId - El ID del usuario que solicita (debe ser miembro o propietario).
 * @returns Una promesa con los miembros e invitaciones del viaje.
 */
export const getTripMembers = async (tripId: string, userId: string): Promise<{ members: TripMemberFE[], invites: any[] }> => {
    const trip = await prisma.trip.findFirst({
        where: {
            OR: [
                { id: tripId, userId },
                { id: tripId, sharedWith: { some: { userId } } }
            ]
        },
        include: {
            user: true,
            sharedWith: {
                include: {
                    user: true
                }
            },
            invitations: {
                where: {
                    status: 'PENDING'
                },
                include: {
                    invitedBy: true
                }
            }
        }
    });

    if (!trip) {
        throw new Error('Viaje no encontrado o sin acceso.');
    }

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

    const invitations = trip.invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.permissionLevel,
        status: invitation.status,
        invitedAt: invitation.invitedAt,
        invitedBy: invitation.invitedBy.name,
    }));

    return {
        members: [owner, ...sharedMembers],
        invites: invitations
    };
};

/**
 * Actualiza el rol de un miembro en un viaje.
 * @param tripId - El ID del viaje.
 * @param ownerId - El ID del propietario del viaje.
 * @param memberId - El ID del miembro cuyo rol se actualizará.
 * @param newRole - El nuevo rol para el miembro.
 * @returns Una promesa que resuelve a true si se actualizó correctamente.
 */
export const updateMemberRole = async (tripId: string, ownerId: string, memberId: string, newRole: 'EDITOR' | 'VIEWER'): Promise<boolean> => {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== ownerId) {
        throw new Error('Viaje no encontrado o no tienes permiso para modificar roles.');
    }

    const updateResult = await prisma.sharedTrip.updateMany({
        where: {
            tripId,
            userId: memberId,
        },
        data: {
            permissionLevel: newRole,
        },
    });

    return updateResult.count > 0;
};

/**
 * Remueve un miembro de un viaje.
 * @param tripId - El ID del viaje.
 * @param ownerId - El ID del propietario del viaje.
 * @param memberId - El ID del miembro a remover.
 * @returns Una promesa que resuelve a true si se removió correctamente.
 */
export const removeMember = async (tripId: string, ownerId: string, memberId: string): Promise<boolean> => {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== ownerId) {
        throw new Error('Viaje no encontrado o no tienes permiso para remover miembros.');
    }

    if (memberId === ownerId) {
        throw new Error('No puedes removerte a ti mismo siendo el propietario.');
    }

    const deleteResult = await prisma.sharedTrip.deleteMany({
        where: {
            tripId,
            userId: memberId,
        },
    });

    return deleteResult.count > 0;
};

/**
 * Acepta una invitación de viaje.
 * @param invitationId - El ID de la invitación.
 * @param userId - El ID del usuario que acepta (debe coincidir con el email de la invitación).
 * @returns Una promesa que resuelve a true si se aceptó correctamente.
 */
export const acceptInvitation = async (invitationId: string, userId: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Usuario no encontrado.');
    }

    const invitation = await prisma.invitation.findUnique({ 
        where: { id: invitationId },
        include: { trip: true }
    });
    
    if (!invitation || invitation.email !== user.email) {
        throw new Error('Invitación no encontrada o no corresponde a tu email.');
    }

    if (invitation.status !== 'PENDING') {
        throw new Error('Esta invitación ya ha sido procesada.');
    }

    // Create shared trip relationship
    await prisma.sharedTrip.create({
        data: {
            tripId: invitation.tripId,
            userId: userId,
            permissionLevel: invitation.permissionLevel,
        },
    });

    // Update invitation status
    await prisma.invitation.update({
        where: { id: invitationId },
        data: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
        },
    });

    return true;
};

/**
 * Rechaza una invitación de viaje.
 * @param invitationId - El ID de la invitación.
 * @param userId - El ID del usuario que rechaza (debe coincidir con el email de la invitación).
 * @returns Una promesa que resuelve a true si se rechazó correctamente.
 */
export const rejectInvitation = async (invitationId: string, userId: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Usuario no encontrado.');
    }

    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    
    if (!invitation || invitation.email !== user.email) {
        throw new Error('Invitación no encontrada o no corresponde a tu email.');
    }

    if (invitation.status !== 'PENDING') {
        throw new Error('Esta invitación ya ha sido procesada.');
    }

    // Update invitation status
    await prisma.invitation.update({
        where: { id: invitationId },
        data: {
            status: 'REJECTED',
            respondedAt: new Date(),
        },
    });

    return true;
};

/**
 * Cancela una invitación de viaje (solo el propietario del viaje puede hacerlo).
 * @param invitationId - El ID de la invitación.
 * @param ownerId - El ID del propietario del viaje.
 * @returns Una promesa que resuelve a true si se canceló correctamente.
 */
export const cancelInvitation = async (invitationId: string, ownerId: string): Promise<boolean> => {
    const invitation = await prisma.invitation.findUnique({ 
        where: { id: invitationId },
        include: { trip: true }
    });
    
    if (!invitation) {
        throw new Error('Invitación no encontrada.');
    }

    if (invitation.trip.userId !== ownerId) {
        throw new Error('No tienes permiso para cancelar esta invitación.');
    }

    if (invitation.status !== 'PENDING') {
        throw new Error('Solo se pueden cancelar invitaciones pendientes.');
    }

    // Update invitation status
    await prisma.invitation.update({
        where: { id: invitationId },
        data: {
            status: 'CANCELLED',
            respondedAt: new Date(),
        },
    });

    return true;
};