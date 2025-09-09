import React, { useState, useEffect } from 'react';
import type { PackingListItem, PackingCategory } from '../../types.ts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  item: PackingListItem;
  onUpdate: (id: string, fields: Partial<Omit<PackingListItem, 'id'>>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const categories: PackingCategory[] = ['ropa', 'calzado', 'higiene', 'electrónica', 'documentos', 'salud', 'bebé', 'trabajo', 'otros'];

const ItemRow: React.FC<Props> = React.memo(({ item, onUpdate, onRemove, onDuplicate }) => {
    const [draft, setDraft] = useState(item);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const dirty = JSON.stringify(draft) !== JSON.stringify(item);

    useEffect(() => setDraft(item), [item]);
    
    // Autosave on blur or after a delay
    useEffect(() => {
        if (dirty) {
            const timer = setTimeout(() => {
                const { id, lastUpdatedOfflineAt, ...fields } = draft;
                onUpdate(item.id, fields);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [draft, dirty, item.id, onUpdate]);

    const handleFieldChange = (field: keyof PackingListItem, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const handleQtyChange = (delta: number) => {
        const newQty = Math.max(0, draft.qty + delta);
        setDraft(prev => ({ ...prev, qty: newQty }));
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <li ref={setNodeRef} style={style} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm" role="listitem">
            <button {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8a1 1 0 11-2 0 1 1 0 012 0zm0 5a1 1 0 11-2 0 1 1 0 012 0zm5-5a1 1 0 100-2 1 1 0 000 2zm0 5a1 1 0 100-2 1 1 0 000 2zm5-5a1 1 0 100-2 1 1 0 000 2zm0 5a1 1 0 100-2 1 1 0 000 2z" /></svg>
            </button>
            <input
                type="checkbox"
                checked={draft.packed}
                onChange={e => onUpdate(item.id, { packed: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
                <input
                    type="text"
                    value={draft.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    className={`w-full bg-transparent focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded p-1 ${draft.packed ? 'line-through text-gray-500' : ''}`}
                />
                 <input
                    type="text"
                    value={draft.notes || ''}
                    onChange={e => handleFieldChange('notes', e.target.value)}
                    placeholder="Notas..."
                    className="w-full bg-transparent text-xs text-gray-500 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded p-1"
                />
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => handleQtyChange(-1)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600">-</button>
                <span>{draft.qty}</span>
                <button onClick={() => handleQtyChange(1)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600">+</button>
            </div>
            <select
                value={draft.category}
                onChange={e => handleFieldChange('category', e.target.value)}
                className="capitalize bg-transparent border-none focus:ring-0 text-sm text-gray-500 dark:bg-gray-800"
            >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
             <div className="flex items-center">
                 <button onClick={() => onDuplicate(item.id)} className="p-1 text-gray-400 hover:text-blue-500" aria-label="Duplicar ítem">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                 </button>
                 <button onClick={() => onRemove(item.id)} className="p-1 text-gray-400 hover:text-red-500" aria-label="Eliminar ítem">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                 </button>
             </div>
        </li>
    );
});

export default ItemRow;