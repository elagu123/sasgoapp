


import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Trip, ActivityCandidate, ItineraryBlock, Ticket } from '../../types.ts';
import { findBestActivities, parseTicket } from '../../services/geminiService.ts';
import { useToast } from '../../hooks/useToast.ts';
import { hasConflicts } from '../../lib/itinerary-time.ts';
import ActivityFilters, { type Filters } from './ActivityFilters.tsx';
import ActivityCandidateCard from './ActivityCandidateCard.tsx';
import AddActivityToItineraryDialog from './AddActivityToItineraryDialog.tsx';
import TicketsSection from './TicketsSection.tsx';
import ActivitySkeleton from './ActivitySkeleton.tsx';

interface ActivitiesTabProps {
    trip: Trip;
    onUpdateTrip: (updates: Partial<Trip>) => void;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ trip, onUpdateTrip }) => {
    const { addToast } = useToast();
    const [activities, setActivities] = useState<ActivityCandidate[]>([]);
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<'discover' | 'tickets'>('discover');

    const [selectedActivity, setSelectedActivity] = useState<ActivityCandidate | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    const initialFilters: Filters = {
        indoorOutdoor: 'all',
        price: 'all',
        duration: 'all',
        lowQueueOnly: false,
        accessibleOnly: false,
        familyFriendlyOnly: false,
    };
    const [filters, setFilters] = useState(initialFilters);

    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true);
            try {
                const results = await findBestActivities(trip);
                setActivities(results);
            } catch (error) {
                console.error("Failed to fetch activities:", error);
                addToast('No se pudieron cargar las actividades.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchActivities();
    }, [trip, addToast]);

    const handleOpenAddDialog = (activity: ActivityCandidate) => {
        setSelectedActivity(activity);
        setAddDialogOpen(true);
    };

    const handleAddActivityToItinerary = (date: string, time: string) => {
        if (!selectedActivity) return;

        const newBlock: Omit<ItineraryBlock, 'id'> = {
            date,
            startTime: time as any,
            endTime: '23:59', // Placeholder, a real app would calculate this
            title: selectedActivity.name,
            type: 'activity',
            category: 'sightseeing', // Placeholder
        };

        const dayBlocks = trip.itinerary?.find(d => d.date === date)?.blocks || [];
        const conflict = hasConflicts(dayBlocks, { startTime: newBlock.startTime, endTime: newBlock.endTime });
        if (conflict.conflict) {
            addToast(`El horario se solapa con "${conflict.with?.title}".`, 'error');
            return;
        }

        const newItinerary = [...(trip.itinerary || [])];
        const dayIndex = newItinerary.findIndex(d => d.date === date);

        if (dayIndex > -1) {
            newItinerary[dayIndex].blocks.push({ ...newBlock, id: uuidv4() });
        } else {
            newItinerary.push({ dayIndex: newItinerary.length + 1, date, blocks: [{ ...newBlock, id: uuidv4() }] });
        }
        
        onUpdateTrip({ itinerary: newItinerary });
        addToast(`${selectedActivity.name} añadido al itinerario.`, 'success');
        setAddDialogOpen(false);
    };
    
    const handleParseTicket = async (file: File) => {
        addToast('Procesando tu entrada...', 'info');
        try {
            const ticket = await parseTicket(file);
            setMyTickets(prev => [...prev, ticket]);
            addToast('¡Entrada procesada con éxito!', 'success');
        } catch(e) {
            addToast('No se pudo procesar la entrada.', 'error');
        }
    };
    
    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            // Indoor/Outdoor
            if (filters.indoorOutdoor === 'indoor' && !act.isIndoor) return false;
            if (filters.indoorOutdoor === 'outdoor' && act.isIndoor) return false;
            // Price
            if (filters.price === 'free' && act.price_estimate > 0) return false;
            if (filters.price === 'under20' && act.price_estimate >= 20) return false;
            if (filters.price === '20-50' && (act.price_estimate < 20 || act.price_estimate > 50)) return false;
            if (filters.price === 'over50' && act.price_estimate <= 50) return false;
            // Duration
            if (filters.duration === 'under1h' && act.durationMin >= 60) return false;
            if (filters.duration === '1-3h' && (act.durationMin < 60 || act.durationMin > 180)) return false;
            if (filters.duration === 'over3h' && act.durationMin <= 180) return false;
            // Booleans
            if (filters.lowQueueOnly && act.queueRisk !== 'low') return false;
            if (filters.accessibleOnly && !act.isAccessible) return false;
            if (filters.familyFriendlyOnly && !act.isFamilyFriendly) return false;

            return true;
        });
    }, [activities, filters]);


    const SubTabButton: React.FC<{ tabName: 'discover' | 'tickets'; label: string }> = ({ tabName, label }) => (
        <button
          onClick={() => setActiveSubTab(tabName)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === tabName ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <AddActivityToItineraryDialog
                isOpen={isAddDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                activity={selectedActivity}
                onConfirm={handleAddActivityToItinerary}
                tripDates={trip.dates}
            />

            <header className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">Actividades y Entradas</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Descubrí, planificá y gestioná las experiencias de tu viaje.
                </p>
                <div className="mt-4 border-t dark:border-gray-700 pt-4 flex space-x-2">
                    <SubTabButton tabName="discover" label="Descubrir" />
                    <SubTabButton tabName="tickets" label="Mis Entradas" />
                </div>
            </header>

            {activeSubTab === 'discover' && (
                <>
                    <ActivityFilters filters={filters} onFilterChange={setFilters} onClearFilters={() => setFilters(initialFilters)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                           Array.from({ length: 3 }).map((_, i) => <ActivitySkeleton key={i} />)
                        ) : filteredActivities.length > 0 ? (
                            filteredActivities.map(act => (
                                <ActivityCandidateCard
                                    key={act.place_id}
                                    activity={act}
                                    onAddToItinerary={() => handleOpenAddDialog(act)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400">No se encontraron actividades con los filtros seleccionados.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeSubTab === 'tickets' && (
                <TicketsSection tickets={myTickets} onUploadTicket={handleParseTicket} />
            )}
        </div>
    );
};

export default ActivitiesTab;