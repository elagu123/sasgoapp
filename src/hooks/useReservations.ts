import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReservations, createReservation as apiCreateReservation, deleteReservation as apiDeleteReservation } from '../services/api';
import type { Reservation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { RESERVATIONS_QUERY_KEY } from '../queryKeys';

export const useReservations = (tripId: string) => {
    const queryClient = useQueryClient();
    const queryKey = [RESERVATIONS_QUERY_KEY, tripId];

    const { data: reservations, isLoading, error } = useQuery<Reservation[], Error>({
        queryKey,
        queryFn: () => getReservations(tripId),
        enabled: !!tripId,
    });

    const createReservation = useMutation<Reservation, Error, Omit<Reservation, 'id'>, { previousReservations: Reservation[] }>({
        mutationFn: apiCreateReservation,
        onMutate: async (newReservation) => {
            await queryClient.cancelQueries({ queryKey });
            const previousReservations = queryClient.getQueryData<Reservation[]>(queryKey) || [];
            
            const optimisticReservation: Reservation = { ...newReservation, id: uuidv4() };

            queryClient.setQueryData<Reservation[]>(queryKey, [...previousReservations, optimisticReservation]);
            
            return { previousReservations };
        },
        onError: (_err, _newRes, context) => {
            if (context?.previousReservations) {
                queryClient.setQueryData(queryKey, context.previousReservations);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteReservation = useMutation<void, Error, string, { previousReservations: Reservation[] }>({
        mutationFn: apiDeleteReservation,
         onMutate: async (reservationId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousReservations = queryClient.getQueryData<Reservation[]>(queryKey) || [];

            queryClient.setQueryData<Reservation[]>(
                queryKey,
                old => old?.filter(e => e.id !== reservationId) ?? []
            );
            
            return { previousReservations };
        },
        onError: (_err, _resId, context) => {
             if (context?.previousReservations) {
                queryClient.setQueryData(queryKey, context.previousReservations);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
    
    return { reservations, isLoading, error, createReservation, deleteReservation };
};
