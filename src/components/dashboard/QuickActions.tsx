import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Trip } from '../../types';

interface QuickActionsProps {
    trip: Trip;
    onEdit: (trip: Trip) => void;
    onDelete: (tripId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ trip, onEdit, onDelete }) => {
    const navigate = useNavigate();
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`¿Estás seguro de que deseas eliminar el viaje a "${trip.title}"?`)) {
            onDelete(trip.id);
        }
    };
    
    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(trip);
    };

    const handlePackingListClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Navigate to packing list creation with trip data
        navigate('/app/packing/new', { 
            state: { 
                tripId: trip.id,
                tripData: {
                    title: `Lista para ${trip.title}`,
                    destination: trip.destination.join(', '),
                    startDate: trip.dates.start,
                    endDate: trip.dates.end,
                    travelers: trip.travelers,
                    pace: trip.pace,
                    budget: trip.budget
                }
            } 
        });
    };

    return (
        <div className="mt-4 border-t dark:border-gray-700 pt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                {!trip.packingListId && (
                    <button 
                        onClick={handlePackingListClick} 
                        className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors flex items-center space-x-1" 
                        aria-label={`Crear lista de empaque para ${trip.title}`}
                    >
                        <span>🧳</span>
                        <span>Crear Lista</span>
                    </button>
                )}
                {trip.packingListId && (
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/app/packing/${trip.packingListId}`);
                        }} 
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors flex items-center space-x-1" 
                        aria-label={`Ver lista de empaque para ${trip.title}`}
                    >
                        <span>📋</span>
                        <span>Ver Lista</span>
                    </button>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={handleEditClick} className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label={`Editar viaje ${trip.title}`}>
                    Editar
                </button>
                <button onClick={handleDeleteClick} className="text-xs font-semibold text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors" aria-label={`Eliminar viaje ${trip.title}`}>
                    Eliminar
                </button>
            </div>
        </div>
    );
};

export default QuickActions;
