import React from 'react';
import type { MapLocation } from './MapTab.tsx';

interface LocationCardProps {
    location: MapLocation;
    isHovered: boolean;
    onHover: (id: string | null) => void;
}

const typeDetails = {
    accommodation: { icon: '🏨', color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' },
    activity: { icon: '🏞️', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
    other: { icon: '📌', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
};

const LocationCard: React.FC<LocationCardProps> = ({ location, isHovered, onHover }) => {
    const details = typeDetails[location.type];

    return (
        <div 
            className={`p-3 flex items-center gap-3 transition-colors ${isHovered ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            onMouseEnter={() => onHover(location.id)}
            onMouseLeave={() => onHover(null)}
        >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${details.color}`}>
                {details.icon}
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm truncate text-gray-800 dark:text-gray-200">{location.name}</p>
                {location.startTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{location.startTime}</p>
                )}
            </div>
        </div>
    );
};

export default LocationCard;