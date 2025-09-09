import React from 'react';
import type { Reservation, ReservationType } from '../../types.ts';
import ReservationCard from './ReservationCard.tsx';

interface ReservationListProps {
    groupedReservations: Record<string, Reservation[]>;
    onDelete: (id: string) => void;
}

const groupOrder: ReservationType[] = ['FLIGHT', 'HOTEL', 'CAR_RENTAL', 'OTHER'];
const groupLabels: Record<ReservationType, string> = {
    FLIGHT: 'Vuelos',
    HOTEL: 'Alojamiento',
    CAR_RENTAL: 'Alquiler de Vehículos',
    OTHER: 'Otros'
};

const ReservationList: React.FC<ReservationListProps> = ({ groupedReservations, onDelete }) => {
    return (
        <div className="space-y-6">
            {groupOrder.map(groupKey => {
                const reservations = groupedReservations[groupKey];
                if (!reservations || reservations.length === 0) return null;

                return (
                    <div key={groupKey}>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-600">{groupLabels[groupKey]}</h3>
                        <div className="space-y-3">
                            {reservations.map(res => (
                                <ReservationCard key={res.id} reservation={res} onDelete={onDelete} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ReservationList;
