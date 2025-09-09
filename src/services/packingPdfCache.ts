import { getPdf, setPdf } from '../lib/db.ts';

const CACHE_PREFIX = 'packing-pdf-';

export async function savePdfToCache(packingId: string, blob: Blob): Promise<void> {
    try {
        const filename = `packing-list-${packingId}-${new Date().toISOString().split('T')[0]}.pdf`;
        await setPdf(`${CACHE_PREFIX}${packingId}`, blob, filename);
    } catch (error) {
        console.error("Failed to save packing PDF to cache", error);
    }
}

export async function getPdfFromCache(packingId: string): Promise<{ blob: Blob, filename: string } | null> {
    try {
        const data = await getPdf(`${CACHE_PREFIX}${packingId}`);
        return data || null;
    } catch (error) {
        console.error("Failed to get packing PDF from cache", error);
        return null;
    }
}