import { get, set } from '../lib/db.ts';
import type { PackingList } from '../types';

const CACHE_PREFIX = 'packing-list-';

export async function getFromCache(packingId: string): Promise<PackingList | null> {
    try {
        const data = await get<PackingList>(`${CACHE_PREFIX}${packingId}`);
        return data || null;
    } catch (error) {
        console.error("Failed to read packing list from cache", error);
        return null;
    }
}

export async function setInCache(packingId: string, list: PackingList): Promise<void> {
    try {
        await set(`${CACHE_PREFIX}${packingId}`, list);
    } catch (error) {
        console.error("Failed to write packing list to cache", error);
    }
}