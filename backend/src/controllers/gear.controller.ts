import { Request, Response } from 'express';
import * as gearService from '../services/gear.service';
import type { User } from '@prisma/client';

export const getAllGearHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    try {
        const gearList = await gearService.findGearByUserId(user.id);
        res.status(200).json(gearList);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el equipaje' });
    }
};

export const getGearByIdHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    try {
        const gear = await gearService.findGearById(id, user.id);
        if (!gear) {
            return res.status(404).json({ message: 'Equipaje no encontrado o sin acceso' });
        }
        res.status(200).json(gear);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el equipaje' });
    }
};

export const registerGearHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const gearData = req.body;

    // Convertir fechas de string a Date
    gearData.purchaseDate = new Date(gearData.purchaseDate);
    gearData.warrantyExpiresAt = new Date(gearData.warrantyExpiresAt);
    
    try {
        const newGear = await gearService.createGear(gearData, user.id);
        res.status(201).json(newGear);
    } catch (error) {
        console.error(error);
        // Manejar error de unicidad del número de serie
        if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('serial')) {
            return res.status(409).json({ message: 'El número de serie ya está registrado.' });
        }
        res.status(500).json({ message: 'Error al registrar el equipaje' });
    }
};