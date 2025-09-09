

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ItineraryBlock, BlockType, Category, HHMM, Comment } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { trackEvent } from '../../lib/telemetry.js';
import { sanitize } from '../../lib/sanitize.ts';
import { isHHMM, durationMin, hasConflicts, conflictMessage } from '../../lib/itinerary-time.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockCardProps {
  itineraryId: string;
  block: ItineraryBlock;
  dayBlocks: ItineraryBlock[];
  comments: Comment[];
  isResolved: boolean;
  onSave: (blockId: string, updates: Partial<ItineraryBlock>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onSelectCommentBlock: (blockId: string) => void;
  isRecentlyUpdated?: boolean;
  locale?: "es-AR" | "en-US";
}

const blockTypeOptions: BlockType[] = ['activity', 'meal', 'transfer', 'hotel', 'break'];
const categoryOptions: Category[] = ['sightseeing', 'food', 'culture', 'shopping', 'outdoors', 'nightlife', 'rest'];

const categoryIcons: Record<string, string> = {
    food: '🍴', sightseeing: '🏞️', culture: '🏛️', shopping: '🛍️',
    outdoors: '🌲', nightlife: '🍸', transfer: '🚗', hotel: '🏨',
    break: '☕', rest: '🛌',
};

const AutosaveIndicator: React.FC<{saving: boolean}> = ({ saving }) => (
    saving ? <div className="text-xs italic text-gray-500 flex items-center gap-1">
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Guardando...
    </div> : null
);

const CommentIndicator: React.FC<{ count: number; onClick: (e: React.MouseEvent) => void }> = ({ count, onClick }) => {
    if (count === 0) return null;
    return (
        <button onClick={onClick} className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.839 8.839 0 01-4.082-.973l-1.424 1.423a.5.5 0 01-.707-.707l1.424-1.423A8.962 8.962 0 011 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.5 9a.5.5 0 000 1h7a.5.5 0 000-1h-7zm0 2.5a.5.5 0 000 1h4a.5.5 0 000-1h-4z" clipRule="evenodd" /></svg>
            <span className="font-semibold">{count}</span>
        </button>
    )
}

const BlockCard: React.FC<BlockCardProps> = ({ itineraryId, block, dayBlocks, comments, isResolved, onSave, onDelete, onDuplicate, onSelectCommentBlock, isRecentlyUpdated, locale }) => {
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<ItineraryBlock>({ ...block });
    const [saving, setSaving] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 100 : 'auto',
    };

    const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(block), [draft, block]);
    const effectiveLocale = locale || 'es-AR';
    const timeError = useMemo(() => {
        if (draft.startTime && !isHHMM(draft.startTime)) return "Hora inicio inválida (HH:MM).";
        if (draft.endTime && !isHHMM(draft.endTime)) return "Hora fin inválida (HH:MM).";
        if (draft.startTime && draft.endTime) {
            const d = durationMin(draft.startTime, draft.endTime);
            if (d === null) return "El fin no puede ser antes que el inicio.";
            if (d === 0) return "La hora de fin debe ser posterior a la de inicio.";
        }
        return null;
    }, [draft.startTime, draft.endTime]);

    const handleSave = useCallback((source: "manual" | "autosave") => {
        if (!dirty || timeError) return;
        const conflictCheck = hasConflicts(dayBlocks, draft, block.id);
        if (conflictCheck.conflict) {
            if (source === 'manual') addToast(conflictMessage(conflictCheck.with, effectiveLocale), 'error');
            return;
        }
        const fields = { title: draft.title, description: draft.description, startTime: draft.startTime, endTime: draft.endTime, durationMin: durationMin(draft.startTime, draft.endTime) ?? undefined, category: draft.category, type: draft.type };
        setSaving(true);
        onSave(block.id, fields);
        if (source === "manual") setIsEditing(false);
        setTimeout(() => setSaving(false), 1000);
    }, [dirty, timeError, addToast, block.id, dayBlocks, draft, effectiveLocale, onSave]);

    useEffect(() => {
        if (isEditing && dirty && !timeError) {
            const timer = setTimeout(() => handleSave("autosave"), 700);
            return () => clearTimeout(timer);
        }
    }, [isEditing, dirty, timeError, handleSave]);

    const handleFieldChange = (field: keyof ItineraryBlock, value: any) => setDraft(prev => ({ ...prev, [field]: value }));
    const handleCancel = (e: React.MouseEvent) => { e.stopPropagation(); setDraft(block); setIsEditing(false); };
    const handleRemove = () => { if (window.confirm(`¿Eliminar "${block.title}"?`)) onDelete(block.id); };

    const icon = categoryIcons[draft.category || draft.type] || '📌';
    const inputClass = "w-full p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 bg-white";

    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} role="listitem">
                <form onSubmit={(e) => { e.preventDefault(); handleSave("manual"); }} className="mb-6 relative">
                    <div className="absolute -left-[3.2rem] top-1 w-10 text-right space-y-1">
                       <input type="time" name="startTime" value={draft.startTime} onChange={e => handleFieldChange('startTime', e.target.value)} className="font-bold text-sm w-full bg-transparent border-b dark:border-gray-600 focus:outline-none focus:border-blue-500" />
                       <input type="time" name="endTime" value={draft.endTime} onChange={e => handleFieldChange('endTime', e.target.value)} className="text-xs w-full bg-transparent border-b dark:border-gray-600 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="absolute -left-[1.35rem] top-1.5 w-6 h-6 bg-blue-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-sm">{icon}</div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg ml-4 space-y-3 ring-2 ring-blue-500/50">
                        <input type="text" name="title" value={draft.title} onChange={e => handleFieldChange('title', e.target.value)} className={`${inputClass} font-semibold`} required />
                        <textarea name="description" value={draft.description} onChange={e => handleFieldChange('description', e.target.value)} className={`${inputClass} text-sm`} rows={2} />
                        <div className="grid grid-cols-2 gap-2">
                            <select name="type" value={draft.type} onChange={e => handleFieldChange('type', e.target.value as BlockType)} className={`${inputClass} capitalize`}>{blockTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                            <select name="category" value={draft.category} onChange={e => handleFieldChange('category', e.target.value as Category)} className={`${inputClass} capitalize`}>{categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                         {timeError && <p className="text-xs text-red-500 dark:text-red-400">{timeError}</p>}
                        <div className="flex items-center justify-between pt-2">
                            <AutosaveIndicator saving={saving && !timeError} />
                            <div className="flex items-center space-x-2">
                                <button type="button" onClick={handleRemove} className="text-xs text-red-500 hover:underline">Eliminar</button>
                                <button type="button" onClick={handleCancel} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600" disabled={saving}>Cancelar</button>
                                <button type="submit" className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white" disabled={saving || !!timeError}>Guardar</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        );
    }
    
    return (
        <div ref={setNodeRef} style={style} className="mb-6 relative group" role="listitem">
            <div className="absolute -left-[3.2rem] top-1 w-10 text-right">
                <p className="font-bold text-gray-800 dark:text-gray-200">{block.startTime}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{block.endTime}</p>
            </div>
            <div {...attributes} {...listeners} className="absolute -left-[1.35rem] top-1.5 w-6 h-6 bg-blue-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-sm cursor-grab touch-none">{icon}</div>
            <div onClick={() => setIsEditing(true)} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg ml-4 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 group-hover:shadow-md relative cursor-pointer">
                <AnimatePresence>
                    {isRecentlyUpdated && <motion.div className="absolute inset-0 rounded-lg ring-3 ring-yellow-400 pointer-events-none" initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 2.5 }} />}
                </AnimatePresence>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }} className="p-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-gray-500 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2-2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg></button>
                    <div className="p-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-gray-500 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></div>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white pr-10">{sanitize(block.title)}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sanitize(block.description)}</p>
                 <CommentIndicator count={isResolved ? 0 : comments.length} onClick={(e) => { e.stopPropagation(); onSelectCommentBlock(block.id); }} />
            </div>
        </div>
    );
};

export default BlockCard;
