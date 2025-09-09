import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTrip } from '../services/api.ts';
import { useEffect, useCallback } from 'react';
import type { Trip } from '../types.ts';
import { TRIPS_QUERY_KEY } from '../queryKeys.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

// Helper functions for computed properties
const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    // Add timezone info to avoid DST issues
    const startDate = new Date(start + "T00:00:00-03:00");
    const endDate = new Date(end + "T00:00:00-03:00");
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const calculateDaysUntil = (start: string): number => {
    if (!start) return 0;
    const startDate = new Date(start + "T00:00:00-03:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = startDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const useTrip = (tripId: string | undefined) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Prefetch related data (as per enterprise spec)
    useEffect(() => {
        if (tripId) {
            // In a real app with separate endpoints, these would be API calls
            queryClient.prefetchQuery({
                queryKey: [TRIPS_QUERY_KEY, tripId, 'itinerary-details'],
                queryFn: () => Promise.resolve({}), // Mock: tripApi.getTripItinerary(tripId)
            });
            queryClient.prefetchQuery({
                queryKey: [TRIPS_QUERY_KEY, tripId, 'members'],
                queryFn: () => Promise.resolve({}), // Mock: tripApi.getTripMembers(tripId)
            });
        }
    }, [tripId, queryClient]);


    return useQuery({
        queryKey: [TRIPS_QUERY_KEY, tripId],
        queryFn: () => getTrip(tripId!),
        enabled: !!tripId && !!user,
        staleTime: 5 * 60 * 1000, // 5 min staleTime for user-specific data
        select: useCallback(
            (data: Trip) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = new Date(data.dates.start + "T00:00:00-03:00");
                const endDate = new Date(data.dates.end + "T00:00:00-03:00");

                return {
                    ...data,
                    // Computed properties
                    durationDays: calculateDuration(data.dates.start, data.dates.end),
                    daysUntil: calculateDaysUntil(data.dates.start),
                    isUpcoming: startDate > today,
                    isOngoing: today >= startDate && today <= endDate,
                }
            },
            []
        ),
    });
};
