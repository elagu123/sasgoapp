import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Reservation, ReservationType } from '../../types.ts';

interface AddReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReservation: (data: Omit<Reservation, 'id' | 'tripId'>) => void;
  isSubmitting: boolean;
}

const baseSchema = z.object({
    type: z.enum(['FLIGHT', 'HOTEL', 'CAR_RENTAL', 'OTHER']),
    title: z.string().min(1, 'El título es requerido'),
    startDate: z.string().min(1, 'La fecha de inicio es requerida'),
    endDate: z.string().optional(),
    // Details
    airline: z.string().optional(),
    flightNumber: z.string().optional(),
    departureAirport: z.string().optional(),
    arrivalAirport: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
    pickupLocation: z.string().optional(),
    confirmationCode: z.string().optional(),
    notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof baseSchema>;

const typeOptions: { value: ReservationType; label: string }[] = [
    { value: 'FLIGHT', label: 'Vuelo' },
    { value: 'HOTEL', label: 'Alojamiento' },
    { value: 'CAR_RENTAL', label: 'Alquiler de Auto' },
    { value: 'OTHER', label: 'Otro' },
];

const AddReservationDialog: React.FC<AddReservationDialogProps> = ({ isOpen, onClose, onAddReservation, isSubmitting }) => {
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ReservationFormData>({
        resolver: zodResolver(baseSchema),
        defaultValues: { type: 'FLIGHT' }
    });
    
    const selectedType = watch('type');

    const handleFormSubmit = (data: ReservationFormData) => {
        const { type, title, startDate, endDate, ...details } = data;
        onAddReservation({
            type,
            title,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            details: details,
        });
        if (!isSubmitting) reset();
    };

    const renderDynamicFields = () => {
        switch (selectedType) {
            case 'FLIGHT':
                return <>
                    <input {...register('airline')} placeholder="Aerolínea" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                    <input {...register('flightNumber')} placeholder="Número de Vuelo" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                    <input {...register('departureAirport')} placeholder="Aeropuerto de Salida (ej. EZE)" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                    <input {...register('arrivalAirport')} placeholder="Aeropuerto de Llegada (ej. BRC)" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                </>;
            case 'HOTEL':
                return <input {...register('address')} placeholder="Dirección del Hotel" className="w-full p-2 border rounded-md dark:bg-gray-700" />;
            case 'CAR_RENTAL':
                 return <>
                    <input {...register('company')} placeholder="Compañía de Alquiler" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                    <input {...register('pickupLocation')} placeholder="Lugar de Retiro" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                </>;
            case 'OTHER':
                return <textarea {...register('notes')} placeholder="Notas sobre la reserva..." className="w-full p-2 border rounded-md dark:bg-gray-700" />;
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold mb-4">Añadir Nueva Reserva</h2>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            <select {...register('type')} className="w-full p-2 border rounded-md dark:bg-gray-700">
                                {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            
                            <input {...register('title')} placeholder="Título (ej. Vuelo a Bariloche)" className="w-full p-2 border rounded-md dark:bg-gray-700" />
                            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <input type="datetime-local" {...register('startDate')} className="w-full p-2 border rounded-md dark:bg-gray-700" />
                                <input type="datetime-local" {...register('endDate')} className="w-full p-2 border rounded-md dark:bg-gray-700" />
                            </div>
                            {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}

                            {renderDynamicFields()}
                             <input {...register('confirmationCode')} placeholder="Código de Confirmación" className="w-full p-2 border rounded-md dark:bg-gray-700" />

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-blue-400">
                                    {isSubmitting ? 'Guardando...' : 'Guardar Reserva'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddReservationDialog;
