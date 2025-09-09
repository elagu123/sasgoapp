import React from 'react';
import { motion } from 'framer-motion';
import type { OptimizationSuggestion } from '../../types';

interface OptimizationCardProps {
    suggestion: OptimizationSuggestion;
}

const categoryDetails = {
    PACING: { icon: '🏃', label: 'Ritmo', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    LOGISTICS: { icon: '🗺️', label: 'Logística', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    WEATHER: { icon: '🌦️', label: 'Clima', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
    COST: { icon: '💰', label: 'Costo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
};

const OptimizationCard: React.FC<OptimizationCardProps> = ({ suggestion }) => {
    const details = categoryDetails[suggestion.category];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex items-start gap-4"
        >
            <div className="text-3xl mt-1">{details.icon}</div>
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${details.color}`}>{details.label}</span>
                    {suggestion.dayIndex && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Día {suggestion.dayIndex}</span>}
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{suggestion.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
            </div>
        </motion.div>
    );
};

export default OptimizationCard;