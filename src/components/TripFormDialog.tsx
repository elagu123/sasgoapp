

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Trip } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tripData: Partial<Trip>) => void;
    initialData?: Trip | null;
}

const tripSchema = z.object({
    title: z.string().min(1, 'El título es requerido.').max(80, 'El título es muy largo.'),
    destination: z.string().min(1, 'El destino es requerido.').max(80, 'El destino es muy largo.'),
    startDate: z.string().min(1, 'La fecha de inicio es requerida.'),
    endDate: z.string().min(1, 'La fecha de fin es requerida.'),
}).refine(data => data.endDate >= data.startDate, {
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
    path: ['endDate'],
});

type TripFormData = z.infer<typeof tripSchema>;

const TripFormDialog: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<TripFormData>({
        resolver: zodResolver(tripSchema),
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    title: initialData.title,
                    destination: initialData.destination.join(', '),
                    startDate: initialData.dates.start,
                    endDate: initialData.dates.end,
                });
            } else {
                reset({ title: '', destination: '', startDate: '', endDate: '' });
            }
        }
    }, [initialData, isOpen, reset]);

    const handleFormSubmit = (data: TripFormData) => {
        const tripData = {
            title: data.title,
            destination: [data.destination],
            dates: { start: data.startDate, end: data.endDate },
        };
        onSave(tripData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* @ts-ignore */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    {/* @ts-ignore */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold mb-4">{initialData ? 'Editar Viaje' : 'Planear Nuevo Viaje'}</h2>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium">Título del Viaje</label>
                                <input type="text" id="title" {...register('title')} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="destination" className="block text-sm font-medium">Destino</label>
                                <input type="text" id="destination" {...register('destination')} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                {errors.destination && <p className="text-sm text-red-500 mt-1">{errors.destination.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium">Fecha de Inicio</label>
                                    <input type="date" id="startDate" {...register('startDate')} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium">Fecha de Fin</label>
                                    <input type="date" id="endDate" {...register('endDate')} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Guardar Viaje</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TripFormDialog;