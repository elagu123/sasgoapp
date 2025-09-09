import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useToast } from './useToast';
import { useQueryClient } from '@tanstack/react-query';
import { getPatchQueue, clearPatchQueue } from '../lib/patch-queue';
import * as api from '../services/api';

// Un mapa para asociar operaciones de parche con sus funciones de API correspondientes
const patchHandlers: { [key: string]: (payload: any) => Promise<any> } = {
    // Trip operations
    'update_trip': (payload) => api.updateTrip(payload.tripId, payload.fields),
    'remove_trip': (payload) => api.deleteTrip(payload.tripId),
    // Packing list operations
    'add_item': (payload) => api.patchPackingList(payload.listId, 'add_item', payload),
    'update_item': (payload) => api.patchPackingList(payload.listId, 'update_item', payload),
    'remove_item': (payload) => api.patchPackingList(payload.listId, 'remove_item', payload),
    'reorder_items': (payload) => api.patchPackingList(payload.listId, 'reorder_items', payload),
};

let isSyncing = false;

export const useSyncQueue = () => {
    const isOnline = useOnlineStatus();
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        const syncQueue = async () => {
            if (isSyncing) {
                console.log('Sync already in progress.');
                return;
            }

            const queue = await getPatchQueue();
            if (queue.length === 0) {
                return;
            }

            isSyncing = true;
            addToast(`Conexión recuperada. Sincronizando ${queue.length} cambio(s)...`, 'info');

            try {
                for (const patch of queue) {
                    const handler = patchHandlers[patch.op];
                    if (handler) {
                        try {
                            // FIX: The entityId is directly on the patch object.
                            const entityId = patch.entityId;
                            console.log(`[Sync] Processing patch: ${patch.op} for entity ${entityId}`);
                            await handler(patch.payload);
                        } catch (error) {
                            console.error(`[Sync] Failed to process patch ${patch.opId}:`, error);
                            // En una app real, podríamos implementar reintentos o marcar el parche como fallido.
                        }
                    }
                }

                await clearPatchQueue();
                addToast('¡Sincronización completada!', 'success');

                // Invalidar todas las queries para asegurar que la UI tenga los datos más frescos del servidor.
                await queryClient.invalidateQueries();

            } catch (error) {
                console.error('[Sync] An error occurred during queue processing:', error);
                addToast('Ocurrió un error durante la sincronización.', 'error');
            } finally {
                isSyncing = false;
            }
        };

        if (isOnline) {
            syncQueue();
        }

    }, [isOnline, addToast, queryClient]);
};