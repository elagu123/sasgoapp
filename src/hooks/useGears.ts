import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGearList, createGear as apiCreateGear } from '../services/api';
import type { Gear } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { GEAR_QUERY_KEY } from '../queryKeys';

export const useGears = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const queryKey = [GEAR_QUERY_KEY];

    const { data, isLoading, error } = useQuery<Gear[], Error>({
        queryKey,
        queryFn: getGearList,
        enabled: !!user,
    });

    const createGear = useMutation<Gear, Error, any>({
        mutationFn: apiCreateGear,
        onSuccess: (newGear) => {
            // Actualizar la lista de equipaje con el nuevo item
            queryClient.setQueryData<Gear[]>(queryKey, (oldData = []) => [newGear, ...oldData]);
        },
        // Opcional: onMutate para una actualización optimista
    });

    return {
        data,
        isLoading,
        error,
        createGear,
    };
};
