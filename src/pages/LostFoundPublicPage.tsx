import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast.ts';
import { ToastProvider } from '../contexts/ToastContext.tsx';
import { ThemeProvider } from '../contexts/ThemeContext.tsx';
import { MOCK_GEAR } from '../constants.ts';


const LostFoundPublicPageContent: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const { addToast } = useToast();
    const [messageSent, setMessageSent] = useState(false);
    
    // Simulate finding gear by QR code
    const gear = MOCK_GEAR.find(g => g.qrCode === code);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        console.log('TELEMETRY: lostfound_report_submitted', { gearId: gear?.id, qrCode: code });
        addToast('Mensaje enviado al dueño. ¡Gracias!', 'success');
        setMessageSent(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 font-sans">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
                 <div className="text-4xl mb-4">🧳</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Equipaje SAS Travel Encontrado</h1>

                {!gear ? (
                    <p className="mt-4 text-red-600 dark:text-red-400">El código de equipaje no es válido o no se encuentra registrado.</p>
                ) : messageSent ? (
                     <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                        <h2 className="font-semibold text-green-800 dark:text-green-200">¡Misión Cumplida!</h2>
                        <p className="text-sm text-green-700 dark:text-green-300">El dueño ha sido notificado. Gracias por tu buena acción.</p>
                    </div>
                ) : (
                    <>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            ¡Gracias por encontrar este equipaje! Por favor, dejá un mensaje para que el dueño pueda contactarte. Tu información de contacto no será compartida directamente.
                        </p>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
                             <div>
                                <label htmlFor="message" className="block text-sm font-medium mb-1">Mensaje y forma de contacto</label>
                                <textarea 
                                    id="message" 
                                    name="message" 
                                    rows={4}
                                    required
                                    placeholder="Ej: ¡Hola! Encontré tu valija en el aeropuerto de Ezeiza. Podés llamarme o escribirme al +54 9 11 ... o a miemail@ejemplo.com"
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                Notificar al Dueño
                            </button>
                        </form>
                    </>
                )}
                 <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
                    SAS Go App - Ayudando a los viajeros a reencontrarse con sus pertenencias.
                </p>
            </div>
        </div>
    );
};


// This page is public and needs its own providers
const LostFoundPublicPage: React.FC = () => (
    <ThemeProvider>
        <ToastProvider>
            <LostFoundPublicPageContent />
        </ToastProvider>
    </ThemeProvider>
);

export default LostFoundPublicPage;