import { Request, Response } from 'express';
import * as expenseService from '../services/expense.service';
// FIX: Changed from type-only import to value import to resolve module resolution error.
import type { User } from '@prisma/client';

export const getExpensesHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { tripId } = req.query;

    if (!tripId || typeof tripId !== 'string') {
        return res.status(400).json({ message: 'tripId es requerido' });
    }

    try {
        const expenses = await expenseService.findExpensesByTripId(tripId, user.id);
        if (expenses === null) {
            return res.status(403).json({ message: 'No tienes acceso a este viaje' });
        }
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los gastos' });
    }
};

export const createExpenseHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { tripId, ...expenseData } = req.body;
    
    expenseData.date = new Date(expenseData.date); // Convert date string to Date object

    try {
        const newExpense = await expenseService.createExpense(expenseData, tripId, user.id);
        if (!newExpense) {
            return res.status(403).json({ message: 'No tienes permiso para añadir gastos a este viaje' });
        }
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el gasto' });
    }
};

export const updateExpenseHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    const expenseData = req.body;

    if (expenseData.date) {
        expenseData.date = new Date(expenseData.date);
    }

    try {
        const updatedExpense = await expenseService.updateExpense(id, expenseData, user.id);
        if (!updatedExpense) {
            return res.status(404).json({ message: 'Gasto no encontrado o sin acceso' });
        }
        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el gasto' });
    }
};

export const deleteExpenseHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;

    try {
        const success = await expenseService.deleteExpense(id, user.id);
        if (!success) {
            return res.status(404).json({ message: 'Gasto no encontrado o sin acceso' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el gasto' });
    }
};