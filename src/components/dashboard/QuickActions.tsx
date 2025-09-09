import React from 'react';
import type { Trip } from '../../types';

interface QuickActionsProps {
    trip: Trip;
    onEdit: (trip: Trip) => void;
    onDelete: (tripId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ trip, onEdit, onDelete }) => {
    
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
    }

    return (
        <div className="mt-4 border-t dark:border-gray-700 pt-3 flex items-center justify-end space-x-2">
            <button onClick={handleEditClick} className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label={`Editar viaje ${trip.title}`}>
                Editar
            </button>
            <button onClick={handleDeleteClick} className="text-xs font-semibold text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors" aria-label={`Eliminar viaje ${trip.title}`}>
                Eliminar
            </button>
        </div>
    );
};

export default QuickActions;
