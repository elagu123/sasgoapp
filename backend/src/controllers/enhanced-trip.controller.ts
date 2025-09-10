/**
 * Enhanced Trip Controller with Caching
 * High-performance trip endpoints with Redis caching
 */

import { Request, Response } from 'express';
import { enhancedTripService } from '../services/enhanced-trip.service';
import { getCacheService } from '../services/cache.service';
import type { User } from '@prisma/client';

export class EnhancedTripController {
  /**
   * Get all trips for authenticated user
   * Cached for 5 minutes per user
   */
  static async getUserTrips(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      
      const trips = await enhancedTripService.findTripsByUserId(user.id);
      
      // Set cache headers
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
      res.setHeader('X-Cache-Service', 'enhanced-trip');
      
      res.status(200).json(trips);
    } catch (error) {
      console.error('Get user trips error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get specific trip by ID
   * Cached for 10 minutes per trip
   */
  static async getTripById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { id: tripId } = req.params;

      if (!tripId) {
        res.status(400).json({ 
          message: 'ID de viaje requerido',
          code: 'MISSING_TRIP_ID'
        });
        return;
      }

      const trip = await enhancedTripService.findTripById(tripId, user.id);
      
      if (!trip) {
        res.status(404).json({ 
          message: 'Viaje no encontrado',
          code: 'TRIP_NOT_FOUND'
        });
        return;
      }

      // Set cache headers
      res.setHeader('Cache-Control', 'private, max-age=600'); // 10 minutes
      res.setHeader('X-Cache-Service', 'enhanced-trip');
      res.setHeader('Last-Modified', new Date(trip.updatedAt).toUTCString());
      
      res.status(200).json(trip);
    } catch (error) {
      console.error('Get trip by ID error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Create new trip
   * Invalidates user trips cache
   */
  static async createTrip(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { 
        title, 
        destination, 
        startDate, 
        endDate, 
        budget, 
        travelers, 
        pace, 
        interests 
      } = req.body;

      // Validation
      if (!title || !destination || !startDate || !endDate) {
        res.status(400).json({ 
          message: 'Campos requeridos: title, destination, startDate, endDate',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Prepare data
      const tripData = {
        title,
        destination: Array.isArray(destination) ? destination.join(', ') : destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget ? parseFloat(budget) : null,
        travelers: travelers ? parseInt(travelers) : 1,
        pace: pace || 'moderate',
        interests: interests || null
      };

      const newTrip = await enhancedTripService.createTrip(tripData, user.id);

      // Set cache invalidation headers
      res.setHeader('X-Cache-Invalidated', 'user-trips');
      
      res.status(201).json(newTrip);
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Update existing trip
   * Invalidates trip and user caches
   */
  static async updateTrip(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { id: tripId } = req.params;
      const updateData = req.body;

      if (!tripId) {
        res.status(400).json({ 
          message: 'ID de viaje requerido',
          code: 'MISSING_TRIP_ID'
        });
        return;
      }

      // Process destination if present
      if (updateData.destination && Array.isArray(updateData.destination)) {
        updateData.destination = updateData.destination.join(', ');
      }

      // Convert date strings to Date objects if present
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      // Convert numeric fields
      if (updateData.budget) {
        updateData.budget = parseFloat(updateData.budget);
      }
      if (updateData.travelers) {
        updateData.travelers = parseInt(updateData.travelers);
      }

      const updatedTrip = await enhancedTripService.updateTrip(tripId, updateData, user.id);
      
      if (!updatedTrip) {
        res.status(404).json({ 
          message: 'Viaje no encontrado o sin permisos',
          code: 'TRIP_NOT_FOUND_OR_NO_PERMISSION'
        });
        return;
      }

      // Set cache invalidation headers
      res.setHeader('X-Cache-Invalidated', `trip:${tripId},user-trips`);
      
      res.status(200).json(updatedTrip);
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Delete trip
   * Invalidates all related caches
   */
  static async deleteTrip(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { id: tripId } = req.params;

      if (!tripId) {
        res.status(400).json({ 
          message: 'ID de viaje requerido',
          code: 'MISSING_TRIP_ID'
        });
        return;
      }

      const deleted = await enhancedTripService.deleteTrip(tripId, user.id);
      
      if (!deleted) {
        res.status(404).json({ 
          message: 'Viaje no encontrado o sin permisos para eliminar',
          code: 'TRIP_NOT_FOUND_OR_NO_PERMISSION'
        });
        return;
      }

      // Set cache invalidation headers
      res.setHeader('X-Cache-Invalidated', `trip:${tripId},user-trips,shared-users`);
      
      res.status(200).json({ 
        message: 'Viaje eliminado exitosamente',
        code: 'TRIP_DELETED'
      });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Share trip with another user
   * Invalidates multiple user caches
   */
  static async shareTrip(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { id: tripId } = req.params;
      const { email, permissionLevel = 'VIEWER' } = req.body;

      if (!tripId || !email) {
        res.status(400).json({ 
          message: 'ID de viaje y email son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      if (!['EDITOR', 'VIEWER'].includes(permissionLevel)) {
        res.status(400).json({ 
          message: 'Nivel de permiso inválido. Use EDITOR o VIEWER',
          code: 'INVALID_PERMISSION_LEVEL'
        });
        return;
      }

      const sharedTrip = await enhancedTripService.shareTrip(
        tripId, 
        user.id, 
        email, 
        permissionLevel
      );
      
      if (!sharedTrip) {
        res.status(404).json({ 
          message: 'Viaje no encontrado o usuario no existe',
          code: 'TRIP_OR_USER_NOT_FOUND'
        });
        return;
      }

      // Set cache invalidation headers
      res.setHeader('X-Cache-Invalidated', `trip:${tripId},user-trips,permissions`);
      
      res.status(200).json(sharedTrip);
    } catch (error) {
      console.error('Share trip error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get trip expenses
   * Cached for 5 minutes per trip
   */
  static async getTripExpenses(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { id: tripId } = req.params;

      if (!tripId) {
        res.status(400).json({ 
          message: 'ID de viaje requerido',
          code: 'MISSING_TRIP_ID'
        });
        return;
      }

      const expenses = await enhancedTripService.getTripExpenses(tripId, user.id);
      
      if (expenses === null) {
        res.status(404).json({ 
          message: 'Viaje no encontrado o sin permisos',
          code: 'TRIP_NOT_FOUND_OR_NO_PERMISSION'
        });
        return;
      }

      // Set cache headers
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
      res.setHeader('X-Cache-Service', 'enhanced-trip-expenses');
      
      res.status(200).json(expenses);
    } catch (error) {
      console.error('Get trip expenses error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Add expense to trip
   * Invalidates expense cache
   */
  static async addTripExpense(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const { id: tripId } = req.params;
      const expenseData = req.body;

      if (!tripId) {
        res.status(400).json({ 
          message: 'ID de viaje requerido',
          code: 'MISSING_TRIP_ID'
        });
        return;
      }

      if (!expenseData.amount || !expenseData.description || !expenseData.category) {
        res.status(400).json({ 
          message: 'Campos requeridos: amount, description, category',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Prepare expense data
      const expense = {
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date ? new Date(expenseData.date) : new Date()
      };

      const newExpense = await enhancedTripService.addTripExpense(tripId, user.id, expense);
      
      if (!newExpense) {
        res.status(404).json({ 
          message: 'Viaje no encontrado o sin permisos',
          code: 'TRIP_NOT_FOUND_OR_NO_PERMISSION'
        });
        return;
      }

      // Set cache invalidation headers
      res.setHeader('X-Cache-Invalidated', `trip:${tripId}:expenses`);
      
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Add trip expense error:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await enhancedTripService.getCacheStats();
      const cacheService = getCacheService();
      const healthCheck = await cacheService.healthCheck();
      
      const response = {
        cache: {
          ...stats,
          latency: healthCheck.latency,
          status: healthCheck.status
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Get cache stats error:', error);
      res.status(500).json({ 
        message: 'Error al obtener estadísticas de cache',
        code: 'CACHE_STATS_ERROR'
      });
    }
  }
}

// Legacy wrapper functions for backward compatibility
export const getUserTripsHandler = (req: Request, res: Response) => 
  EnhancedTripController.getUserTrips(req, res);

export const getTripByIdHandler = (req: Request, res: Response) => 
  EnhancedTripController.getTripById(req, res);

export const createTripHandler = (req: Request, res: Response) => 
  EnhancedTripController.createTrip(req, res);

export const updateTripHandler = (req: Request, res: Response) => 
  EnhancedTripController.updateTrip(req, res);

export const deleteTripHandler = (req: Request, res: Response) => 
  EnhancedTripController.deleteTrip(req, res);

export const shareTripHandler = (req: Request, res: Response) => 
  EnhancedTripController.shareTrip(req, res);

export const getTripExpensesHandler = (req: Request, res: Response) => 
  EnhancedTripController.getTripExpenses(req, res);

export const addTripExpenseHandler = (req: Request, res: Response) => 
  EnhancedTripController.addTripExpense(req, res);

export const getCacheStatsHandler = EnhancedTripController.getCacheStats;