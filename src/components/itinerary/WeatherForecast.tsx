
import React, { useState, useEffect } from 'react';
import type { WeatherForecastDay } from '../../types';
import { motion } from 'framer-motion';
import { weatherService } from '../../services/weatherService.ts';

interface WeatherForecastProps {
    isLoading: boolean;
    forecast: WeatherForecastDay[] | null;
}

const WeatherDayCard: React.FC<{ day: WeatherForecastDay }> = ({ day }) => {
    const date = new Date(day.date + 'T00:00:00-03:00'); // Ensure correct date parsing
    const dayOfWeek = new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(date);

    return (
        <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm w-24 flex-shrink-0">
            <p className="text-sm font-semibold capitalize text-gray-600 dark:text-gray-300">{dayOfWeek}</p>
            <p className="text-3xl my-1">{day.icon}</p>
            <div className="text-sm">
                <span className="font-bold text-gray-800 dark:text-gray-100">{day.temp_max}°</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">{day.temp_min}°</span>
            </div>
        </div>
    );
};

const WeatherForecastSkeleton: React.FC = () => (
    <div className="flex space-x-4">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm w-24 h-[108px] flex-shrink-0 animate-pulse">
                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-2"></div>
                 <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            </div>
        ))}
    </div>
);


const WeatherForecast: React.FC<WeatherForecastProps> = ({ isLoading, forecast }) => {
    const [isRealData, setIsRealData] = useState(false);

    useEffect(() => {
        setIsRealData(weatherService.isApiKeyConfigured());
    }, []);

    return (
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Pronóstico del Tiempo</h3>
                {!isRealData && (
                    <div className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md">
                        Datos simulados
                    </div>
                )}
                {isRealData && (
                    <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md">
                        Datos reales
                    </div>
                )}
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                {isLoading ? (
                    <WeatherForecastSkeleton />
                ) : forecast && forecast.length > 0 ? (
                    forecast.map(day => <WeatherDayCard key={day.date} day={day} />)
                ) : (
                    <div className="text-center py-4 w-full">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No hay pronóstico disponible.</p>
                        {!isRealData && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Configure REACT_APP_WEATHER_API_KEY para datos reales
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherForecast;