import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPackingList, patchPackingList } from '../services/api';
import type { PackingList, PackingListItem, PatchOp } from '../types';
import { useOnlineStatus } from './useOnlineStatus';
import { enqueuePatch } from '../lib/patch-queue';
import { useToast } from './useToast';
import { v4 as uuidv4 } from 'uuid';
import { PACKING_LISTS_QUERY_KEY } from '../queryKeys';

export const usePackingList = (packingId: string | undefined) => {
    const queryClient = useQueryClient();
    const isOnline = useOnlineStatus();
    const { addToast } = useToast();
    const queryKey = [PACKING_LISTS_QUERY_KEY, packingId];

    const { data: list, isLoading, error } = useQuery<PackingList, Error>({
        queryKey,
        queryFn: () => getPackingList(packingId!),
        enabled: !!packingId,
    });
    
    const usePackingMutation = <TVariables>(
        op: PatchOp,
        optimisticUpdate: (variables: TVariables, context: PackingList | undefined) => PackingList | undefined
    ) => {
        return useMutation<PackingList, Error, TVariables, { previousList: PackingList | undefined }>({
            mutationFn: (variables) => {
                const payload = { ...variables, listId: packingId };
                if (!isOnline) {
                    enqueuePatch({ opId: uuidv4(), entityId: packingId!, op, payload });
                    // No need to throw, optimistic update will proceed.
                    return Promise.resolve(optimisticUpdate(variables, list) as PackingList);
                }
                return patchPackingList(packingId!, op, variables as any);
            },
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey });
                const previousList = queryClient.getQueryData<PackingList>(queryKey);
                queryClient.setQueryData<PackingList>(queryKey, old => optimisticUpdate(variables, old));
                return { previousList };
            },
            onSuccess: (data) => {
                // If online, update cache with server response
                if (isOnline) {
                    queryClient.setQueryData(queryKey, data);
                }
            },
            onError: (err, variables, context) => {
                if (context?.previousList) {
                    queryClient.setQueryData(queryKey, context.previousList);
                }
                addToast('No se pudo guardar el cambio.', 'error');
            },
            onSettled: () => {
                if (isOnline) {
                    queryClient.invalidateQueries({ queryKey });
                }
            },
        });
    };

    const addItem = usePackingMutation<{ item: Omit<PackingListItem, 'id'> }>('add_item', (vars, old) => {
        if (!old) return undefined;
        const newItem = { ...vars.item, id: uuidv4(), packed: false, order: old.items.length };
        return { ...old, items: [...old.items, newItem] };
    });

    const updateItem = usePackingMutation<{ itemId: string, fields: Partial<PackingListItem> }>('update_item', (vars, old) => {
        if (!old) return undefined;
        return { ...old, items: old.items.map(i => i.id === vars.itemId ? { ...i, ...vars.fields } : i) };
    });

    const removeItem = usePackingMutation<{ itemId: string }>('remove_item', (vars, old) => {
        if (!old) return undefined;
        return { ...old, items: old.items.filter(i => i.id !== vars.itemId) };
    });

    const reorderItems = usePackingMutation<{ itemIds: string[] }>('reorder_items', (vars, old) => {
        if (!old) return undefined;
        const reorderedItems = vars.itemIds.map((id, index) => {
            const item = old.items.find(i => i.id === id)!;
            return { ...item, order: index };
        });
        return { ...old, items: reorderedItems };
    });

    return { list, isLoading, error, addItem, updateItem, removeItem, reorderItems };
};
