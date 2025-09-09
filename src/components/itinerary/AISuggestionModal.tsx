import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ItineraryBlock } from '../../types';

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Omit<ItineraryBlock, 'id' | 'date'> | null;
  onConfirm: () => void;
}

const AISuggestionModal: React.FC<AISuggestionModalProps> = ({ isOpen, onClose, suggestion, onConfirm }) => {
    if (!suggestion) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* @ts-ignore */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    {/* @ts-ignore */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-xl p-6"
                    >
                        <div className="text-center">
                            <div className="text-4xl mb-3">✨</div>
                            <h2 className="text-xl font-bold mb-2">Sugerencia de la IA</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Encontramos una actividad para tu tiempo libre:</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-semibold">{suggestion.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Horario: {suggestion.startTime} - {suggestion.endTime}
                            </p>
                            <p className="text-sm mt-2">{suggestion.description}</p>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Descartar
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Añadir al Itinerario
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AISuggestionModal;