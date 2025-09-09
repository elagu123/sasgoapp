import { useQuery } from '@tanstack/react-query';
import { getGearItem } from '../services/api';
import type { Gear } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { GEAR_QUERY_KEY } from '../queryKeys';

export const useGear = (gearId: string | undefined) => {
    const { user } = useAuth();

    return useQuery<Gear, Error>({
        queryKey: [GEAR_QUERY_KEY, gearId],
        queryFn: () => getGearItem(gearId!),
        enabled: !!gearId && !!user,
    });
};
