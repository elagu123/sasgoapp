
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.tsx';
import { dashboardFilterStore } from '../state/dashboardFilters.ts';
import { useTrips } from '../hooks/useTrips.ts';
import { sanitize } from '../lib/sanitize.ts';
import { uploadTripImage } from '../services/api.ts';

import { DashboardSkeleton } from '../components/dashboard/Skeletons.tsx';
import KpiCard from '../components/dashboard/KpiCard.tsx';
import TripCard from '../components/dashboard/TripCard.tsx';
import QuickFiltersBar from '../components/dashboard/QuickFiltersBar.tsx';
import TripFormDialog from '../components/TripFormDialog.tsx';
import ConflictDialog from '../components/ConflictDialog.tsx';
import type { Trip } from '../types.ts';
import AiRecommendations from '../components/dashboard/AiRecommendations.tsx';
import GetawayPlannerCta from '../components/dashboard/GetawayPlannerCta.tsx';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [filterState, setFilterState] = useState(dashboardFilterStore.getState());
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    
    // State for conflict resolution
    const [conflict, setConflict] = useState<{ local: Trip, remote: Trip, version: number } | null>(null);

    const { 
        data: trips = [], 
        isLoading, 
        error 
    } = useTrips();
    const { createTrip, updateTrip, deleteTrip } = useTrips();

    React.useEffect(() => {
        const unsubscribe = dashboardFilterStore.subscribe(() => setFilterState(dashboardFilterStore.getState()));
        return unsubscribe;
    }, []);
    
    const handleOpenCreate = () => {
        setEditingTrip(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (trip: Trip) => {
        setEditingTrip(trip);
        setFormOpen(true);
    };

    const handleSaveTrip = async (tripData: Partial<Trip>, imageFile?: File) => {
        try {
            if (editingTrip) {
                updateTrip.mutate({ ...tripData, id: editingTrip.id, version: editingTrip.version }, {
                    onSuccess: async (updatedTrip) => {
                        if (imageFile) {
                            try {
                                await uploadTripImage(updatedTrip.id, imageFile);
                            } catch (error) {
                                console.error('Error uploading image:', error);
                            }
                        }
                    },
                    onError: (error: any) => {
                        if (error.status === 409) {
                            setConflict({ local: { ...editingTrip, ...tripData }, remote: error.body.remote, version: editingTrip.version || 0 });
                        }
                    }
                });
            } else {
                createTrip.mutate(tripData, {
                    onSuccess: async (newTrip) => {
                        if (imageFile) {
                            try {
                                await uploadTripImage(newTrip.id, imageFile);
                            } catch (error) {
                                console.error('Error uploading image:', error);
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error saving trip:', error);
        }
        setFormOpen(false);
    };
    
    const handleDeleteTrip = (tripId: string) => {
        deleteTrip.mutate(tripId);
    };

    const handleConflictResolve = (resolvedTrip: Trip) => {
        // We use the remote version for the If-Match header
        updateTrip.mutate({ ...resolvedTrip, version: conflict?.remote.version });
        setConflict(null);
    };

    const filteredTrips = useMemo(() => {
        const query = filterState.searchQuery.toLowerCase().trim();
        if (!query) return trips;

        return trips.filter(trip => {
            const destinationMatch = trip.destination.join(', ').toLowerCase().includes(query);
            const titleMatch = trip.title.toLowerCase().includes(query);
            return titleMatch || destinationMatch;
        });
    }, [trips, filterState.searchQuery]);

    const { tripsCount, nextTrip, daysToNextTrip, activeListsCount } = useMemo(() => {
        const count = trips.length;
        const next = trips.find(t => new Date(t.dates.start) >= new Date());
        const days = next ? Math.ceil((new Date(next.dates.start).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const activeLists = trips.filter(t => t.packingListId).length;
        return { tripsCount: count, nextTrip: next, daysToNextTrip: days, activeListsCount: activeLists };
    }, [trips]);
    
    const subtitle = useMemo(() => 
        `Hola, ${sanitize(user?.name)}. Tenés ${tripsCount} viajes planeados. ${nextTrip && daysToNextTrip > 0 ? `Próxima salida en ${daysToNextTrip} días.` : ''}`,
        [user?.name, tripsCount, nextTrip, daysToNextTrip]
    );

    if (isLoading && trips.length === 0) return <DashboardSkeleton />;
    if (error) return <div className="text-center text-red-500">{error.message}</div>;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

    return (
        <div className="space-y-10">
            <TripFormDialog isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={handleSaveTrip} initialData={editingTrip} />
            <ConflictDialog<Trip>
                isOpen={!!conflict}
                onClose={() => setConflict(null)}
                entityType="viaje"
                localData={conflict?.local}
                remoteData={conflict?.remote}
                onResolve={handleConflictResolve}
            />
            <header className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
                </div>
                <button onClick={handleOpenCreate} className="bg-brand-primary text-white font-bold py-3 px-5 rounded-xl hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'var(--brand-primary)' }}>
                    + Planear nuevo viaje
                </button>
            </header>

            <GetawayPlannerCta />
            {/* @ts-ignore */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KpiCard title="Viajes Planeados" value={tripsCount} icon="✈️" filterKey="trips" onClick={() => dashboardFilterStore.setActiveKpi('trips')} isActive={filterState.activeKpi === 'trips'} />
                <KpiCard title="Listas Activas" value={activeListsCount} icon="🧳" filterKey="packingLists" onClick={() => dashboardFilterStore.setActiveKpi('packingLists')} isActive={filterState.activeKpi === 'packingLists'} />
                <KpiCard title="Equipajes Registrados" value={2} icon="🛡️" filterKey="gear" onClick={() => dashboardFilterStore.setActiveKpi('gear')} isActive={filterState.activeKpi === 'gear'} />
                <div title="Acciones realizadas por el copiloto de IA, como generación de itinerarios y sugerencias de empaque.">
                    <KpiCard title="Acciones con IA" value={23} icon="✨" filterKey="copilotUsage" onClick={() => dashboardFilterStore.setActiveKpi('copilotUsage')} isActive={filterState.activeKpi === 'copilotUsage'} />
                </div>
            </motion.div>
            
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Viajes</h2>
                </div>
                <QuickFiltersBar activeFilter={filterState.activeKpi} onClear={() => dashboardFilterStore.clearFilters()} />
                <AnimatePresence>
                    {/* @ts-ignore */}
                    <motion.div layout variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTrips.map(trip => (
                            <TripCard key={trip.id} trip={trip} onEdit={handleOpenEdit} onDelete={handleDeleteTrip} />
                        ))}
                    </motion.div>
                </AnimatePresence>
                {filteredTrips.length === 0 && !isLoading && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                        <div className="text-5xl mb-4">🧳</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">¡Tu próxima aventura empieza acá!</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Aún no tenés viajes planeados. ¿Qué esperas?</p>
                        <button onClick={handleOpenCreate} className="bg-brand-primary text-white font-bold py-3 px-5 rounded-xl hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'var(--brand-primary)' }}>
                            Planear mi primer viaje
                        </button>
                    </div>
                )}
            </section>

            <AiRecommendations />
        </div>
    );
};

export default DashboardPage;
