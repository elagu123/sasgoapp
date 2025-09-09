import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getDiffKeys = (local: any, remote: any): string[] => {
    if (!local || !remote) return [];
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    const differingKeys: string[] = [];
    const ignoreKeys = new Set(['id', 'updatedAt', 'lastUpdatedOfflineAt', 'version', 'members']);

    allKeys.forEach(key => {
        if (ignoreKeys.has(key)) return;
        if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
            differingKeys.push(key);
        }
    });
    return differingKeys;
};

const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '---';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
};

interface ConflictDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  localData?: T;
  remoteData?: T;
  onResolve: (resolvedData: T) => void;
}

const ConflictDialog = <T extends { id?: string }>({ isOpen, onClose, entityType, localData, remoteData, onResolve }: ConflictDialogProps<T>) => {
    const diffKeys = useMemo(() => getDiffKeys(localData, remoteData), [localData, remoteData]);

    if (!localData || !remoteData) return null;

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
                        className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold mb-2">Conflicto de Datos Detectado</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Mientras editabas, alguien más actualizó este {entityType}. Por favor, elegí qué versión querés conservar.
                        </p>
                        
                        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-h-80">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Campo</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tu Versión (Local)</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Versión del Servidor</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {diffKeys.map(key => (
                                        <tr key={key}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{key}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-red-50 dark:bg-red-900/20 font-mono"><pre className="whitespace-pre-wrap text-xs">{formatValue((localData as any)[key])}</pre></td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-green-50 dark:bg-green-900/20 font-mono"><pre className="whitespace-pre-wrap text-xs">{formatValue((remoteData as any)[key])}</pre></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                            <button onClick={() => onResolve(localData)} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                                Mantener mi versión
                            </button>
                            <button onClick={() => onResolve(remoteData)} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500">
                                Usar versión del servidor
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConflictDialog;