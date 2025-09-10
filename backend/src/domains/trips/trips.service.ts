/**
 * Trips Domain Service
 * Encapsulates all trip-related business logic
 * This service can be extracted to a separate microservice
 */

import prisma from '../../lib/prisma';
import { getCacheService } from '../../services/cache.service';
import loggingService from '../../services/logging.service';
import { businessMonitoring } from '../../middleware/monitoring.middleware';
import type { Trip, User, SharedTrip, Expense, PackingList, PackingListItem } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface CreateTripData {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number | null;
  travelers?: number;
  pace?: string;
  interests?: string;
}

export interface UpdateTripData {
  title?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number | null;
  travelers?: number;
  pace?: string;
  interests?: string;
}

export interface TripWithDetails extends Trip {
  user: User;
  sharedWith: (SharedTrip & { user: User })[];
  expenses: Expense[];
  packingList: (PackingList & { items: PackingListItem[] }) | null;
}

export interface ShareTripData {
  email: string;
  permissionLevel: 'EDITOR' | 'VIEWER';
}

export class TripsService {
  private cache = getCacheService();

  // Include configuration for complete trip data
  private readonly includeConfig = {
    include: {
      user: true,
      sharedWith: {
        include: {
          user: true
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

  /**
   * Get all trips accessible by a user
   */
  async getUserTrips(userId: string): Promise<TripWithDetails[]> {
    try {
      // Try cache first
      const cacheKey = `trips:user:${userId}`;
      const cachedTrips = await this.cache.get<TripWithDetails[]>(cacheKey);
      
      if (cachedTrips) {
        loggingService.debug('Cache hit for user trips', { userId });
        return cachedTrips;
      }

      // Fetch from database
      const trips = await prisma.trip.findMany({
        where: {
          OR: [
            { userId: userId },
            { sharedWith: { some: { userId: userId } } }
          ]
        },
        ...this.includeConfig,
        orderBy: { createdAt: Prisma.SortOrder.desc }
      });

      // Cache the results for 5 minutes
      await this.cache.set(cacheKey, trips, 300);

      loggingService.info('User trips retrieved', { 
        userId, 
        tripCount: trips.length 
      });

      return trips;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_user_trips',
        userId,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Get a specific trip by ID
   */
  async getTripById(tripId: string, userId: string): Promise<TripWithDetails | null> {
    try {
      // Check permissions and get trip
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          OR: [
            { userId: userId },
            { sharedWith: { some: { userId: userId } } }
          ]
        },
        ...this.includeConfig
      });

      if (!trip) {
        loggingService.warn('Trip access denied or not found', { 
          tripId, 
          userId 
        });
        return null;
      }

      loggingService.info('Trip retrieved', { 
        tripId, 
        userId,
        tripTitle: trip.title
      });

      return trip;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_trip_by_id',
        tripId,
        userId,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Create a new trip
   */
  async createTrip(data: CreateTripData, userId: string): Promise<TripWithDetails> {
    try {
      const trip = await prisma.trip.create({
        data: {
          ...data,
          userId: userId
        },
        ...this.includeConfig
      });

      // Invalidate user trips cache
      await this.invalidateUserTripsCache(userId);

      businessMonitoring.logTripOperation('create', trip.id, userId, {
        destinationType: this.categorizeDestination(data.destination),
        budget: data.budget,
        travelers: data.travelers
      });

      loggingService.info('Trip created', {
        tripId: trip.id,
        userId,
        title: trip.title,
        destination: trip.destination
      });

      return trip;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'create_trip',
        userId,
        tripData: data,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Update an existing trip
   */
  async updateTrip(tripId: string, data: UpdateTripData, userId: string): Promise<TripWithDetails | null> {
    try {
      // Check if user has edit permissions
      const hasPermission = await this.hasEditPermission(tripId, userId);
      if (!hasPermission) {
        loggingService.logPermissionDenied(`trip:${tripId}:edit`, userId);
        return null;
      }

      const trip = await prisma.trip.update({
        where: { id: tripId },
        data: data,
        ...this.includeConfig
      });

      // Invalidate caches
      await this.invalidateTripCaches(tripId);

      businessMonitoring.logTripOperation('update', tripId, userId, {
        updatedFields: Object.keys(data)
      });

      loggingService.info('Trip updated', {
        tripId,
        userId,
        updatedFields: Object.keys(data)
      });

      return trip;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'update_trip',
        tripId,
        userId,
        updateData: data,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId: string, userId: string): Promise<boolean> {
    try {
      // Only trip owner can delete
      const trip = await prisma.trip.findFirst({
        where: { 
          id: tripId, 
          userId: userId 
        },
        include: {
          sharedWith: { select: { userId: true } }
        }
      });

      if (!trip) {
        loggingService.logPermissionDenied(`trip:${tripId}:delete`, userId);
        return false;
      }

      // Get shared users for cache invalidation
      const sharedUserIds = trip.sharedWith.map(shared => shared.userId);

      await prisma.trip.delete({
        where: { id: tripId }
      });

      // Invalidate caches for owner and shared users
      await this.invalidateUserTripsCache(userId);
      await Promise.all(
        sharedUserIds.map(sharedUserId => this.invalidateUserTripsCache(sharedUserId))
      );

      businessMonitoring.logTripOperation('delete', tripId, userId);

      loggingService.info('Trip deleted', {
        tripId,
        userId,
        sharedUserCount: sharedUserIds.length
      });

      return true;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'delete_trip',
        tripId,
        userId,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Share a trip with another user
   */
  async shareTrip(tripId: string, ownerId: string, shareData: ShareTripData): Promise<TripWithDetails | null> {
    try {
      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { 
          id: tripId, 
          userId: ownerId 
        }
      });

      if (!trip) {
        loggingService.logPermissionDenied(`trip:${tripId}:share`, ownerId);
        return null;
      }

      // Find user to share with
      const userToShare = await prisma.user.findUnique({
        where: { email: shareData.email }
      });

      if (!userToShare) {
        loggingService.warn('Attempted to share trip with non-existent user', {
          tripId,
          ownerId,
          email: shareData.email
        });
        return null;
      }

      // Create or update sharing relationship
      await prisma.sharedTrip.upsert({
        where: {
          tripId_userId: {
            tripId: tripId,
            userId: userToShare.id
          }
        },
        update: {
          permissionLevel: shareData.permissionLevel
        },
        create: {
          tripId: tripId,
          userId: userToShare.id,
          permissionLevel: shareData.permissionLevel
        }
      });

      // Invalidate caches
      await this.invalidateTripCaches(tripId);
      await this.invalidateUserTripsCache(ownerId);
      await this.invalidateUserTripsCache(userToShare.id);

      businessMonitoring.logTripOperation('share', tripId, ownerId, {
        permissionLevel: shareData.permissionLevel,
        sharedWithEmail: shareData.email,
        sharedWithId: userToShare.id
      });

      loggingService.info('Trip shared', {
        tripId,
        ownerId,
        sharedWithEmail: shareData.email,
        sharedWithId: userToShare.id,
        permissionLevel: shareData.permissionLevel
      });

      // Return updated trip
      return this.getTripById(tripId, ownerId);
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'share_trip',
        tripId,
        ownerId,
        shareData,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Remove sharing access to a trip
   */
  async unshareTripWith(tripId: string, ownerId: string, userIdToRemove: string): Promise<boolean> {
    try {
      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { 
          id: tripId, 
          userId: ownerId 
        }
      });

      if (!trip) {
        loggingService.logPermissionDenied(`trip:${tripId}:unshare`, ownerId);
        return false;
      }

      await prisma.sharedTrip.delete({
        where: {
          tripId_userId: {
            tripId: tripId,
            userId: userIdToRemove
          }
        }
      });

      // Invalidate caches
      await this.invalidateTripCaches(tripId);
      await this.invalidateUserTripsCache(ownerId);
      await this.invalidateUserTripsCache(userIdToRemove);

      loggingService.info('Trip unshared', {
        tripId,
        ownerId,
        removedUserId: userIdToRemove
      });

      return true;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'unshare_trip',
        tripId,
        ownerId,
        userIdToRemove,
        component: 'trips-service'
      });
      throw error;
    }
  }

  /**
   * Get trip statistics for a user
   */
  async getUserTripStats(userId: string): Promise<{
    totalTrips: number;
    tripsAsOwner: number;
    tripsAsCollaborator: number;
    totalExpenses: number;
    averageBudget: number;
    upcomingTrips: number;
    completedTrips: number;
  }> {
    try {
      const [
        ownedTrips,
        sharedTrips,
        expenses,
        upcomingTrips,
        completedTrips
      ] = await Promise.all([
        prisma.trip.count({ where: { userId } }),
        prisma.sharedTrip.count({ where: { userId } }),
        prisma.expense.count({
          where: {
            trip: {
              OR: [
                { userId },
                { sharedWith: { some: { userId } } }
              ]
            }
          }
        }),
        prisma.trip.count({
          where: {
            OR: [
              { userId },
              { sharedWith: { some: { userId } } }
            ],
            startDate: { gt: new Date() }
          }
        }),
        prisma.trip.count({
          where: {
            OR: [
              { userId },
              { sharedWith: { some: { userId } } }
            ],
            endDate: { lt: new Date() }
          }
        })
      ]);

      // Calculate average budget
      const budgetData = await prisma.trip.aggregate({
        where: {
          OR: [
            { userId },
            { sharedWith: { some: { userId } } }
          ],
          budget: { not: null }
        },
        _avg: { budget: true }
      });

      const stats = {
        totalTrips: ownedTrips + sharedTrips,
        tripsAsOwner: ownedTrips,
        tripsAsCollaborator: sharedTrips,
        totalExpenses: expenses,
        averageBudget: budgetData._avg.budget || 0,
        upcomingTrips,
        completedTrips
      };

      loggingService.info('User trip stats retrieved', { userId, stats });

      return stats;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_user_trip_stats',
        userId,
        component: 'trips-service'
      });
      throw error;
    }
  }

  // Permission checking methods

  async hasReadPermission(tripId: string, userId: string): Promise<boolean> {
    try {
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          OR: [
            { userId: userId },
            { sharedWith: { some: { userId: userId } } }
          ]
        },
        select: { id: true }
      });

      return !!trip;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'check_read_permission',
        tripId,
        userId,
        component: 'trips-service'
      });
      return false;
    }
  }

  async hasEditPermission(tripId: string, userId: string): Promise<boolean> {
    try {
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          OR: [
            { userId: userId }, // Owner
            { 
              sharedWith: { 
                some: { 
                  userId: userId,
                  permissionLevel: 'EDITOR'
                } 
              } 
            } // Editor
          ]
        },
        select: { id: true }
      });

      return !!trip;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'check_edit_permission',
        tripId,
        userId,
        component: 'trips-service'
      });
      return false;
    }
  }

  // Cache management methods

  private async invalidateUserTripsCache(userId: string): Promise<void> {
    const patterns = [
      `trips:user:${userId}`,
      `enhanced:user:${userId}:trips`,
      `user:${userId}:trips`
    ];

    await Promise.all(
      patterns.map(pattern => this.cache.invalidatePattern(pattern))
    );
  }

  private async invalidateTripCaches(tripId: string): Promise<void> {
    const patterns = [
      `trip:${tripId}:*`,
      `enhanced:trip:${tripId}:*`,
      `trips:*` // Invalidate all trip lists (less efficient but safer)
    ];

    await Promise.all(
      patterns.map(pattern => this.cache.invalidatePattern(pattern))
    );
  }

  // Utility methods

  private categorizeDestination(destination: string): string {
    const lower = destination.toLowerCase();
    
    if (lower.includes('beach') || lower.includes('coast') || lower.includes('island')) {
      return 'beach';
    } else if (lower.includes('mountain') || lower.includes('ski') || lower.includes('hiking')) {
      return 'mountain';
    } else if (lower.includes('city') || lower.includes('urban')) {
      return 'city';
    } else if (lower.includes('nature') || lower.includes('park') || lower.includes('wildlife')) {
      return 'nature';
    }
    
    return 'other';
  }
}

// Export singleton instance
export const tripsService = new TripsService();