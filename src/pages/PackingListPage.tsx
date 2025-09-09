import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { useToast } from '../hooks/useToast.ts';
import type { PackingListItem, PackingCategory } from '../types.ts';
import PackingToolbar from '../components/packing/PackingToolbar.tsx';
import PackingListDnD from '../components/packing/PackingListDnD.tsx';
import AddItemDialog from '../components/packing/AddItemDialog.tsx';
import ConflictDialog from '../components/ConflictDialog.tsx';
import { savePdfToCache, getPdfFromCache } from '../services/packingPdfCache.ts';
import { getPackingListPdf, getTrip } from '../services/api.ts';
import { PDFService } from '../services/pdfService.ts';
import { usePackingList } from '../hooks/usePackingList.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

const PackingListPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const packingId = id!;
    const isOnline = useOnlineStatus();
    
    const { addToast } = useToast();
    const { 
        list, 
        isLoading, 
        error,
        addItem,
        updateItem,
        removeItem,
        reorderItems,
    } = usePackingList(packingId);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<PackingCategory[]>([]);
    const [packedFilter, setPackedFilter] = useState<'todos' | 'pendientes' | 'empacados'>('todos');

    const [isAddOpen, setAddOpen] = useState(false);
    // Conflict state would be managed via mutation's onError callback if needed
    const [conflict, setConflict] = useState(null);

    const handleItemUpdate = (itemId: string, fields: Partial<Omit<PackingListItem, 'id'>>) => {
        updateItem.mutate({ itemId, fields });
    };
    
    const handleReorder = (itemIds: string[]) => {
        reorderItems.mutate({ itemIds });
    };

    const handleAddItem = (item: Omit<PackingListItem, 'id' | 'packed'>) => {
        const newItem: Omit<PackingListItem, 'id'> = { ...item, packed: false };
        addItem.mutate({ item: newItem });
        setAddOpen(false);
    };

    const handleDuplicateItem = (itemId: string) => {
        const item = list?.items.find(i => i.id === itemId);
        if (item) {
            const newItem: Omit<PackingListItem, 'id'> = { ...item, name: `${item.name} (copia)`, packed: false };
            addItem.mutate({ item: newItem });
            addToast(`'${item.name}' duplicado.`, 'success');
        }
    };

    const handleRemoveItem = (itemId: string) => {
        removeItem.mutate({ itemId });
    };

    const handleApplyTemplate = async (templateKey: string) => {
        addToast('Plantillas no implementadas en backend aún.', 'info');
    };

    const handleExportPdf = async () => {
        if (!list) {
            addToast('No se puede exportar: lista no cargada', 'error');
            return;
        }

        addToast('Generando PDF...', 'info');
        
        try {
            // Try to get trip data for enhanced PDF
            let tripData = null;
            if (list.tripId) {
                try {
                    tripData = await getTrip(list.tripId);
                } catch (error) {
                    console.warn('Could not load trip data for PDF:', error);
                }
            }

            // Use new PDF service or fallback to backend
            if (tripData) {
                await PDFService.generatePackingListPDF(list, tripData);
                addToast('PDF generado exitosamente', 'success');
            } else if (isOnline) {
                // Fallback to backend PDF generation
                const cachedPdf = await getPdfFromCache(packingId);
                if (cachedPdf) {
                    const url = URL.createObjectURL(cachedPdf.blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = cachedPdf.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    addToast('PDF descargado desde caché', 'success');
                    return;
                }

                const { blob, filename } = await getPackingListPdf(packingId);
                await savePdfToCache(packingId, blob);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                addToast('PDF descargado exitosamente', 'success');
            } else {
                addToast('PDF no disponible offline sin datos de viaje', 'error');
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            addToast('Error al generar el PDF', 'error');
        }
    };

    const handleConflictResolve = (resolvedItem: PackingListItem) => {
        // handleItemUpdate(resolvedItem.id, resolvedItem);
        // setConflict(null);
    };
    
    const filteredItems = useMemo(() => {
        if (!list) return [];
        return list.items.filter(item => {
            const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = categoryFilter.length === 0 || categoryFilter.includes(item.category);
            const packedMatch = packedFilter === 'todos' || (packedFilter === 'empacados' && item.packed) || (packedFilter === 'pendientes' && !item.packed);
            return searchMatch && categoryMatch && packedMatch;
        });
    }, [list, searchTerm, categoryFilter, packedFilter]);

    if (isLoading) return <div className="text-center p-8">Cargando lista...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error.message}</div>;
    if (!list) return <div className="text-center p-8">Lista no encontrada.</div>;

    const progress = list.items.length > 0 ? (list.items.filter(i => i.packed).length / list.items.length) * 100 : 0;
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <ConflictDialog
                isOpen={!!conflict}
                onClose={() => setConflict(null)}
                entityType="ítem de empaque"
                localData={conflict as any}
                remoteData={conflict as any}
                onResolve={handleConflictResolve}
            />
            <AddItemDialog
                isOpen={isAddOpen}
                onClose={() => setAddOpen(false)}
                onAddItem={handleAddItem}
            />

            <header className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{list.title}</h1>
                        <Link to={`/app/trips/${list.tripId}`} className="text-lg text-gray-600 dark:text-gray-400 hover:underline">Volver al viaje</Link>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progreso</span>
                        <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </header>

            <PackingToolbar
                onSearch={setSearchTerm}
                onCategoryFilter={setCategoryFilter}
                onPackedFilter={setPackedFilter}
                onAddItem={() => setAddOpen(true)}
                onApplyTemplate={handleApplyTemplate}
                onExportPdf={handleExportPdf}
            />

            <PackingListDnD
                items={filteredItems}
                onUpdate={handleItemUpdate}
                onReorder={handleReorder}
                onRemove={handleRemoveItem}
                onDuplicate={handleDuplicateItem}
            />
        </div>
    );
};

export default PackingListPage;