import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, OptimizationSuggestion, WeatherForecastDay } from '../../types';
import { getTripOptimizationsFromAI, getWeatherForecast } from '../../services/geminiService';
import OptimizationCard from './OptimizationCard';
import { useToast } from '../../hooks/useToast';

interface OptimizeTabProps {
    trip: Trip;
}

const OptimizeTab: React.FC<OptimizeTabProps> = ({ trip }) => {
    const { addToast } = useToast();
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyzeTrip = async () => {
        setIsLoading(true);
        setSuggestions(null);
        addToast('Analizando tu itinerario con IA...', 'info');

        try {
            // We need weather data for one of the optimization categories
            const weather = await getWeatherForecast(trip.destination[0], trip.dates.start, trip.dates.end);
            const results = await getTripOptimizationsFromAI(trip, weather);
            setSuggestions(results);
        } catch (error) {
            console.error("Failed to get optimizations:", error);
            addToast('No se pudo completar el análisis.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">🔬</div>
                <h2 className="text-2xl font-bold">Optimizador de Itinerario IA</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                    Dejá que nuestro copiloto analice tu plan en busca de mejoras de logística, ritmo y más, para que aproveches al máximo cada minuto de tu viaje.
                </p>
                <button 
                    onClick={handleAnalyzeTrip}
                    disabled={isLoading}
                    className="mt-6 bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 transition-transform hover:scale-105 shadow-lg disabled:bg-purple-400 disabled:scale-100"
                >
                    {isLoading ? 'Analizando...' : 'Analizar mi Itinerario'}
                </button>
            </div>

            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-10"
                    >
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">Nuestros expertos en IA están revisando tu plan...</p>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {suggestions && (
                <div className="space-y-4">
                    {suggestions.length === 0 ? (
                        <div className="text-center p-10 bg-green-50 dark:bg-green-900/30 rounded-lg">
                             <div className="text-4xl mb-3">✅</div>
                            <h3 className="text-xl font-bold text-green-800 dark:text-green-200">¡Todo parece perfecto!</h3>
                            <p className="text-green-700 dark:text-green-300">No encontramos sugerencias obvias de mejora. ¡Tu plan de viaje se ve genial!</p>
                        </div>
                    ) : (
                        suggestions.map(sugg => <OptimizationCard key={sugg.id} suggestion={sugg} />)
                    )}
                </div>
            )}
        </div>
    );
};

export default OptimizeTab;