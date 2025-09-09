

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Trip } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tripData: Partial<Trip>, imageFile?: File) => void;
    initialData?: Trip | null;
}

const tripSchema = z.object({
    title: z.string().min(1, 'El título es requerido.').max(80, 'El título es muy largo.'),
    destination: z.string().min(1, 'El destino es requerido.').max(100, 'El destino es muy largo.'),
    startDate: z.string().min(1, 'La fecha de inicio es requerida.'),
    endDate: z.string().min(1, 'La fecha de fin es requerida.'),
    budget: z.string().optional(),
    travelers: z.string().optional(),
    pace: z.enum(['relaxed', 'moderate', 'intense']).optional(),
    description: z.string().max(500, 'La descripción es muy larga.').optional(),
    image: z.instanceof(FileList).optional(),
}).refine(data => data.endDate >= data.startDate, {
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
    path: ['endDate'],
});

type TripFormData = z.infer<typeof tripSchema>;

const TripFormDialog: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
    const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<TripFormData>({
        resolver: zodResolver(tripSchema),
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const watchedImage = watch('image');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    title: initialData.title,
                    destination: initialData.destination.join(', '),
                    startDate: initialData.dates.start,
                    endDate: initialData.dates.end,
                    budget: initialData.budget?.toString() || '',
                    travelers: initialData.travelers?.toString() || '',
                    pace: initialData.pace || 'moderate',
                    description: '',
                });
                setImagePreview(initialData.imageUrl || null);
            } else {
                reset({ 
                    title: '', 
                    destination: '', 
                    startDate: '', 
                    endDate: '',
                    budget: '',
                    travelers: '1',
                    pace: 'moderate',
                    description: '',
                });
                setImagePreview(null);
            }
        }
    }, [initialData, isOpen, reset]);

    useEffect(() => {
        if (watchedImage && watchedImage.length > 0) {
            const file = watchedImage[0];
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [watchedImage]);

    const handleFormSubmit = (data: TripFormData) => {
        const tripData = {
            title: data.title,
            destination: [data.destination],
            dates: { start: data.startDate, end: data.endDate },
            budget: data.budget ? parseFloat(data.budget) : undefined,
            travelers: data.travelers ? parseInt(data.travelers) : 1,
            pace: data.pace || 'moderate',
        };
        const imageFile = data.image && data.image.length > 0 ? data.image[0] : undefined;
        onSave(tripData, imageFile);
        onClose();
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
                        className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {initialData ? '✈️ Editar Viaje' : '🌟 Planear Nuevo Viaje'}
                            </h2>
                            <button 
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                            {/* Trip Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📝 Título del Viaje
                                </label>
                                <input 
                                    type="text" 
                                    id="title" 
                                    {...register('title')} 
                                    placeholder="Ej: Aventura en Europa, Relax en Bali..."
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                {errors.title && <p className="text-sm text-red-500 mt-1 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                    </svg>
                                    {errors.title.message}
                                </p>}
                            </div>

                            {/* Destination */}
                            <div>
                                <label htmlFor="destination" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    🌍 Destino
                                </label>
                                <input 
                                    type="text" 
                                    id="destination" 
                                    {...register('destination')} 
                                    placeholder="Ej: París, Francia; Tokyo, Japón; Barcelona, España"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                {errors.destination && <p className="text-sm text-red-500 mt-1 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                    </svg>
                                    {errors.destination.message}
                                </p>}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        📅 Fecha de Inicio
                                    </label>
                                    <input 
                                        type="date" 
                                        id="startDate" 
                                        {...register('startDate')} 
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        📅 Fecha de Fin
                                    </label>
                                    <input 
                                        type="date" 
                                        id="endDate" 
                                        {...register('endDate')} 
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>}
                                </div>
                            </div>

                            {/* Budget and Travelers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        💰 Presupuesto (opcional)
                                    </label>
                                    <input 
                                        type="number" 
                                        id="budget" 
                                        {...register('budget')} 
                                        placeholder="1500"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="travelers" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        👥 Número de Viajeros
                                    </label>
                                    <input 
                                        type="number" 
                                        id="travelers" 
                                        {...register('travelers')} 
                                        min="1"
                                        max="20"
                                        placeholder="1"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    {errors.travelers && <p className="text-sm text-red-500 mt-1">{errors.travelers.message}</p>}
                                </div>
                            </div>

                            {/* Pace */}
                            <div>
                                <label htmlFor="pace" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    ⚡ Ritmo del Viaje
                                </label>
                                <select 
                                    id="pace" 
                                    {...register('pace')}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="relaxed">🏖️ Relajado - Mucho tiempo libre</option>
                                    <option value="moderate">🚶 Moderado - Balance perfecto</option>
                                    <option value="intense">🏃 Intenso - Acción constante</option>
                                </select>
                                {errors.pace && <p className="text-sm text-red-500 mt-1">{errors.pace.message}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📋 Descripción (opcional)
                                </label>
                                <textarea 
                                    id="description" 
                                    {...register('description')} 
                                    rows={3}
                                    placeholder="Describe tu viaje ideal, actividades que te interesan, tipo de experiencias que buscas..."
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                />
                                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label htmlFor="image" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📸 Imagen del Viaje (opcional)
                                </label>
                                <input 
                                    type="file" 
                                    id="image" 
                                    {...register('image')} 
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                {errors.image && <p className="text-sm text-red-500 mt-1">{errors.image.message}</p>}
                                
                                {imagePreview && (
                                    <div className="mt-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vista previa:</p>
                                        <img 
                                            src={imagePreview} 
                                            alt="Vista previa" 
                                            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
                                >
                                    {initialData ? '✏️ Actualizar Viaje' : '🚀 Crear Viaje'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TripFormDialog;