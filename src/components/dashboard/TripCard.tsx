

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trackEvent } from '../../lib/telemetry.js';
import { sanitize } from '../../lib/sanitize.ts';
import DaysBadge from './DaysBadge.tsx';
import QuickActions from './QuickActions.tsx';
import CollaboratorAvatars from '../CollaboratorAvatars.tsx';
import type { Trip } from '../../types.ts';

interface ProgressBarProps {
    value: number;
    label: string;
    details: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, details }) => (
     <div>
        <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400" style={{color: 'var(--text-secondary)'}}>{label}</span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400" style={{color: 'var(--brand-primary)'}}>{details}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700" style={{backgroundColor: 'var(--progress-base)'}}>
            {/* @ts-ignore */}
            <motion.div 
                className="h-2 rounded-full" 
                style={{backgroundColor: 'var(--brand-primary)'}}
                initial={{ width: 0 }}
                animate={{ width: `${value}%`}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label} progress`}
            />
        </div>
    </div>
);

const WeatherChip: React.FC<{ weather: Trip['weather'] }> = ({ weather }) => {
    if (!weather) return null;
    const icons: Record<string, string> = { sunny: '☀️', rainy: '🌧️', cloudy: '☁️', snowy: '❄️' };
    return (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-full px-2 py-0.5">
            <span>{icons[weather.condition]}</span>
            <span>{weather.averageTemp}°C</span>
        </div>
    );
};

interface TripCardProps {
    trip: Trip;
    onEdit: (trip: Trip) => void;
    onDelete: (tripId: string) => void;
}

const TripCard: React.FC<TripCardProps> = React.memo(({ trip, onEdit, onDelete }) => {

    const handleCardOpen = () => {
        trackEvent('trip_card_opened', { tripId: trip.id });
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1.0 },
    };
    
    const totalDays = Math.ceil((new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const plannedDays = Math.round(((trip.itineraryCompletion || 0) / 100) * totalDays);
    const itineraryDetails = `${plannedDays}/${totalDays} días`;
    
    const packingProgressPercent = trip.packingProgress ? (trip.packingProgress.packed / trip.packingProgress.total) * 100 : 0;
    const packingDetails = trip.packingProgress ? `${trip.packingProgress.packed}/${trip.packingProgress.total} items` : 'No iniciada';


    return (
        /* @ts-ignore */
        <motion.div
            layout
            variants={cardVariants}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="trip-card bg-white dark:bg-gray-800 overflow-hidden flex flex-col"
        >
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white pr-2" style={{color: 'var(--text-primary)'}}>{sanitize(trip.title)}</h3>
                    <DaysBadge startDate={trip.dates.start} endDate={trip.dates.end} />
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate" style={{color: 'var(--text-secondary)'}}>{sanitize(trip.destination.join(', '))}</p>
                    <WeatherChip weather={trip.weather} />
                </div>
                
                <div className="mt-4 space-y-3">
                    <ProgressBar value={trip.itineraryCompletion || 0} label="Itinerario" details={itineraryDetails} />
                    <ProgressBar value={packingProgressPercent} label="Empaque" details={packingDetails} />
                </div>
                
                <QuickActions trip={trip} onEdit={onEdit} onDelete={onDelete} />

            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-between items-center" style={{backgroundColor: 'var(--surface)'}}>
                {/* Conditionally render avatars only if there are members */}
                {trip.members && trip.members.length > 0 ? (
                    <CollaboratorAvatars members={trip.members} size="sm" awareUsers={[]} />
                ) : (
                    <div /> // Empty div to maintain flexbox alignment
                )}
                <Link to={`/app/trips/${trip.id}`} onClick={handleCardOpen} className="text-sm font-semibold hover:underline" style={{color: 'var(--brand-primary)'}}>
                    Continuar planeando
                </Link>
            </div>
        </motion.div>
    );
});

export default TripCard;