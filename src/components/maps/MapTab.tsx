import React, { useState, useMemo } from 'react';
import type { Trip, ItineraryBlock, StayCandidate } from '../../types.ts';
import { useSharedItinerary } from '../../hooks/useSharedItinerary.ts';
import { MOCK_STAY_CANDIDATES } from '../../constants.ts';
import MapView from './MapView.tsx';
import GoogleMapView from './GoogleMapView.tsx';
import LocationList from './LocationList.tsx';
import { googleMapsService } from '../../services/googleMapsService.ts';

interface MapTabProps {
    trip: Trip;
}

export interface MapLocation {
    id: string;
    name: string;
    type: 'accommodation' | 'activity' | 'other';
    coords: { lat: number; lng: number };
    startTime?: string;
}

const MapTab: React.FC<MapTabProps> = ({ trip }) => {
    const { itinerary } = useSharedItinerary(trip.id, trip.itinerary || []);
    const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
    const [useGoogleMaps, setUseGoogleMaps] = useState(googleMapsService.isApiKeyConfigured());

    const locations = useMemo((): MapLocation[] => {
        const allLocations: MapLocation[] = [];

        // 1. Add selected accommodation
        if (trip.selectedAccommodationId) {
            const accommodation = MOCK_STAY_CANDIDATES.find(s => s.place_id === trip.selectedAccommodationId);
            if (accommodation) {
                allLocations.push({
                    id: accommodation.place_id,
                    name: accommodation.name,
                    type: 'accommodation',
                    coords: accommodation.coords,
                });
            }
        }

        // 2. Add all itinerary blocks with coordinates
        itinerary.forEach(day => {
            day.blocks.forEach(block => {
                if (block.coords) {
                    allLocations.push({
                        id: block.id,
                        name: block.title,
                        type: 'activity',
                        coords: block.coords,
                        startTime: block.startTime,
                    });
                }
            });
        });
        
        // Remove duplicates by id
        const uniqueLocations = Array.from(new Map(allLocations.map(item => [item.id, item])).values());
        
        return uniqueLocations;

    }, [trip.selectedAccommodationId, itinerary]);

    const bounds = useMemo(() => {
        if (locations.length === 0) {
            // Default bounds for Bariloche
            return { minLat: -41.2, maxLat: -41.0, minLng: -71.5, maxLng: -71.2 };
        }
        
        const latitudes = locations.map(l => l.coords.lat);
        const longitudes = locations.map(l => l.coords.lng);

        return {
            minLat: Math.min(...latitudes),
            maxLat: Math.max(...latitudes),
            minLng: Math.min(...longitudes),
            maxLng: Math.max(...longitudes),
        };
    }, [locations]);

    return (
        <div className="space-y-4">
            {/* Map Type Toggle */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold">Mapa del Viaje</h2>
                    {googleMapsService.isApiKeyConfigured() && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setUseGoogleMaps(true)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    useGoogleMaps 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                Google Maps
                            </button>
                            <button
                                onClick={() => setUseGoogleMaps(false)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    !useGoogleMaps 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                Vista Simulada
                            </button>
                        </div>
                    )}
                </div>
                {!googleMapsService.isApiKeyConfigured() && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                        Configure REACT_APP_GOOGLE_MAPS_API_KEY para Google Maps
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-22rem)]">
                <div className="lg:col-span-2 h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    {useGoogleMaps ? (
                        <GoogleMapView 
                            locations={locations} 
                            bounds={bounds}
                            hoveredLocationId={hoveredLocationId} 
                            onHoverLocation={setHoveredLocationId} 
                        />
                    ) : (
                        <MapView 
                            locations={locations} 
                            bounds={bounds}
                            hoveredLocationId={hoveredLocationId} 
                            onHoverLocation={setHoveredLocationId} 
                        />
                    )}
                </div>
                <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto">
                    <LocationList 
                        locations={locations}
                        hoveredLocationId={hoveredLocationId}
                        onHoverLocation={setHoveredLocationId}
                    />
                </div>
            </div>
        </div>
    );
};

export default MapTab;