import { useQuery } from '@tanstack/react-query';
import { getCommunityRecommendations } from '../services/geminiService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTrips } from './useTrips.ts';
import { RECOMMENDATIONS_QUERY_KEY } from '../queryKeys.ts';

export const useRecommendations = () => {
    const { user } = useAuth();
    const { data: trips = [] } = useTrips(); // We need the user's trips for context

    // Only enable the query if we have a user and their trips
    const isEnabled = !!user && trips.length > 0;

    return useQuery({
        queryKey: [RECOMMENDATIONS_QUERY_KEY, user?.id],
        queryFn: () => getCommunityRecommendations(user!, trips),
        enabled: isEnabled,
        staleTime: 1000 * 60 * 15, // Cache for 15 minutes
        refetchOnWindowFocus: false, // Don't refetch just because window got focus
    });
};
