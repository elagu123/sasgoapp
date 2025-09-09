// Archivo: src/controllers/trip.controller.ts
// Propósito: Maneja las solicitudes HTTP para los endpoints de viajes.

// FIX: Changed `import type` to a value import to resolve type errors with Express.
import { Request, Response } from 'express';
import * as tripService from '../services/trip.service';
// FIX: Changed from namespace import to a named type import for User.
import type { User } from '@prisma/client';

// Controlador para obtener todos los viajes del usuario logueado
export const getAllTripsHandler = async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  try {
    const trips = await tripService.findTripsByUserId(user.id);
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los viajes' });
  }
};

// Controlador para obtener un viaje por su ID
export const getTripByIdHandler = async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  try {
    const trip = await tripService.findTripById(id, user.id);
    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado o sin acceso' });
    }
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el viaje' });
  }
};

// Controlador para crear un nuevo viaje
export const createTripHandler = async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { title, destination, startDate, endDate, budget } = req.body;
  try {
    const newTrip = await tripService.createTrip({
      title,
      destination: { set: destination }, // Prisma necesita `set` para arrays de primitivos
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget
    } as any, user.id);
    res.status(201).json(newTrip);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error al crear el viaje' });
  }
};

// Controlador para actualizar un viaje
export const updateTripHandler = async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  
  // Convertimos fechas a objetos Date si existen
  const dataToUpdate = { ...req.body };
  if (dataToUpdate.startDate) dataToUpdate.startDate = new Date(dataToUpdate.startDate);
  if (dataToUpdate.endDate) dataToUpdate.endDate = new Date(dataToUpdate.endDate);
  if (dataToUpdate.destination) dataToUpdate.destination = { set: dataToUpdate.destination };

  try {
    const updatedTrip = await tripService.updateTrip(id, dataToUpdate, user.id);
    if (!updatedTrip) {
      return res.status(403).json({ message: 'No tienes permiso para editar este viaje o el viaje no existe' });
    }
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el viaje' });
  }
};

// Controlador para eliminar un viaje
export const deleteTripHandler = async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  try {
    const success = await tripService.deleteTrip(id, user.id);
    if (!success) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este viaje o el viaje no existe' });
    }
    res.status(204).send(); // No Content
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el viaje' });
  }
};

// Controlador para compartir un viaje
export const shareTripHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id: tripId } = req.params;
    const { email, permissionLevel } = req.body;

    try {
        const trip = await tripService.shareTrip(tripId, user.id, email, permissionLevel);
        res.status(200).json(trip);
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('permiso')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al compartir el viaje' });
    }
};