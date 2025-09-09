import { openDB, type IDBPDatabase } from 'idb';
import type { TripDocument } from '../types';

const DB_NAME = 'SASGoDB';
const DB_VERSION = 2; // Increment version for schema change

interface SASGoDBSchema {
  'keyval': {
    key: string;
    value: any;
  };
  'pdfs': {
    key: string;
    value: { blob: Blob, filename: string };
  };
  'documents': {
    key: string; // id
    value: TripDocument;
    indexes: { 'by-tripId': string };
  };
}

let dbPromise: Promise<IDBPDatabase<SASGoDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<SASGoDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<SASGoDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('keyval')) {
              db.createObjectStore('keyval');
            }
            if (!db.objectStoreNames.contains('pdfs')) {
              db.createObjectStore('pdfs');
            }
        }
        if (oldVersion < 2) {
            const docStore = db.createObjectStore('documents', { keyPath: 'id' });
            docStore.createIndex('by-tripId', 'tripId');
        }
      },
    });
  }
  return dbPromise;
}

export async function get<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get('keyval', key);
}

export async function set(key: string, value: any): Promise<void> {
  const db = await getDb();
  await db.put('keyval', value, key);
}

export async function del(key: string): Promise<void> {
  const db = await getDb();
  await db.delete('keyval', key);
}

export async function getPdf(key: string): Promise<{ blob: Blob, filename: string } | undefined> {
    const db = await getDb();
    return db.get('pdfs', key);
}

export async function setPdf(key: string, blob: Blob, filename: string): Promise<void> {
    const db = await getDb();
    await db.put('pdfs', { blob, filename }, key);
}

export async function delPdf(key: string): Promise<void> {
    const db = await getDb();
    await db.delete('pdfs', key);
}

// --- Document Store Functions ---

export const getDocumentsForTripDB = async (tripId: string): Promise<TripDocument[]> => {
    const db = await getDb();
    return db.getAllFromIndex('documents', 'by-tripId', tripId);
};

export const addDocumentDB = async (document: TripDocument): Promise<void> => {
    const db = await getDb();
    await db.put('documents', document);
};

export const deleteDocumentDB = async (documentId: string): Promise<void> => {
    const db = await getDb();
    await db.delete('documents', documentId);
};