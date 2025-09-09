import { getDocumentsForTripDB, addDocumentDB, deleteDocumentDB } from '../lib/db';
import type { TripDocument } from '../types';

export const getDocumentsForTrip = async (tripId: string): Promise<TripDocument[]> => {
    try {
        return await getDocumentsForTripDB(tripId);
    } catch (error) {
        console.error("Failed to read documents from cache", error);
        return [];
    }
}

export const addDocument = async (document: TripDocument): Promise<void> => {
    try {
        await addDocumentDB(document);
    } catch (error) {
        console.error("Failed to write document to cache", error);
        throw error; // Re-throw to be caught by mutation
    }
}

export const deleteDocument = async (documentId: string): Promise<void> => {
    try {
        await deleteDocumentDB(documentId);
    } catch (error) {
        console.error("Failed to delete document from cache", error);
        throw error; // Re-throw to be caught by mutation
    }
}
