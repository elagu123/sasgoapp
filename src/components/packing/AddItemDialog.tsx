import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PackingListItem, PackingCategory } from '../../types.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<PackingListItem, 'id' | 'packed'>) => void;
}

const categories: PackingCategory[] = ['ropa', 'calzado', 'higiene', 'electrónica', 'documentos', 'salud', 'bebé', 'trabajo', 'otros'];

const AddItemDialog: React.FC<Props> = ({ isOpen, onClose, onAddItem }) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [category, setCategory] = useState<PackingCategory>('ropa');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddItem({ name, qty, category });
    setName('');
    setQty(1);
    setCategory('ropa');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* @ts-ignore */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50" />
          {/* @ts-ignore */}
          <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4">Añadir Ítem</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">Nombre</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="qty" className="block text-sm font-medium">Cantidad</label>
                  <input type="number" id="qty" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} min="1" required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium">Categoría</label>
                  <select id="category" value={category} onChange={e => setCategory(e.target.value as PackingCategory)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 capitalize">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Añadir</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddItemDialog;