

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Expense, ExpenseCategory } from '../../types.ts';
import { getSmartExpenseSuggestions } from '../../lib/expenseSuggestions.ts';

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'tripId'>) => void;
  onUpdateExpense?: (expense: Expense) => void;
  isSubmitting: boolean;
  initialData?: Expense | null;
  tripData?: {
    destination?: string;
    pace?: string;
    travelers?: number;
    dates?: { start: string; end: string };
  };
}

const expenseSchema = z.object({
    title: z.string().min(1, 'El título es requerido.'),
    // FIX: Removed invalid_type_error as it's not a valid property in the Zod version used, causing a TS error.
    amount: z.number().positive({ message: 'El monto debe ser un número positivo.' }),
    currency: z.enum(['USD', 'ARS', 'EUR']),
    date: z.string().min(1, 'La fecha es requerida.'),
    category: z.enum(['alojamiento', 'comida', 'transporte', 'ocio', 'compras', 'otros']),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const categoryOptions: { value: ExpenseCategory, label: string }[] = [
    { value: 'alojamiento', label: 'Alojamiento' },
    { value: 'comida', label: 'Comida' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'ocio', label: 'Ocio' },
    { value: 'compras', label: 'Compras' },
    { value: 'otros', label: 'Otros' },
];

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ 
    isOpen, 
    onClose, 
    onAddExpense, 
    onUpdateExpense, 
    isSubmitting, 
    initialData,
    tripData 
}) => {
    const isEditing = !!initialData;
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            title: initialData?.title || '',
            amount: initialData ? initialData.amount / 100 : 0, // Convert from cents
            currency: initialData?.currency || 'USD',
            date: initialData?.date || new Date().toISOString().split('T')[0],
            category: initialData?.category || 'comida',
        }
    });

    // Reset form when initialData changes
    React.useEffect(() => {
        if (isOpen) {
            reset({
                title: initialData?.title || '',
                amount: initialData ? initialData.amount / 100 : 0,
                currency: initialData?.currency || 'USD',
                date: initialData?.date || new Date().toISOString().split('T')[0],
                category: initialData?.category || 'comida',
            });
        }
    }, [initialData, isOpen, reset]);

    const handleFormSubmit = (data: ExpenseFormData) => {
        if (isEditing && initialData && onUpdateExpense) {
            onUpdateExpense({
                ...initialData,
                ...data,
                amount: Math.round(data.amount * 100), // Convert to cents
            });
        } else {
            onAddExpense({
                ...data,
                amount: Math.round(data.amount * 100), // Convert to cents
            });
        }
        reset();
    };

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
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? '✏️ Editar Gasto' : '➕ Añadir Nuevo Gasto'}
                        </h2>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium">Descripción</label>
                                <input {...register('title')} id="title" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium">Monto</label>
                                    <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} id="amount" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium">Moneda</label>
                                    <select {...register('currency')} id="currency" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option value="USD">USD</option>
                                        <option value="ARS">ARS</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium">Categoría</label>
                                    <select {...register('category')} id="category" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium">Fecha</label>
                                    <input type="date" {...register('date')} id="date" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400">
                                    {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Gasto' : 'Guardar Gasto')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddExpenseDialog;