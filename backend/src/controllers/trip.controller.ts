// Archivo: src/controllers/trip.controller.ts
// Propósito: Maneja las solicitudes HTTP para los endpoints de viajes.

// FIX: Changed `import type` to a value import to resolve type errors with Express.
import { Request, Response } from 'express';
import * as tripService from '../services/trip.service';
// FIX: Changed from namespace import to a named type import for User.
import type { User } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
  const { title, destination, startDate, endDate, budget, travelers, pace } = req.body;
  try {
    // Convert destination array to string if needed
    const destinationString = Array.isArray(destination) ? destination.join(', ') : destination;
    
    const newTrip = await tripService.createTrip({
      title,
      destination: destinationString,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: budget ? parseFloat(budget) : undefined,
      travelers: travelers ? parseInt(travelers) : 1,
      pace: pace || 'moderate'
    }, user.id);
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
  
  // Convertimos fechas a objetos Date si existen y parseamos los nuevos campos
  const dataToUpdate = { ...req.body };
  if (dataToUpdate.startDate) dataToUpdate.startDate = new Date(dataToUpdate.startDate);
  if (dataToUpdate.endDate) dataToUpdate.endDate = new Date(dataToUpdate.endDate);
  if (dataToUpdate.destination && Array.isArray(dataToUpdate.destination)) {
    dataToUpdate.destination = dataToUpdate.destination.join(', ');
  }
  if (dataToUpdate.budget) dataToUpdate.budget = parseFloat(dataToUpdate.budget);
  if (dataToUpdate.travelers) dataToUpdate.travelers = parseInt(dataToUpdate.travelers);

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

// Controlador para obtener miembros de un viaje
export const getTripMembersHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id: tripId } = req.params;
    try {
        const members = await tripService.getTripMembers(tripId, user.id);
        res.status(200).json(members);
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('acceso')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al obtener los miembros del viaje' });
    }
};

// Controlador para actualizar el rol de un miembro
export const updateMemberRoleHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id: tripId, memberId } = req.params;
    const { role } = req.body;
    try {
        const success = await tripService.updateMemberRole(tripId, user.id, memberId, role);
        if (!success) {
            return res.status(404).json({ message: 'Miembro no encontrado o sin permisos' });
        }
        res.status(200).json({ ok: true });
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('permiso')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al actualizar el rol del miembro' });
    }
};

// Controlador para remover un miembro del viaje
export const removeMemberHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id: tripId, memberId } = req.params;
    try {
        const success = await tripService.removeMember(tripId, user.id, memberId);
        if (!success) {
            return res.status(404).json({ message: 'Miembro no encontrado o sin permisos' });
        }
        res.status(200).json({ ok: true });
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('permiso')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al remover el miembro del viaje' });
    }
};

// Controlador para aceptar una invitación
export const acceptInvitationHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { invitationId } = req.params;
    try {
        const success = await tripService.acceptInvitation(invitationId, user.id);
        if (!success) {
            return res.status(404).json({ message: 'No se pudo aceptar la invitación' });
        }
        res.status(200).json({ ok: true });
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('no corresponde')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al aceptar la invitación' });
    }
};

// Controlador para rechazar una invitación
export const rejectInvitationHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { invitationId } = req.params;
    try {
        const success = await tripService.rejectInvitation(invitationId, user.id);
        if (!success) {
            return res.status(404).json({ message: 'No se pudo rechazar la invitación' });
        }
        res.status(200).json({ ok: true });
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('no corresponde')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al rechazar la invitación' });
    }
};

// Controlador para cancelar una invitación
export const cancelInvitationHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { invitationId } = req.params;
    try {
        const success = await tripService.cancelInvitation(invitationId, user.id);
        if (!success) {
            return res.status(404).json({ message: 'No se pudo cancelar la invitación' });
        }
        res.status(200).json({ ok: true });
    } catch (error: any) {
        if (error.message.includes('no encontrado') || error.message.includes('permiso')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al cancelar la invitación' });
    }
};

// Controlador para subir imagen de viaje
export const uploadTripImageHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id: tripId } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }
    
    try {
        // Verify trip ownership/access
        const trip = await tripService.findTripById(tripId, user.id);
        if (!trip) {
            // Remove uploaded file if trip access is denied
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Viaje no encontrado o sin acceso' });
        }
        
        // Delete old image if exists
        if (trip.imageUrl) {
            const oldImagePath = path.join('uploads/trips/', path.basename(trip.imageUrl));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        // Update trip with new image URL
        const imageUrl = `/uploads/trips/${req.file.filename}`;
        const updatedTrip = await tripService.updateTrip(tripId, { imageUrl }, user.id);
        
        res.status(200).json({
            message: 'Imagen subida exitosamente',
            imageUrl: imageUrl,
            trip: updatedTrip
        });
    } catch (error) {
        // Remove uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
};

// Controlador para eliminar imagen de viaje
export const deleteTripImageHandler = async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id: tripId } = req.params;
    
    try {
        const trip = await tripService.findTripById(tripId, user.id);
        if (!trip) {
            return res.status(404).json({ message: 'Viaje no encontrado o sin acceso' });
        }
        
        if (!trip.imageUrl) {
            return res.status(400).json({ message: 'El viaje no tiene imagen' });
        }
        
        // Delete image file
        const imagePath = path.join('uploads/trips/', path.basename(trip.imageUrl));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        
        // Update trip to remove image URL
        const updatedTrip = await tripService.updateTrip(tripId, { imageUrl: null }, user.id);
        
        res.status(200).json({
            message: 'Imagen eliminada exitosamente',
            trip: updatedTrip
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la imagen' });
    }
};