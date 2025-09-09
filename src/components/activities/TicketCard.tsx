
import React from 'react';
import type { Ticket } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';

interface TicketCardProps {
    ticket: Ticket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
    const { addToast } = useToast();
    const formattedDate = new Date(ticket.start_iso).toLocaleString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleWalletClick = () => {
        addToast('Agregando a Google Wallet... (Simulación)', 'info');
    };

    const handleCalendarClick = () => {
        addToast('Creando evento en Google Calendar... (Simulación)', 'info');
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.activityName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Titular: {ticket.holder_name}</p>
                
                <div className="mt-4 flex justify-center">
                    {/* Placeholder QR Code */}
                    <div className="w-32 h-32 bg-white p-2 rounded-md">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 10h20v20h-20z m60 0h20v20h-20z M10 70h20v20h-20z M15 15v10h10v-10z m60 0v10h10v-10z M15 75v10h10v-10z M40 10h10v10h-10z m20 0h10v10h-10z m-15 5h5v5h-5z m-5 10h5v5h-5z M40 40h20v20h-20z M70 40h10v10h-10z M40 70h10v10h-10z m20 0h20v10h-20z" fill="#000"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div className="border-t dark:border-gray-600 p-3 bg-gray-100 dark:bg-gray-700 flex justify-around">
                <button onClick={handleWalletClick} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Guardar en Wallet
                </button>
                <button onClick={handleCalendarClick} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Añadir a Calendar
                </button>
            </div>
        </div>
    );
};

export default TicketCard;
