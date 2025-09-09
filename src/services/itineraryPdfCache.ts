import { getPdf, setPdf } from '../lib/db.ts';

const CACHE_PREFIX = 'itinerary-pdf-';

export async function savePdfToCache(itineraryId: string, blob: Blob, filename: string): Promise<void> {
    try {
        await setPdf(`${CACHE_PREFIX}${itineraryId}`, blob, filename);
    } catch (error) {
        console.error("Failed to save itinerary PDF to cache", error);
    }
}

export async function getPdfFromCache(itineraryId: string): Promise<{ blob: Blob, filename: string } | null> {
    try {
        const data = await getPdf(`${CACHE_PREFIX}${itineraryId}`);
        return data || null;
    } catch (error) {
        console.error("Failed to get itinerary PDF from cache", error);
        return null;
    }
}