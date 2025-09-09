import React from 'react';
import type { MapLocation } from './MapTab.tsx';
import { motion } from 'framer-motion';

interface MapViewProps {
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

const MapView: React.FC<MapViewProps> = ({ locations, bounds, hoveredLocationId, onHoverLocation }) => {
    
    const getPosition = (coords: { lat: number; lng: number }) => {
        const latRange = bounds.maxLat - bounds.minLat;
        const lngRange = bounds.maxLng - bounds.minLng;
        
        // Add padding to avoid pins on the edges
        const padding = 0.1;
        
        const y = (1 - ((coords.lat - bounds.minLat) / latRange)) * (1 - 2 * padding) * 100 + (padding * 100);
        const x = ((coords.lng - bounds.minLng) / lngRange) * (1 - 2 * padding) * 100 + (padding * 100);

        return { top: `${y}%`, left: `${x}%` };
    };

    const pinColors = {
        accommodation: 'bg-red-500',
        activity: 'bg-blue-500',
        other: 'bg-gray-500',
    };

    return (
        <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700">
            {locations.map(location => {
                const isHovered = hoveredLocationId === location.id;
                const position = getPosition(location.coords);
                return (
                    <motion.div
                        key={location.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ top: position.top, left: position.left, zIndex: isHovered ? 10 : 1 }}
                        onMouseEnter={() => onHoverLocation(location.id)}
                        onMouseLeave={() => onHoverLocation(null)}
                        initial={{ scale: 0 }}
                        animate={{ scale: isHovered ? 1.5 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        <div className={`w-4 h-4 rounded-full ${pinColors[location.type]} border-2 border-white dark:border-gray-800 shadow-lg cursor-pointer`}></div>
                    </motion.div>
                );
            })}
             <div className="absolute bottom-2 right-2 bg-white/50 dark:bg-black/50 text-xs px-2 py-1 rounded">
                Simulación de Mapa
            </div>
        </div>
    );
};

export default MapView;