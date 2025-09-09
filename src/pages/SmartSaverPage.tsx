import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast.ts';
import PaymentModal from '../components/PaymentModal.tsx';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_BUNDLES = [
    {
        id: 'bundle1',
        score: 9.5,
        totalPrice: 1850,
        rationale: ['Vuelo directo en horario ideal.', 'Hotel 4 estrellas con excelentes críticas y desayuno incluido.', 'Actividades populares cubiertas.'],
        flights: [{ airline: 'Aerolíneas Argentinas', from: 'EZE', to: 'BRC', stops: 0, price: 600 }],
        lodging: { name: 'Hotel Montaña Azul', type: 'Hotel 4 estrellas', price: 1000 },
        activities: [{ name: 'Tour Circuito Chico', price: 150 }, { name: 'Excursión a Isla Victoria', price: 100 }]
    },
    {
        id: 'bundle2',
        score: 8.2,
        totalPrice: 1500,
        rationale: ['Opción más económica.', 'Vuelo con una escala corta.', 'Cabaña acogedora cerca del centro.'],
        flights: [{ airline: 'Flybondi', from: 'EZE', to: 'BRC', stops: 1, price: 350 }],
        lodging: { name: 'Cabañas del Bosque', type: 'Cabaña', price: 900 },
        activities: [{ name: 'Tour Circuito Chico', price: 150 }, { name: 'Alquiler de Kayak', price: 100 }]
    }
];

const SmartSaverPage: React.FC = () => {
    const { id } = useParams();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [bundles, setBundles] = useState<typeof MOCK_BUNDLES | null>(null);
    const [selectedBundle, setSelectedBundle] = useState<(typeof MOCK_BUNDLES)[0] | null>(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSelectedBundle(null);
        addToast('Buscando las mejores combinaciones...', 'info');
        console.log('TELEMETRY: saver_quote_requested', { tripId: id });
        
        setTimeout(() => {
            setBundles(MOCK_BUNDLES);
            setIsLoading(false);
            addToast('Encontramos las mejores ofertas!', 'success');
        }, 2000);
    };

    const handleSelectBundle = (bundle: (typeof MOCK_BUNDLES)[0]) => {
        setSelectedBundle(bundle);
    };

    const handleBookingConfirmation = () => {
        console.log('TELEMETRY: booking_process_started', { tripId: id, bundleId: selectedBundle?.id });
        setPaymentModalOpen(true);
    };
    
    const handlePaymentSuccess = () => {
        setPaymentModalOpen(false);
        addToast('¡Reserva confirmada con éxito!', 'success');
        console.log('TELEMETRY: booking_process_success', { tripId: id, bundleId: selectedBundle?.id });
        setSelectedBundle(null); // Reset selection
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                bundle={selectedBundle}
                onPaymentSuccess={handlePaymentSuccess}
            />
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Ahorro Inteligente</h1>
                <p className="text-xl text-gray-500 dark:text-gray-400">Encontrá la combinación perfecta para tu viaje a Bariloche</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Ajustá tus preferencias</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium">Presupuesto (USD)</label>
                        <input type="number" id="budget" defaultValue="2000" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="lodgingType" className="block text-sm font-medium">Tipo de Hospedaje</label>
                        <select id="lodgingType" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option>Cualquiera</option>
                            <option>Hotel</option>
                            <option>Cabaña</option>
                            <option>Hostel</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                         <button type="submit" disabled={isLoading} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400">
                            {isLoading ? 'Buscando...' : 'Encontrar Ofertas'}
                        </button>
                    </div>
                </form>
            </div>

            <AnimatePresence>
            {bundles && (
                /* @ts-ignore */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="text-2xl font-bold mb-4">Paquetes Recomendados</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {bundles.map((bundle) => (
                             <div 
                                key={bundle.id}
                                onClick={() => handleSelectBundle(bundle)}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedBundle?.id === bundle.id ? 'border-blue-500 scale-105' : 'border-transparent hover:border-blue-400'}`}
                             >
                                <div className="p-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold">Opción - Valor: <span className="text-blue-500">{bundle.score}/10</span></h3>
                                        <div className="text-2xl font-extrabold text-green-600 dark:text-green-400">${bundle.totalPrice}</div>
                                    </div>
                                    <div className="mt-4 border-t dark:border-gray-700 pt-4">
                                        <h4 className="font-semibold mb-2">¿Por qué lo recomendamos?</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                            {bundle.rationale.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
            {selectedBundle && (
                /* @ts-ignore */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="sticky bottom-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg shadow-2xl max-w-2xl mx-auto"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Paquete Seleccionado</h3>
                            <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">${selectedBundle.totalPrice}</p>
                        </div>
                        <button onClick={handleBookingConfirmation} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105">
                            Confirmar Reserva
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default SmartSaverPage;