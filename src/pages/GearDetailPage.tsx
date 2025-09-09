import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Gear, GearTicket, TicketStatus } from '../types.ts';
import { useToast } from '../hooks/useToast.ts';
import { motion } from 'framer-motion';
import { useGear } from '../hooks/useGear.ts';

const TICKET_STATUS_STYLES: Record<string, string> = {
    ABIERTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    EN_REVISION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PRESUPUESTADO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    EN_REPARACION: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    LISTO_ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const GearDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { addToast } = useToast();
    const { data: gear, isLoading, error } = useGear(id);
    const [activeTab, setActiveTab] = useState('info');

    const handleTransfer = () => {
        addToast('Generando enlace de transferencia...', 'info');
        console.log('TELEMETRY: gear_transfer_initiated', { gearId: gear?.id });
        setTimeout(() => {
            prompt("Copiá este enlace seguro (simulación):", `https://sasgo.app/transfer?token=...`);
        }, 1000);
    };

    const handleNewTicket = () => {
        addToast('Ticket de servicio creado (simulación)', 'success');
        console.log('TELEMETRY: gear_ticket_created', { gearId: gear?.id });
        // In a real app, this would open a form and then update the state
    };
    
    const handleDownloadPdf = () => {
        addToast('Generando Tarjeta de Propiedad PDF...', 'info');
        console.log('TELEMETRY: gear_property_pdf_downloaded', { gearId: gear?.id });
    };

    if (isLoading) return <div className="text-center">Cargando equipaje...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error.message}</div>;
    if (!gear) return <div className="text-center">Equipaje no encontrado.</div>;

    const isWarrantyActive = new Date(gear.warrantyExpiresAt) > new Date();
    const purchaseDate = new Date(gear.purchaseDate).toLocaleDateString('es-AR');
    const warrantyExpiresAt = new Date(gear.warrantyExpiresAt).toLocaleDateString('es-AR');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold">{gear.modelName}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 capitalize">{gear.color} / {gear.size}</p>
                        <p className="font-mono text-xs text-gray-400 dark:text-gray-500 mt-1">{gear.serial}</p>
                    </div>
                    <div className={`text-sm font-bold px-3 py-1.5 rounded-full ${isWarrantyActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                        {isWarrantyActive ? 'En Garantía' : 'Garantía Vencida'}
                    </div>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md">
                <nav className="flex space-x-2">
                    <TabButton activeTab={activeTab} tabName="info" label="Información" onClick={setActiveTab} />
                    <TabButton activeTab={activeTab} tabName="tickets" label={`Tickets (${gear.tickets.length})`} onClick={setActiveTab} />
                    <TabButton activeTab={activeTab} tabName="transfer" label="Transferir" onClick={setActiveTab} />
                </nav>
            </div>

            <main>
                {/* @ts-ignore */}
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'info' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><strong>Fecha de Compra:</strong> {purchaseDate}</div>
                            <div className="capitalize"><strong>Canal:</strong> {gear.channel}</div>
                            <div><strong>Garantía Activa Hasta:</strong> {warrantyExpiresAt}</div>
                            <div className="md:col-span-2">
                                 <button onClick={handleDownloadPdf} className="w-full md:w-auto mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-2 px-4 rounded-lg transition-colors">
                                    Descargar Tarjeta de Propiedad (PDF)
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'tickets' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Historial de Servicio Técnico</h2>
                                <button onClick={handleNewTicket} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">+ Nuevo Ticket</button>
                            </div>
                            {gear.tickets.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No hay tickets de servicio para este equipaje.</p>
                            ) : (
                                <div className="space-y-4">
                                    {gear.tickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket} />)}
                                </div>
                            )}
                        </div>
                    )}
                     {activeTab === 'transfer' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Transferir Propiedad</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Si vendiste o regalaste tu equipaje, podés transferir la propiedad y el resto de la garantía al nuevo dueño. Se generará un enlace seguro que expira en 72 horas.
                            </p>
                             <button onClick={handleTransfer} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                                Iniciar Transferencia
                            </button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

const TabButton: React.FC<{activeTab: string; tabName: string; label: string; onClick: (tab: string) => void}> = ({ activeTab, tabName, label, onClick }) => (
    <button
      onClick={() => onClick(tabName)}
      className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab !== tabName ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' : 'text-white'}`}
    >
      {activeTab === tabName && (
          /* @ts-ignore */
          <motion.span layoutId="active-pill" className="absolute inset-0 bg-blue-600 rounded-md z-0" />
      )}
      <span className="relative z-10">{label}</span>
    </button>
);

const TicketItem: React.FC<{ ticket: GearTicket }> = ({ ticket }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex justify-between items-center">
            <p className="font-bold capitalize">{ticket.category} - Creado el {new Date(ticket.createdAt).toLocaleDateString('es-AR')}</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${TICKET_STATUS_STYLES[ticket.status]}`}>{ticket.status.replace('_', ' ').toLowerCase()}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{ticket.description}</p>
    </div>
);

export default GearDetailPage;