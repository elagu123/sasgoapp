import prisma from '../lib/prisma';
import type { Expense } from '@prisma/client';

/**
 * Verifica si un usuario tiene acceso de LECTURA a un viaje.
 * @param tripId - El ID del viaje.
 * @param userId - El ID del usuario.
 * @returns true si el usuario tiene acceso, false en caso contrario.
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
 * Encuentra todos los gastos de un viaje si el usuario tiene permiso.
 * @param tripId - El ID del viaje.
 * @param userId - El ID del usuario.
 * @returns Una lista de gastos o null si el usuario no tiene acceso.
 */
export const findExpensesByTripId = async (tripId: string, userId: string): Promise<Expense[] | null> => {
    if (!await canUserReadTrip(tripId, userId)) {
        return null;
    }
    return prisma.expense.findMany({
        where: { tripId },
        orderBy: { date: 'desc' },
    });
};

/**
 * Crea un nuevo gasto para un viaje si el usuario tiene permiso de ESCRITURA.
 * @param data - Datos del gasto a crear.
 * @param tripId - El ID del viaje asociado.
 * @param userId - El ID del usuario.
 * @returns El gasto creado o null si no tiene permiso.
 */
export const createExpense = async (data: Omit<Expense, 'id'>, tripId: string, userId: string): Promise<Expense | null> => {
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
    return prisma.expense.create({
        data: {
            ...data,
            tripId,
        },
    });
};

/**
 * Actualiza un gasto si el usuario tiene permiso de ESCRITURA sobre el viaje.
 * @param expenseId - El ID del gasto a actualizar.
 * @param data - Los datos a actualizar.
 * @param userId - El ID del usuario.
 * @returns El gasto actualizado o null si no se encuentra o no tiene permiso.
 */
export const updateExpense = async (expenseId: string, data: Partial<Expense>, userId: string): Promise<Expense | null> => {
    const expenseToUpdate = await prisma.expense.findFirst({
        where: {
            id: expenseId,
            trip: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId, permissionLevel: 'EDITOR' } } }
                ]
            }
        }
    });

    if (!expenseToUpdate) {
        return null; // No encontrado o sin permiso de escritura
    }

    return prisma.expense.update({
        where: { id: expenseId },
        data,
    });
};

/**
 * Elimina un gasto si el usuario tiene permiso de ESCRITURA sobre el viaje.
 * @param expenseId - El ID del gasto a eliminar.
 * @param userId - El ID del usuario.
 * @returns `true` si se eliminó, `false` en caso contrario.
 */
export const deleteExpense = async (expenseId: string, userId: string): Promise<boolean> => {
    const result = await prisma.expense.deleteMany({
        where: {
            id: expenseId,
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