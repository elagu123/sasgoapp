

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import type { ActivityCandidate } from '../../types';

interface AddActivityToItineraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityCandidate | null;
  onConfirm: (date: string, time: string) => void;
  tripDates: { start: string; end: string };
}

const AddActivityToItineraryDialog: React.FC<AddActivityToItineraryDialogProps> = ({ isOpen, onClose, activity, onConfirm, tripDates }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            date: tripDates.start,
            time: '10:00',
        }
    });

    React.useEffect(() => {
        if(isOpen) {
            reset({ date: tripDates.start, time: '10:00' });
        }
    }, [isOpen, tripDates.start, reset]);

    const handleFormSubmit = (data: { date: string, time: string }) => {
        onConfirm(data.date, data.time);
    };

    if (!activity) return null;

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
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold mb-2">Añadir al Itinerario</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Elegí cuándo hacer la actividad: <span className="font-semibold">{activity.name}</span></p>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium">Fecha</label>
                                    <input
                                        type="date"
                                        id="date"
                                        {...register('date')}
                                        min={tripDates.start}
                                        max={tripDates.end}
                                        required
                                        className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium">Hora de inicio</label>
                                    <input
                                        type="time"
                                        id="time"
                                        {...register('time')}
                                        required
                                        className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Añadir Actividad</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddActivityToItineraryDialog;