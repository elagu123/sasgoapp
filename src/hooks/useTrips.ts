import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrips, createTrip as apiCreateTrip, updateTrip as apiUpdateTrip, deleteTrip as apiDeleteTrip } from '../services/api.ts';
import type { Trip } from '../types.ts';
import { useOnlineStatus } from './useOnlineStatus.ts';
import { enqueuePatch } from '../lib/patch-queue.ts';
import { useToast } from './useToast.ts';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext.tsx';
import { TRIPS_QUERY_KEY } from '../queryKeys.ts';

export const useTrips = () => {
    const queryClient = useQueryClient();
    const isOnline = useOnlineStatus();
    const { addToast } = useToast();
    const { user } = useAuth();

    // Fetch all trips
    const { data, isLoading, error, refetch } = useQuery<Trip[], Error>({
        queryKey: [TRIPS_QUERY_KEY],
        queryFn: getTrips,
        enabled: !!user,
    });
    
    // --- MUTATIONS ---

    const createTrip = useMutation<Trip, Error, Partial<Trip>, { previousTrips: Trip[]; optimisticTrip: Trip; }>({
        mutationFn: apiCreateTrip,
        onMutate: async (newTripData) => {
            await queryClient.cancelQueries({ queryKey: [TRIPS_QUERY_KEY] });
            const previousTrips = queryClient.getQueryData<Trip[]>([TRIPS_QUERY_KEY]) || [];
            
            const optimisticTrip: Trip = {
                id: `temp-${uuidv4()}`, // Make temp ID more distinct
                userId: user!.id,
                title: newTripData.title || '',
                destination: newTripData.destination || [],
                dates: newTripData.dates || { start: '', end: '' },
                travelers: 1,
                pace: 'moderate',
                budget: newTripData.budget || 1000,
                interests: [],
                createdAt: new Date().toISOString(),
                members: [{
                    id: user!.id,
                    name: user!.name,
                    email: user!.email,
                    avatarUrl: `https://i.pravatar.cc/150?u=${user!.email}`,
                    role: 'OWNER'
                }],
                privacy: 'private',
                version: 1,
                ...newTripData, // Apply provided data
            };

            queryClient.setQueryData<Trip[]>([TRIPS_QUERY_KEY], [optimisticTrip, ...previousTrips]);
            addToast('Creando nuevo viaje...', 'info');

            return { previousTrips, optimisticTrip };
        },
        onSuccess: (result, _variables, context) => {
             queryClient.setQueryData<Trip[]>(
                [TRIPS_QUERY_KEY],
                (old) => old?.map(t => t.id === context?.optimisticTrip.id ? result : t) ?? []
            );
            addToast('¡Nuevo viaje creado!', 'success');
        },
        onError: (_err, _newTrip, context) => {
            // For creation, always rollback because we don't have a real ID for offline patches.
            addToast('Error al crear el viaje. Intenta de nuevo.', 'error');
            if (context?.previousTrips) {
                queryClient.setQueryData([TRIPS_QUERY_KEY], context.previousTrips);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY] });
        }
    });

    const updateTrip = useMutation<Trip, Error, Partial<Trip> & { id: string; version?: number }, { previousTrips: Trip[] | undefined }>({
        mutationFn: (trip) => apiUpdateTrip(trip.id, trip),
        onMutate: async (updatedTrip) => {
            await queryClient.cancelQueries({ queryKey: [TRIPS_QUERY_KEY] });
            const previousTrips = queryClient.getQueryData<Trip[]>([TRIPS_QUERY_KEY]);
            
            queryClient.setQueryData<Trip[]>(
                [TRIPS_QUERY_KEY],
                old => old?.map(t => t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t) ?? []
            );
            
            // Also update single trip query if it exists
            queryClient.setQueryData<Trip>(
                [TRIPS_QUERY_KEY, updatedTrip.id],
                old => old ? { ...old, ...updatedTrip } : undefined
            );

            return { previousTrips };
        },
        onSuccess: () => {
             addToast('Viaje actualizado!', 'success');
        },
        onError: (err: any, updatedTrip, context) => {
            if (!isOnline) {
                enqueuePatch({ opId: uuidv4(), entityId: updatedTrip.id, op: 'update_trip', payload: { tripId: updatedTrip.id, fields: updatedTrip } });
                addToast('Cambios guardados. Se sincronizarán al reconectar.', 'info');
            } else {
                addToast(err.body?.message || 'Error al actualizar.', 'error');
                if (context?.previousTrips) {
                    queryClient.setQueryData([TRIPS_QUERY_KEY], context.previousTrips);
                }
                // Re-throw to allow component-level error handling (e.g., for conflicts)
                throw err;
            }
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY, data?.id] });
            queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY] });
        }
    });

    const deleteTrip = useMutation<void, Error, string, { previousTrips: Trip[] | undefined }>({
        mutationFn: apiDeleteTrip,
        onMutate: async (tripId) => {
            await queryClient.cancelQueries({ queryKey: [TRIPS_QUERY_KEY] });
            const previousTrips = queryClient.getQueryData<Trip[]>([TRIPS_QUERY_KEY]);

            queryClient.setQueryData<Trip[]>(
                [TRIPS_QUERY_KEY],
                old => old?.filter(t => t.id !== tripId) ?? []
            );
             addToast('Eliminando viaje...', 'info');

            return { previousTrips };
        },
        onSuccess: () => {
             addToast('Viaje eliminado.', 'success');
        },
        onError: (_err, tripId, context) => {
            if (!isOnline) {
                enqueuePatch({ opId: uuidv4(), entityId: tripId, op: 'remove_trip', payload: { tripId } });
                addToast('Viaje eliminado. Se sincronizará al reconectar.', 'info');
            } else {
                addToast('Error al eliminar.', 'error');
                if (context?.previousTrips) {
                    queryClient.setQueryData([TRIPS_QUERY_KEY], context.previousTrips);
                }
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [TRIPS_QUERY_KEY] });
        }
    });


    return {
        data,
        isLoading,
        error,
        refetch,
        createTrip,
        updateTrip,
        deleteTrip
    };
};
