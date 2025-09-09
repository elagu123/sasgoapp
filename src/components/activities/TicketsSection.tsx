
import React, { useRef } from 'react';
import type { Ticket } from '../../types.ts';
import TicketCard from './TicketCard.tsx';

interface TicketsSectionProps {
    tickets: Ticket[];
    onUploadTicket: (file: File) => void;
}

const TicketsSection: React.FC<TicketsSectionProps> = ({ tickets, onUploadTicket }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUploadTicket(file);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Mis Entradas</h2>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="application/pdf,image/*"
                />
                <button 
                    onClick={handleUploadClick}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Subir Entrada
                </button>
            </div>

            {tickets.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Todavía no tenés entradas guardadas.</p>
                    <p className="mt-2 text-sm">Subí tus PDFs o imágenes para tenerlas a mano.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tickets.map(ticket => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TicketsSection;
