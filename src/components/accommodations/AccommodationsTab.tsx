import React, { useState, useEffect } from 'react';
import type { Trip, StayCandidate } from '../../types.ts';
import { findBestAccommodations } from '../../services/geminiService.ts';
import StayCandidateCard from './StayCandidateCard.tsx';
import { useToast } from '../../hooks/useToast.ts';

interface AccommodationsTabProps {
    trip: Trip;
    onUpdateTrip: (updates: Partial<Trip>) => void;
}

const AccommodationsTab: React.FC<AccommodationsTabProps> = ({ trip, onUpdateTrip }) => {
    const { addToast } = useToast();
    const [accommodations, setAccommodations] = useState<StayCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAccommodations = async () => {
            setIsLoading(true);
            try {
                const results = await findBestAccommodations(trip);
                setAccommodations(results);
            } catch (error) {
                console.error("Failed to fetch accommodations:", error);
                addToast('No se pudieron cargar los alojamientos.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccommodations();
    }, [trip, addToast]);
    
    const handleSetAsBase = (stay: StayCandidate) => {
        onUpdateTrip({ selectedAccommodationId: stay.place_id });
        addToast(`${stay.name} establecido como base del viaje.`, 'success');
        console.log('TELEMETRY: accommodation_base_set', { tripId: trip.id, placeId: stay.place_id });
    };


    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">Encontrá el Mejor Alojamiento</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Resultados ordenados por "Mejor Valor", combinando precio, ubicación y ratings.
                </p>
            </header>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="lodgingType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tipo de Alojamiento
                        </label>
                        <select
                            id="lodgingType"
                            name="lodgingType"
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                        >
                            <option>Todos</option>
                            <option>Hotel</option>
                            <option>Apartamento</option>
                            <option>Hostel</option>
                            <option>B&amp;B</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Presupuesto (USD/noche)
                        </label>
                        <input
                            type="number"
                            name="budget"
                            id="budget"
                            placeholder="Máx."
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => addToast('La búsqueda avanzada estará disponible próximamente.', 'info')}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Buscar
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Placeholder */}
                <div className="h-96 lg:h-auto bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center lg:sticky lg:top-24 self-start">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="mt-2 font-semibold">Mapa de Alojamientos</p>
                        <p className="text-xs">(Próximamente)</p>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <StayCardSkeleton key={i} />)
                    ) : accommodations.length > 0 ? (
                        accommodations.map(stay => (
                            <StayCandidateCard 
                                key={stay.place_id} 
                                stay={stay}
                                onSetAsBase={handleSetAsBase}
                                isBase={trip.selectedAccommodationId === stay.place_id}
                            />
                        ))
                    ) : (
                         <div className="h-96 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                             <p>No se encontraron resultados para tus criterios.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StayCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex animate-pulse h-48">
        <div className="w-1/3 bg-gray-200 dark:bg-gray-700"></div>
        <div className="w-2/3 p-4 flex flex-col justify-between">
            <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32"></div>
            </div>
        </div>
    </div>
);

export default AccommodationsTab;