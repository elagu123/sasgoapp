import React from 'react';
import type { MapLocation } from './MapTab.tsx';
import LocationCard from './LocationCard.tsx';

interface LocationListProps {
    locations: MapLocation[];
    hoveredLocationId: string | null;
    onHoverLocation: (id: string | null) => void;
}

const LocationList: React.FC<LocationListProps> = ({ locations, hoveredLocationId, onHoverLocation }) => {
    return (
        <div>
            <div className="p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h3 className="text-lg font-bold">Ubicaciones del Viaje</h3>
            </div>
            {locations.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No hay ubicaciones para mostrar.</p>
            ) : (
                <div className="divide-y dark:divide-gray-700">
                    {locations.map(location => (
                        <LocationCard
                            key={location.id}
                            location={location}
                            isHovered={hoveredLocationId === location.id}
                            onHover={onHoverLocation}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LocationList;