import React, { useState, useMemo } from 'react';
import type { Trip, Reservation } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useReservations } from '../../hooks/useReservations.ts';
import AddReservationDialog from './AddReservationDialog.tsx';
import ReservationList from './ReservationList.tsx';

interface ReservationsTabProps {
    trip: Trip;
}

const ReservationsTab: React.FC<ReservationsTabProps> = ({ trip }) => {
    const { addToast } = useToast();
    const [isAddOpen, setAddOpen] = useState(false);
    
    const { reservations = [], createReservation, deleteReservation, isLoading } = useReservations(trip.id);

    const handleAddReservation = (data: Omit<Reservation, 'id' | 'tripId'>) => {
        createReservation.mutate({ ...data, tripId: trip.id }, {
            onSuccess: () => {
                setAddOpen(false);
                addToast('Reserva añadida con éxito.', 'success');
            },
            onError: () => {
                 addToast('No se pudo añadir la reserva.', 'error');
            }
        });
    };
    
    const handleDeleteReservation = (reservationId: string) => {
        deleteReservation.mutate(reservationId, {
            onSuccess: () => {
                 addToast('Reserva eliminada.', 'info');
            },
             onError: () => {
                 addToast('No se pudo eliminar la reserva.', 'error');
            }
        });
    };
    
    const groupedReservations = useMemo(() => {
        return reservations.reduce((acc, res) => {
            (acc[res.type] = acc[res.type] || []).push(res);
            return acc;
        }, {} as Record<string, Reservation[]>);
    }, [reservations]);


    return (
        <div className="space-y-6">
            <AddReservationDialog
                isOpen={isAddOpen}
                onClose={() => setAddOpen(false)}
                onAddReservation={handleAddReservation}
                isSubmitting={createReservation.isPending}
            />
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Registro de Reservas</h2>
                    <button 
                        onClick={() => setAddOpen(true)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Añadir Reserva
                    </button>
                </div>
                
                {isLoading ? (
                    <p>Cargando reservas...</p>
                ) : reservations.length === 0 ? (
                     <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">Aún no hay reservas guardadas.</p>
                        <p className="mt-2 text-sm">Añadí tus vuelos, hoteles y más para tener todo en un solo lugar.</p>
                    </div>
                ) : (
                    <ReservationList
                        groupedReservations={groupedReservations}
                        onDelete={handleDeleteReservation}
                    />
                )}
            </div>
        </div>
    );
};

export default ReservationsTab;
