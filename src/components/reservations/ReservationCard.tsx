import React from 'react';
import type { Reservation } from '../../types.ts';

interface ReservationCardProps {
    reservation: Reservation;
    onDelete: (id: string) => void;
}

const typeDetails = {
    FLIGHT: { icon: '✈️', label: 'Vuelo' },
    HOTEL: { icon: '🏨', label: 'Alojamiento' },
    CAR_RENTAL: { icon: '🚗', label: 'Alquiler de Auto' },
    OTHER: { icon: '📌', label: 'Otro' },
};

const formatDate = (isoString: string) => new Date(isoString).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
});

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, onDelete }) => {
    const { icon, label } = typeDetails[reservation.type];
    const { details } = reservation;

    const renderDetails = () => {
        switch (reservation.type) {
            case 'FLIGHT':
                return (
                    <>
                        <p><strong>Aerolínea:</strong> {details.airline || 'N/A'}</p>
                        <p><strong>Vuelo:</strong> {details.flightNumber || 'N/A'}</p>
                        <p><strong>Desde:</strong> {details.departureAirport || 'N/A'} <strong>Hasta:</strong> {details.arrivalAirport || 'N/A'}</p>
                        <p><strong>Confirmación:</strong> {details.confirmationCode || 'N/A'}</p>
                    </>
                );
            case 'HOTEL':
                return (
                    <>
                        <p><strong>Dirección:</strong> {details.address || 'N/A'}</p>
                        <p><strong>Confirmación:</strong> {details.confirmationCode || 'N/A'}</p>
                    </>
                );
            case 'CAR_RENTAL':
                 return (
                    <>
                        <p><strong>Compañía:</strong> {details.company || 'N/A'}</p>
                        <p><strong>Lugar de retiro:</strong> {details.pickupLocation || 'N/A'}</p>
                        <p><strong>Confirmación:</strong> {details.confirmationCode || 'N/A'}</p>
                    </>
                );
            default:
                return <p>{details.notes || 'No hay detalles adicionales.'}</p>;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm relative group">
            <div className="flex items-start gap-4">
                <div className="text-3xl mt-1">{icon}</div>
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{reservation.title}</h3>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{label}</p>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p><strong>Inicio:</strong> {formatDate(reservation.startDate)}</p>
                        {reservation.endDate && <p><strong>Fin:</strong> {formatDate(reservation.endDate)}</p>}
                        {renderDetails()}
                    </div>
                </div>
            </div>
            <button
                onClick={() => onDelete(reservation.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/50"
                aria-label="Eliminar reserva"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};

export default ReservationCard;
