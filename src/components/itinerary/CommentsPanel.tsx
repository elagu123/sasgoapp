
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CommentThread } from '../../types.ts';
import CommentItem from './CommentItem.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface CommentsPanelProps {
    thread: CommentThread | undefined;
    onClose: () => void;
    onAddComment: (content: string) => void;
    onResolveThread: () => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ thread, onClose, onAddComment, onResolveThread }) => {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [showResolved, setShowResolved] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isResolved = thread?.isResolved || false;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread?.comments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
        }
    };
    
    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-[60] flex flex-col border-l dark:border-gray-700"
        >
            <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <h3 className="font-semibold text-lg">Comentarios</h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
            </header>

            {isResolved && !showResolved && (
                <div className="p-4 text-center bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Este hilo fue resuelto.</p>
                    <button onClick={() => setShowResolved(true)} className="text-sm text-blue-600 hover:underline">Mostrar hilo</button>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(!thread || thread.comments.length === 0) && <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-8">No hay comentarios aún. ¡Sé el primero!</p>}
                {thread && (isResolved ? showResolved : true) && thread.comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold uppercase text-gray-500">Acciones</p>
                    <button onClick={onResolveThread} className={`text-sm font-semibold ${isResolved ? 'text-yellow-600' : 'text-green-600'}`}>
                        {isResolved ? 'Reabrir Hilo' : 'Resolver Hilo'}
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <img src={`https://i.pravatar.cc/150?u=${user?.email}`} alt={user?.name} className="w-8 h-8 rounded-full" />
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribí un comentario..."
                        className="flex-1 p-2 border-transparent bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400" disabled={!newComment.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.546l4.949-1.414a.75.75 0 00.546-.95L8.204 3.105a.75.75 0 00-.95-.816l-4.149.826zM4.443 10.334a.75.75 0 00-.546.95l1.414 4.949a.75.75 0 00.95.546l4.949-1.414a.75.75 0 00.546-.95L6.398 9.384a.75.75 0 00-.95.816l-1.005.134z" /></svg>
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default CommentsPanel;
