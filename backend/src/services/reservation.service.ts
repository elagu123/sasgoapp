import prisma from '../lib/prisma';
import type { Reservation } from '@prisma/client';

/**
 * Verifica si un usuario tiene acceso de LECTURA a un viaje.
 */
const canUserReadTrip = async (tripId: string, userId: string): Promise<boolean> => {
    const trip = await prisma.trip.findFirst({
        where: {
            id: tripId,
            OR: [
                { userId: userId },
                { sharedWith: { some: { userId: userId } } },
            ],
        },
    });
    return !!trip;
};

/**
 * Formatea una reserva de la base de datos para el frontend.
 */
const formatReservation = (reservation: Reservation): any => ({
    ...reservation,
    startDate: reservation.startDate.toISOString(),
    endDate: reservation.endDate?.toISOString() ?? undefined,
});


/**
 * Encuentra todas las reservas de un viaje si el usuario tiene permiso.
 */
export const findReservationsByTripId = async (tripId: string, userId: string): Promise<Reservation[] | null> => {
    if (!await canUserReadTrip(tripId, userId)) {
        return null;
    }
    const reservations = await prisma.reservation.findMany({
        where: { tripId },
        orderBy: { startDate: 'asc' },
    });
    return reservations.map(formatReservation);
};

/**
 * Crea una nueva reserva para un viaje si el usuario tiene permiso de ESCRITURA.
 */
export const createReservation = async (data: Omit<Reservation, 'id' | 'tripId'>, tripId: string, userId: string): Promise<Reservation | null> => {
    const trip = await prisma.trip.findFirst({
        where: {
            id: tripId,
            OR: [
                { userId: userId },
                { sharedWith: { some: { userId: userId, permissionLevel: 'EDITOR' } } },
            ],
        },
    });
    if (!trip) {
        return null; // No tiene permisos de escritura
    }

    const reservation = await prisma.reservation.create({
        data: {
            ...data,
            tripId,
        } as any,
    });
    return formatReservation(reservation);
};

/**
 * Elimina una reserva si el usuario tiene permiso de ESCRITURA sobre el viaje.
 */
export const deleteReservation = async (reservationId: string, userId: string): Promise<boolean> => {
    const result = await prisma.reservation.deleteMany({
        where: {
            id: reservationId,
            trip: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId, permissionLevel: 'EDITOR' } } }
                ]
            }
        }
    });
    return result.count > 0;
};