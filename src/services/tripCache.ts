
import { get, set } from '../lib/db.ts';
import type { Trip } from '../types';

const TRIPS_LIST_KEY = 'trips-list';
const TRIP_DETAIL_PREFIX = 'trip-detail-';

export async function getTripsFromCache(): Promise<Trip[] | null> {
    try {
        const data = await get<Trip[]>(TRIPS_LIST_KEY);
        return data || null;
    } catch (error) {
        console.error("Failed to read trips from cache", error);
        return null;
    }
}

export async function setTripsInCache(trips: Trip[]): Promise<void> {
    try {
        await set(TRIPS_LIST_KEY, trips);
        // Also cache individual trips for faster detail view access
        for (const trip of trips) {
            await setTripInCache(trip);
        }
    } catch (error) {
        console.error("Failed to write trips to cache", error);
    }
}

export async function getTripFromCache(tripId: string): Promise<Trip | null> {
    try {
        const data = await get<Trip>(`${TRIP_DETAIL_PREFIX}${tripId}`);
        return data || null;
    } catch (error) {
        console.error(`Failed to read trip ${tripId} from cache`, error);
        return null;
    }
}

export async function setTripInCache(trip: Trip): Promise<void> {
    try {
        await set(`${TRIP_DETAIL_PREFIX}${trip.id}`, trip);
    } catch (error) {
        console.error(`Failed to write trip ${trip.id} to cache`, error);
    }
}
