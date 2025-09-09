import { Request, Response } from 'express';
import * as packingService from '../services/packing.service';
// FIX: Changed from namespace import to a named type import for User.
import type { User } from '@prisma/client';

export const getPackingListsHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    try {
        const lists = await packingService.findPackingListsByUserId(user.id);
        res.status(200).json(lists);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las listas de empaque' });
    }
};

export const getPackingListHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    try {
        const list = await packingService.findPackingListById(id, user.id);
        if (!list) {
            return res.status(404).json({ message: 'Lista no encontrada o sin acceso' });
        }
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la lista de empaque' });
    }
};

export const createPackingListHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { tripId, title, items } = req.body;
    try {
        const newList = await packingService.createPackingList({ tripId, title, items }, user.id);
        if (!newList) {
             return res.status(403).json({ message: 'No tienes permiso para añadir una lista a este viaje.' });
        }
        res.status(201).json(newList);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la lista de empaque' });
    }
};

export const patchPackingListHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    const { op, payload } = req.body;

    try {
        const updatedList = await packingService.patchPackingList(id, op, payload, user.id);
         if (!updatedList) {
            return res.status(404).json({ message: 'Lista no encontrada o sin acceso' });
        }
        res.status(200).json(updatedList);
    } catch (error: any) {
        // Handle specific errors like conflicts if the service layer throws them
        res.status(500).json({ message: error.message || 'Error al actualizar la lista' });
    }
};