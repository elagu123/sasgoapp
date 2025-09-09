import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ItineraryBlock, ItineraryDay, BlockType, Category, HHMM } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { hasConflicts, durationMin } from '../../lib/itinerary-time.ts';

interface AddBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (newBlockData: Omit<ItineraryBlock, 'id'>) => void;
  tripDates: { start: string; end: string };
  itinerary: ItineraryDay[];
}

const blockTypeOptions: BlockType[] = ['activity', 'meal', 'transfer', 'hotel', 'break'];
const categoryOptions: Category[] = ['sightseeing', 'food', 'culture', 'shopping', 'outdoors', 'nightlife', 'rest'];

const AddBlockDialog: React.FC<AddBlockDialogProps> = ({ isOpen, onClose, onAddBlock, tripDates, itinerary }) => {
    const { addToast } = useToast();
    const [newBlock, setNewBlock] = useState<Partial<Omit<ItineraryBlock, 'id'>>>({
        date: tripDates.start,
        type: 'activity',
        category: 'sightseeing',
        startTime: '10:00' as HHMM,
        endTime: '11:00' as HHMM,
    });

    useEffect(() => {
        if(isOpen) {
            setNewBlock({
                date: tripDates.start,
                type: 'activity',
                category: 'sightseeing',
                startTime: '10:00' as HHMM,
                endTime: '11:00' as HHMM,
                title: '',
                description: '',
            });
        }
    }, [isOpen, tripDates.start]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBlock(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBlock.title || !newBlock.date) {
            addToast('El título y la fecha son obligatorios.', 'error');
            return;
        }

        const dayBlocks = itinerary.find(d => d.date === newBlock.date)?.blocks || [];
        const conflict = hasConflicts(dayBlocks, { startTime: newBlock.startTime, endTime: newBlock.endTime });
        if (conflict.conflict) {
            addToast(`El horario se solapa con "${conflict.with?.title}".`, 'error');
            return;
        }
        
        const newDuration = durationMin(newBlock.startTime, newBlock.endTime);
        if (newDuration === null) {
            addToast('La hora de fin debe ser posterior a la de inicio.', 'error');
            return;
        }

        onAddBlock({ ...newBlock, durationMin: newDuration } as Omit<ItineraryBlock, 'id'>);
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
                        <h2 className="text-xl font-bold mb-4">Añadir Bloque al Itinerario</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium">Título</label>
                                <input type="text" name="title" id="title" value={newBlock.title || ''} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium">Descripción</label>
                                <textarea name="description" id="description" value={newBlock.description || ''} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium">Fecha</label>
                                    <input type="date" name="date" id="date" value={newBlock.date} onChange={handleChange} min={tripDates.start} max={tripDates.end} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <div>
                                        <label htmlFor="startTime" className="block text-sm font-medium">Inicio</label>
                                        <input type="time" name="startTime" id="startTime" value={newBlock.startTime} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label htmlFor="endTime" className="block text-sm font-medium">Fin</label>
                                        <input type="time" name="endTime" id="endTime" value={newBlock.endTime} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium">Tipo</label>
                                    <select name="type" id="type" value={newBlock.type} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 capitalize">
                                        {blockTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium">Categoría</label>
                                    <select name="category" id="category" value={newBlock.category} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 capitalize">
                                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Añadir Bloque</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddBlockDialog;