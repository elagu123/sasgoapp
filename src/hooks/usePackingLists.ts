import { useQuery } from '@tanstack/react-query';
import { getPackingLists } from '../services/api';
import type { PackingList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PACKING_LISTS_QUERY_KEY } from '../queryKeys';

export const usePackingLists = () => {
    const { user } = useAuth();

    return useQuery<PackingList[], Error>({
        queryKey: [PACKING_LISTS_QUERY_KEY],
        queryFn: getPackingLists,
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
