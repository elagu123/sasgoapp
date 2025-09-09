import React, { useEffect, useRef, useState } from 'react';
import type { MapLocation } from './MapTab.tsx';
import { googleMapsService } from '../../services/googleMapsService.ts';
import { useToast } from '../../hooks/useToast.ts';

interface GoogleMapViewProps {
    locations: MapLocation[];
    bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
    hoveredLocationId: string | null;
    onHoverLocation: (id: string | null) => void;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ 
    locations, 
    bounds, 
    hoveredLocationId, 
    onHoverLocation 
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const { addToast } = useToast();

    // Initialize map
    useEffect(() => {
        const initializeMap = async () => {
            if (!mapRef.current) return;

            try {
                // Check if API key is configured
                if (!googleMapsService.isApiKeyConfigured()) {
                    setApiError('Google Maps API key no configurado');
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const maps = await googleMapsService.loadGoogleMaps();

                // Calculate center from bounds
                const center = {
                    lat: (bounds.minLat + bounds.maxLat) / 2,
                    lng: (bounds.minLng + bounds.maxLng) / 2
                };

                const mapInstance = new maps.Map(mapRef.current, {
                    zoom: 12,
                    center,
                    mapTypeId: 'roadmap',
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    fullscreenControl: true
                });

                setMap(mapInstance);
                setIsLoading(false);
            } catch (error) {
                console.error('Error initializing Google Maps:', error);
                setApiError('Error al cargar Google Maps');
                setIsLoading(false);
                addToast('Error al cargar Google Maps', 'error');
            }
        };

        initializeMap();
    }, [bounds, addToast]);

    // Update markers when locations change
    useEffect(() => {
        if (!map || !window.google) return;

        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));

        // Create new markers
        const newMarkers: google.maps.Marker[] = [];
        
        locations.forEach(location => {
            const marker = new google.maps.Marker({
                position: { lat: location.coords.lat, lng: location.coords.lng },
                map,
                title: location.name,
                icon: {
                    url: getMarkerIcon(location.type),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 32)
                }
            });

            // Info window
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="p-2">
                        <h3 class="font-semibold text-sm">${location.name}</h3>
                        <p class="text-xs text-gray-600 capitalize">${location.type}</p>
                        ${location.startTime ? `<p class="text-xs text-blue-600">${location.startTime}</p>` : ''}
                    </div>
                `
            });

            // Event listeners
            marker.addListener('mouseover', () => {
                onHoverLocation(location.id);
                infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', () => {
                onHoverLocation(null);
                infoWindow.close();
            });

            marker.addListener('click', () => {
                map.panTo(marker.getPosition()!);
                map.setZoom(15);
            });

            newMarkers.push(marker);
        });

        setMarkers(newMarkers);

        // Fit bounds to show all markers
        if (locations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            locations.forEach(location => {
                bounds.extend(new google.maps.LatLng(location.coords.lat, location.coords.lng));
            });
            map.fitBounds(bounds);
            
            // Ensure minimum zoom level
            google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                if (map.getZoom()! > 15) {
                    map.setZoom(15);
                }
            });
        }

        return () => {
            newMarkers.forEach(marker => marker.setMap(null));
        };
    }, [map, locations, onHoverLocation]);

    // Handle hovered location highlighting
    useEffect(() => {
        if (!hoveredLocationId || !map) return;

        const marker = markers.find((_, index) => 
            locations[index]?.id === hoveredLocationId
        );

        if (marker) {
            // Highlight the marker by bouncing it briefly
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 1000);
        }
    }, [hoveredLocationId, markers, locations, map]);

    const getMarkerIcon = (type: MapLocation['type']): string => {
        const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
        switch (type) {
            case 'accommodation':
                return `${baseUrl}red-dot.png`;
            case 'activity':
                return `${baseUrl}blue-dot.png`;
            default:
                return `${baseUrl}grey-dot.png`;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cargando mapa...</p>
                </div>
            </div>
        );
    }

    if (apiError) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                <div className="text-center p-4">
                    <div className="text-red-500 text-2xl mb-2">⚠️</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{apiError}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        Se requiere configurar REACT_APP_GOOGLE_MAPS_API_KEY
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
            
            {locations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No hay ubicaciones para mostrar
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Agrega actividades al itinerario para verlas en el mapa
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleMapView;