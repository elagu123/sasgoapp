/**
 * Enhanced Trip Service with Caching
 * Provides high-performance trip operations with Redis caching
 */

import prisma from '../lib/prisma';
import { getCacheService } from './cache.service';
import type { Trip, User, SharedTrip, PackingList, PackingListItem, Expense } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { findUserByEmail } from './user.service';

// Types for Frontend compatibility
type RoleFE = 'OWNER' | 'EDITOR' | 'VIEWER';

interface TripMemberFE {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: RoleFE;
}

interface TripFE extends Omit<Trip, 'userId' | 'startDate' | 'endDate'> {
    dates: {
        start: string;
        end: string;
    };
    members: TripMemberFE[];
    expenses: Expense[];
}

interface CreateTripData {
    title: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    budget?: number | null;
    travelers?: number;
    pace?: string;
    interests?: string;
}

interface UpdateTripData {
    title?: string;
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number | null;
    travelers?: number;
    pace?: string;
    interests?: string;
}

// Prisma include object for complete trip data
const tripWithIncludes = {
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

type PrismaTripWithRelations = Trip & {
    user: User;
    sharedWith: (SharedTrip & { user: User })[];
    packingList: (PackingList & { items: PackingListItem[] }) | null;
    expenses: Expense[];
};

export class EnhancedTripService {
    private cache = getCacheService();

    /**
     * Get all trips accessible by a user with caching
     */
    async findTripsByUserId(userId: string): Promise<TripFE[]> {
        // Try to get from cache first
        const cacheKey = `user:${userId}:trips`;
        let cachedTrips = await this.cache.getUserTrips(userId);

        if (cachedTrips) {
            console.log(`🎯 Cache hit for user trips: ${userId}`);
            return cachedTrips.map(trip => this.transformTripForFrontend(trip as PrismaTripWithRelations));
        }

        // Cache miss - fetch from database
        console.log(`💾 Cache miss for user trips: ${userId}`);
        
        const trips = await prisma.trip.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId } } }
                ]
            },
            ...tripWithIncludes,
            orderBy: { createdAt: Prisma.SortOrder.desc }
        });

        // Cache the results for 5 minutes
        if (trips.length > 0) {
            await this.cache.setUserTrips(userId, trips, 300);
        }

        return trips.map(trip => this.transformTripForFrontend(trip));
    }

    /**
     * Get a specific trip by ID with caching
     */
    async findTripById(tripId: string, userId: string): Promise<TripFE | null> {
        // Check permissions first (cached)
        const hasAccess = await this.checkUserPermissions(tripId, userId);
        if (!hasAccess) {
            return null;
        }

        // Try to get from cache
        const cacheKey = `trip:${tripId}:details`;
        let cachedTrip = await this.cache.getTripDetails(tripId);

        if (cachedTrip) {
            console.log(`🎯 Cache hit for trip details: ${tripId}`);
            // Need to fetch full relations for transformation
            const fullTrip = await prisma.trip.findUnique({
                where: { id: tripId },
                ...tripWithIncludes
            });
            
            if (fullTrip) {
                return this.transformTripForFrontend(fullTrip);
            }
        }

        // Cache miss - fetch from database
        console.log(`💾 Cache miss for trip details: ${tripId}`);
        
        const trip = await prisma.trip.findFirst({
            where: {
                id: tripId,
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId } } }
                ]
            },
            ...tripWithIncludes
        });

        if (!trip) {
            return null;
        }

        // Cache the trip details for 10 minutes
        await this.cache.setTripDetails(tripId, trip, 600);

        return this.transformTripForFrontend(trip);
    }

    /**
     * Create a new trip and invalidate relevant caches
     */
    async createTrip(data: CreateTripData, userId: string): Promise<TripFE> {
        const newTrip = await prisma.trip.create({
            data: {
                ...data,
                userId: userId
            },
            ...tripWithIncludes
        });

        // Invalidate user trips cache
        await this.cache.invalidateUserTrips(userId);

        return this.transformTripForFrontend(newTrip);
    }

    /**
     * Update a trip and invalidate relevant caches
     */
    async updateTrip(tripId: string, data: UpdateTripData, userId: string): Promise<TripFE | null> {
        // Check permissions
        const hasAccess = await this.checkUserPermissions(tripId, userId, 'EDITOR');
        if (!hasAccess) {
            return null;
        }

        const updatedTrip = await prisma.trip.update({
            where: { id: tripId },
            data: data,
            ...tripWithIncludes
        });

        // Invalidate caches
        await Promise.all([
            this.cache.invalidateTripCache(tripId),
            this.cache.invalidateUserTrips(userId),
            this.invalidateSharedUsersCache(tripId)
        ]);

        return this.transformTripForFrontend(updatedTrip);
    }

    /**
     * Delete a trip and invalidate relevant caches
     */
    async deleteTrip(tripId: string, userId: string): Promise<boolean> {
        // Check if user is owner
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, userId: userId }
        });

        if (!trip) {
            return false;
        }

        // Get shared users before deletion for cache invalidation
        const sharedUsers = await prisma.sharedTrip.findMany({
            where: { tripId },
            select: { userId: true }
        });

        await prisma.trip.delete({
            where: { id: tripId }
        });

        // Invalidate caches
        await Promise.all([
            this.cache.invalidateTripCache(tripId),
            this.cache.invalidateUserTrips(userId),
            ...sharedUsers.map(shared => this.cache.invalidateUserTrips(shared.userId))
        ]);

        return true;
    }

    /**
     * Share a trip with another user and invalidate relevant caches
     */
    async shareTrip(tripId: string, ownerId: string, email: string, permissionLevel: 'EDITOR' | 'VIEWER'): Promise<TripFE | null> {
        // Check if user is owner
        const trip = await prisma.trip.findFirst({
            where: { id: tripId, userId: ownerId }
        });

        if (!trip) {
            return null;
        }

        // Find user to share with
        const userToShare = await findUserByEmail(email);
        if (!userToShare) {
            return null;
        }

        // Create sharing relationship
        await prisma.sharedTrip.upsert({
            where: {
                tripId_userId: {
                    tripId: tripId,
                    userId: userToShare.id
                }
            },
            update: {
                permissionLevel: permissionLevel
            },
            create: {
                tripId: tripId,
                userId: userToShare.id,
                permissionLevel: permissionLevel
            }
        });

        // Invalidate caches
        await Promise.all([
            this.cache.invalidateTripCache(tripId),
            this.cache.invalidateUserTrips(ownerId),
            this.cache.invalidateUserTrips(userToShare.id),
            this.cache.invalidateUserPermissions(userToShare.id, tripId)
        ]);

        // Return updated trip
        return this.findTripById(tripId, ownerId);
    }

    /**
     * Get trip expenses with caching
     */
    async getTripExpenses(tripId: string, userId: string): Promise<Expense[] | null> {
        // Check permissions
        const hasAccess = await this.checkUserPermissions(tripId, userId);
        if (!hasAccess) {
            return null;
        }

        // Try cache first
        let expenses = await this.cache.getTripExpenses(tripId);
        if (expenses) {
            console.log(`🎯 Cache hit for trip expenses: ${tripId}`);
            return expenses;
        }

        // Cache miss
        console.log(`💾 Cache miss for trip expenses: ${tripId}`);
        expenses = await prisma.expense.findMany({
            where: { tripId },
            orderBy: { date: Prisma.SortOrder.desc }
        });

        // Cache for 5 minutes
        await this.cache.setTripExpenses(tripId, expenses, 300);

        return expenses;
    }

    /**
     * Add expense to trip and invalidate caches
     */
    async addTripExpense(tripId: string, userId: string, expenseData: Omit<Expense, 'id' | 'tripId' | 'createdAt'>): Promise<Expense | null> {
        // Check permissions
        const hasAccess = await this.checkUserPermissions(tripId, userId, 'EDITOR');
        if (!hasAccess) {
            return null;
        }

        const expense = await prisma.expense.create({
            data: {
                ...expenseData,
                tripId: tripId
            }
        });

        // Invalidate expense cache
        await this.cache.del(`trip:${tripId}:expenses`);

        return expense;
    }

    /**
     * Check user permissions for a trip (cached)
     */
    private async checkUserPermissions(tripId: string, userId: string, requiredLevel?: 'EDITOR' | 'VIEWER'): Promise<boolean> {
        // Try cache first
        const cachedPermission = await this.cache.getUserPermissions(userId, tripId);
        
        let permission: string | null = cachedPermission;
        
        if (!permission) {
            console.log(`💾 Cache miss for permissions: ${userId}:${tripId}`);
            
            // Check if user is owner
            const ownedTrip = await prisma.trip.findFirst({
                where: { id: tripId, userId: userId }
            });

            if (ownedTrip) {
                permission = 'OWNER';
            } else {
                // Check shared access
                const sharedAccess = await prisma.sharedTrip.findFirst({
                    where: { tripId, userId }
                });
                permission = sharedAccess?.permissionLevel || null;
            }

            // Cache permission for 10 minutes
            if (permission) {
                await this.cache.setUserPermissions(userId, tripId, permission, 600);
            }
        } else {
            console.log(`🎯 Cache hit for permissions: ${userId}:${tripId}`);
        }

        if (!permission) {
            return false;
        }

        // Check required permission level
        if (requiredLevel === 'EDITOR') {
            return permission === 'OWNER' || permission === 'EDITOR';
        }

        return true; // VIEWER or higher
    }

    /**
     * Transform Prisma trip to Frontend format
     */
    private transformTripForFrontend(trip: PrismaTripWithRelations): TripFE {
        const owner: TripMemberFE = {
            id: trip.user.id,
            name: trip.user.name,
            email: trip.user.email,
            avatarUrl: '', // Add avatar logic if needed
            role: 'OWNER'
        };

        const sharedMembers: TripMemberFE[] = trip.sharedWith.map(shared => ({
            id: shared.user.id,
            name: shared.user.name,
            email: shared.user.email,
            avatarUrl: '', // Add avatar logic if needed
            role: shared.permissionLevel as RoleFE
        }));

        const { user, sharedWith, userId, startDate, endDate, ...rest } = trip;

        return {
            ...rest,
            destination: trip.destination,
            dates: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            members: [owner, ...sharedMembers],
            expenses: trip.expenses || []
        };
    }

    /**
     * Invalidate caches for all users who have access to a trip
     */
    private async invalidateSharedUsersCache(tripId: string): Promise<void> {
        const sharedUsers = await prisma.sharedTrip.findMany({
            where: { tripId },
            select: { userId: true }
        });

        await Promise.all(
            sharedUsers.map(shared => this.cache.invalidateUserTrips(shared.userId))
        );
    }

    /**
     * Get cache statistics for monitoring
     */
    async getCacheStats(): Promise<{
        isHealthy: boolean;
        hitRate?: number;
        memoryUsage?: string;
    }> {
        const healthCheck = await this.cache.healthCheck();
        
        return {
            isHealthy: healthCheck.status === 'healthy',
            hitRate: 0, // Would need to implement hit/miss tracking
            memoryUsage: 'N/A' // Would need Redis INFO command
        };
    }
}

// Export singleton instance
export const enhancedTripService = new EnhancedTripService();