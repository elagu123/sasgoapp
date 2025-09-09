import { get, set } from './db.ts';

const QUEUE_KEY = 'patch-queue';

export interface Patch {
    opId: string;
    entityId: string; // Generic ID for tripId, packingId, etc.
    op: string;
    payload: any;
    timestamp?: number;
}

export async function enqueuePatch(patch: Omit<Patch, 'timestamp'>): Promise<void> {
    try {
        const queue = await get<Patch[]>(QUEUE_KEY) || [];
        const newPatch: Patch = { ...patch, timestamp: Date.now() };
        queue.push(newPatch);
        await set(QUEUE_KEY, queue);
        console.log('Patch enqueued:', newPatch);
        // In a real app, you would register for a background sync event here.
        // For example, using navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-patches'));
    } catch (error) {
        console.error("Failed to enqueue patch:", error);
    }
}

export async function getPatchQueue(): Promise<Patch[]> {
    return await get<Patch[]>(QUEUE_KEY) || [];
}

export async function clearPatchQueue(): Promise<void> {
    await set(QUEUE_KEY, []);
}
