import { Request, Response } from 'express';
import * as reservationService from '../services/reservation.service';
import type { User } from '@prisma/client';

export const getReservationsHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { tripId } = req.query;

    if (!tripId || typeof tripId !== 'string') {
        return res.status(400).json({ message: 'tripId es requerido' });
    }

    try {
        const reservations = await reservationService.findReservationsByTripId(tripId, user.id);
        if (reservations === null) {
            return res.status(403).json({ message: 'No tienes acceso a este viaje' });
        }
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las reservas' });
    }
};

export const createReservationHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { tripId, ...reservationData } = req.body;
    
    try {
        const newReservation = await reservationService.createReservation(reservationData, tripId, user.id);
        if (!newReservation) {
            return res.status(403).json({ message: 'No tienes permiso para añadir reservas a este viaje' });
        }
        res.status(201).json(newReservation);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error al crear la reserva' });
    }
};

export const deleteReservationHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;

    try {
        const success = await reservationService.deleteReservation(id, user.id);
        if (!success) {
            return res.status(404).json({ message: 'Reserva no encontrada o sin acceso' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la reserva' });
    }
};