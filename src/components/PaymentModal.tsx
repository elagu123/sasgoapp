import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    bundle: any;
    onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, bundle, onPaymentSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            onPaymentSuccess();
        }, 2000);
    };

    if (!bundle) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* @ts-ignore */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    {/* @ts-ignore */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold mb-2">Confirmar Reserva</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Total a pagar: <span className="font-bold text-green-600 dark:text-green-400">${bundle.totalPrice} USD</span></p>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Número de Tarjeta (simulado)</label>
                                <input type="text" placeholder="**** **** **** 4242" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={isProcessing}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="MM/YY" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={isProcessing}/>
                                <input type="text" placeholder="CVC" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={isProcessing}/>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} disabled={isProcessing} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                                <button type="submit" disabled={isProcessing} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400">
                                    {isProcessing ? 'Procesando...' : `Pagar $${bundle.totalPrice}`}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;