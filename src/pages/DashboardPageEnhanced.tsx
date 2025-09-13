import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../hooks/useTrips';
import TripFormDialog from '../components/TripFormDialog';
import ConflictDialog from '../components/ConflictDialog';
import EnhancedDashboard from '../components/dashboard/EnhancedDashboard';
import { DashboardSkeleton } from '../components/dashboard/Skeletons';
import type { Trip } from '../types';

const DashboardPageEnhanced: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [conflict, setConflict] = useState<{ local: Trip, remote: Trip, version: number } | null>(null);

    const { 
        data: trips = [], 
        isLoading, 
        error 
    } = useTrips();
    const { createTrip, updateTrip, deleteTrip } = useTrips();

    const handleOpenCreate = () => {
        setEditingTrip(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (trip: Trip) => {
        setEditingTrip(trip);
        setFormOpen(true);
    };

    const handleSaveTrip = async (tripData: Partial<Trip>) => {
        try {
            if (editingTrip) {
                await updateTrip.mutateAsync({ ...editingTrip, ...tripData });
            } else {
                await createTrip.mutateAsync(tripData as Omit<Trip, 'id'>);
            }
            setFormOpen(false);
            setEditingTrip(null);
        } catch (error) {
            console.error('Error saving trip:', error);
        }
    };

    const handleDeleteTrip = async (tripId: string) => {
        try {
            await deleteTrip.mutateAsync(tripId);
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    const handleConflictResolve = (resolutionData: Trip) => {
        // Handle conflict resolution
        setConflict(null);
    };

    if (isLoading) return <DashboardSkeleton />;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <TripFormDialog 
                isOpen={isFormOpen} 
                onClose={() => setFormOpen(false)} 
                onSave={handleSaveTrip} 
                initialData={editingTrip} 
            />
            
            <ConflictDialog<Trip>
                isOpen={!!conflict}
                onClose={() => setConflict(null)}
                entityType="viaje"
                localData={conflict?.local}
                remoteData={conflict?.remote}
                onResolve={handleConflictResolve}
            />
            
            <EnhancedDashboard />
        </>
    );
};

export default DashboardPageEnhanced;