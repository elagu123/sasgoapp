


import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../hooks/useToast.ts';
import { useTripContext } from '../contexts/TripContext.tsx';
import ShareModal from '../components/ShareModal.tsx';
import { getItineraryPdf, createPackingList, getPackingList } from '../services/api.ts';
import { PDFService } from '../services/pdfService.ts';
import { trackEvent } from '../lib/telemetry.js';
import { sanitize } from '../lib/sanitize.ts';
import type { ItineraryDay, Trip, ItineraryBlock, PackingListItem, PackingCategory, WeatherForecastDay, CommentThread } from '../types.ts';
import ItineraryTimeline from '../components/itinerary/ItineraryTimeline.tsx';
import AddBlockDialog from '../components/itinerary/AddBlockDialog.tsx';
import TripCalendar from '../components/itinerary/TripCalendar.tsx';
import ConflictDialog from '../components/ConflictDialog.tsx';
import CollaboratorAvatars from '../components/CollaboratorAvatars.tsx';
import { savePdfToCache, getPdfFromCache } from '../services/itineraryPdfCache.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { useTrips } from '../hooks/useTrips.ts';
import { useTrip } from '../hooks/useTrip.ts';
import { v4 as uuidv4 } from 'uuid';
import { generateItineraryFromAI, generatePackingListFromAI, getWeatherForecast, suggestActivityForGap } from '../services/geminiService.ts';
import AISuggestionModal from '../components/itinerary/AISuggestionModal.tsx';
import ThemeToggle from '../components/ThemeToggle.tsx';
import WeatherForecast from '../components/itinerary/WeatherForecast.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSharedItinerary } from '../hooks/useSharedItinerary.ts';
import type { DragEndEvent } from '@dnd-kit/core';
import LiveCursorsOverlay from '../components/LiveCursorsOverlay.tsx';
import CommentsPanel from '../components/itinerary/CommentsPanel.tsx';

// --- Lazy Load Tab Components for Performance ---
const OptimizeTab = React.lazy(() => import('../components/optimization/OptimizeTab.tsx'));
const ExpensesTab = React.lazy(() => import('../components/budget/ExpensesTab.tsx'));
const ReservationsTab = React.lazy(() => import('../components/reservations/ReservationsTab.tsx'));
const AccommodationsTab = React.lazy(() => import('../components/accommodations/AccommodationsTab.tsx'));
const ActivitiesTab = React.lazy(() => import('../components/activities/ActivitiesTab.tsx'));
const DocumentsTab = React.lazy(() => import('../components/documents/DocumentsTab.tsx'));
const MapTab = React.lazy(() => import('../components/maps/MapTab.tsx'));


const tabs = [
    { id: 'itinerary', label: 'Itinerario' },
    { id: 'optimize', label: '✨ Optimizar' },
    { id: 'map', label: 'Mapa' },
    { id: 'activities', label: 'Actividades' },
    { id: 'accommodations', label: 'Alojamientos' },
    { id: 'reservations', label: 'Reservas' },
    { id: 'packing', label: 'Equipaje' },
    { id: 'documents', label: 'Documentos' },
    { id: 'budget', label: 'Gastos' },
    { id: 'saver', label: 'Ahorro' },
];

const TripOverviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const tripId = id!;
    
    const [activeTab, setActiveTab] = useState('itinerary');
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    
    const { user } = useAuth();
    const { addToast } = useToast();
    const { setTrip: setTripContext } = useTripContext();
    
    const { data: trip, isLoading, refetch } = useTrip(tripId);
    const { updateTrip } = useTrips();

    const { awareUsers } = useSharedItinerary(tripId, trip?.itinerary || []);
    
    const [tripConflict, setTripConflict] = useState<{ local: Trip, remote: Trip } | null>(null);
    
    // --- Refs and logic for accessible tabs ---
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const tabPanelRef = useRef<HTMLDivElement>(null);

    const handleTabKeyDown = (e: React.KeyboardEvent) => {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        let nextIndex;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else {
            return;
        }
        
        const nextTab = tabs[nextIndex];
        setActiveTab(nextTab.id);
        tabRefs.current[nextIndex]?.focus();
    };

    useEffect(() => {
        // When a new tab becomes active, focus its panel for screen readers
        const timer = setTimeout(() => tabPanelRef.current?.focus(), 100);
        return () => clearTimeout(timer);
    }, [activeTab]);


    useEffect(() => {
        if (trip) {
            setTripContext(trip);
        }
        return () => setTripContext(null);
    }, [trip, setTripContext]);

    const handleUpdateTrip = useCallback((updates: Partial<Trip>, track = true) => {
        if (!trip) return;
        const localTrip = { ...trip, ...updates }; 
        updateTrip.mutate({ ...updates, id: trip.id, version: trip.version }, {
            onSuccess: () => refetch(),
            onError: (error: any) => {
                if (error.status === 409 && error.body.remote) {
                    setTripConflict({ local: localTrip, remote: error.body.remote });
                    addToast('Conflicto de datos: otro usuario guardó cambios.', 'error');
                }
            }
        });
        if(track) trackEvent('trip_updated', { tripId, fields: Object.keys(updates) });
    }, [trip, tripId, updateTrip, refetch, addToast]);
    
    const handleTripConflictResolve = (resolvedTrip: Trip) => {
        updateTrip.mutate({ ...resolvedTrip, version: tripConflict?.remote.version }, {
            onSuccess: () => {
                setTripConflict(null);
                addToast('Conflicto resuelto. Datos actualizados.', 'success');
                refetch();
            },
            onError: () => addToast('No se pudo resolver el conflicto. Intenta de nuevo.', 'error')
        });
    };

    const handleExportItineraryPdf = async () => {
        addToast('Generando PDF del itinerario...', 'info');
        try {
            await PDFService.generateItineraryPDF(trip);
            addToast('PDF del itinerario generado exitosamente', 'success');
        } catch (error) {
            console.error('Error exporting itinerary PDF:', error);
            addToast('Error al generar el PDF del itinerario', 'error');
        }
    };

    const handleExportTripSummaryPdf = async () => {
        addToast('Generando PDF completo del viaje...', 'info');
        try {
            let packingList = null;
            if (trip.packingListId) {
                try {
                    packingList = await getPackingList(trip.packingListId);
                } catch (error) {
                    console.warn('Could not load packing list for PDF:', error);
                }
            }
            
            await PDFService.generateTripSummaryPDF(trip, packingList);
            addToast('PDF completo del viaje generado exitosamente', 'success');
        } catch (error) {
            console.error('Error exporting trip summary PDF:', error);
            addToast('Error al generar el PDF del viaje', 'error');
        }
    };

    if (isLoading) return <div>Cargando viaje...</div>;
    if (!trip) return <div>Viaje no encontrado.</div>;

    const renderTabContent = (tabId: string) => {
        switch (tabId) {
            case 'itinerary': return <ItineraryTab trip={trip} />;
            case 'optimize': return <OptimizeTab trip={trip} />;
            case 'map': return <MapTab trip={trip} />;
            case 'activities': return <ActivitiesTab trip={trip} onUpdateTrip={handleUpdateTrip} />;
            case 'accommodations': return <AccommodationsTab trip={trip} onUpdateTrip={handleUpdateTrip} />;
            case 'reservations': return <ReservationsTab trip={trip} />;
            case 'packing': return <PackingTab trip={trip} onUpdateTrip={handleUpdateTrip} />;
            case 'documents': return <DocumentsTab trip={trip} />;
            case 'budget': return <ExpensesTab trip={trip} />;
            case 'saver': return <SmartSaverTab tripId={trip.id} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <LiveCursorsOverlay awareUsers={awareUsers} />
            <ConflictDialog<Trip>
                isOpen={!!tripConflict}
                onClose={() => setTripConflict(null)}
                entityType="viaje"
                localData={tripConflict?.local}
                remoteData={tripConflict?.remote}
                onResolve={handleTripConflictResolve}
            />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} trip={trip} />
            <header className="mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{sanitize(trip.title)}</h1>
                            <p className="text-xl text-gray-500 dark:text-gray-400">{sanitize(trip.destination.join(', '))}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <CollaboratorAvatars members={trip.members} awareUsers={awareUsers} />
                            <div className="relative group">
                                <button className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors">
                                    📄 Exportar
                                </button>
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    <div className="py-2">
                                        <button 
                                            onClick={handleExportItineraryPdf}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            📅 PDF del Itinerario
                                        </button>
                                        <button 
                                            onClick={handleExportTripSummaryPdf}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            📋 PDF Completo del Viaje
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShareModalOpen(true)} className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">
                                Compartir
                            </button>
                            <ThemeToggle />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
                        <span>📅 {trip.dates.start} - {trip.dates.end}</span>
                        <span>👥 {trip.travelers} viajeros</span>
                        <span className="capitalize">🏃 {trip.pace}</span>
                    </div>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md mb-6">
                <div role="tablist" aria-label="Navegación del viaje" onKeyDown={handleTabKeyDown} className="flex space-x-2 overflow-x-auto">
                    {tabs.map((tab, index) => (
                        <button
                          key={tab.id}
                          // FIX: The ref callback should not return a value. Encapsulating the assignment in a block ensures a void return.
                          ref={el => { tabRefs.current[index] = el; }}
                          id={`trip-tab-${tab.id}`}
                          role="tab"
                          aria-selected={activeTab === tab.id}
                          aria-controls={`trip-tabpanel-${tab.id}`}
                          tabIndex={activeTab === tab.id ? 0 : -1}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                          {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main>
                <Suspense fallback={<div className="text-center p-8">Cargando...</div>}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            ref={tabPanelRef}
                            id={`trip-tabpanel-${activeTab}`}
                            role="tabpanel"
                            tabIndex={-1}
                            aria-labelledby={`trip-tab-${activeTab}`}
                            className="outline-none" // Remove focus ring from panel itself
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderTabContent(activeTab)}
                        </motion.div>
                    </AnimatePresence>
                </Suspense>
            </main>
        </div>
    );
};

interface ItineraryTabProps { trip: Trip; }

const UndoIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const RedoIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const ItineraryTab: React.FC<ItineraryTabProps> = ({ trip }) => {
    const { 
        itinerary, setItinerary, addBlock, updateBlock, deleteBlock, reorderBlocks, recentlyUpdatedBlockId, 
        undo, redo, canUndo, canRedo, awareness, commentThreads, addComment, toggleCommentThreadResolved 
    } = useSharedItinerary(trip.id, trip.itinerary || []);

    const { addToast } = useToast();
    const [isAddBlockOpen, setAddBlockOpen] = useState(false);
    const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [currentSuggestion, setCurrentSuggestion] = useState<{ day: ItineraryDay, suggestion: Omit<ItineraryBlock, 'id' | 'date'> } | null>(null);
    const [weatherForecast, setWeatherForecast] = useState<WeatherForecastDay[] | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(true);
    const itineraryContainerRef = useRef<HTMLDivElement>(null);
    const [selectedCommentBlockId, setSelectedCommentBlockId] = useState<string | null>(null);

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') { e.preventDefault(); if (canUndo) undo(); }
                if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) { e.preventDefault(); if (canRedo) redo(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo]);

    // Fetch Weather
    useEffect(() => {
        setIsLoadingWeather(true);
        getWeatherForecast(trip.destination[0], trip.dates.start, trip.dates.end)
            .then(setWeatherForecast)
            .finally(() => setIsLoadingWeather(false));
    }, [trip.destination, trip.dates.start, trip.dates.end]);

    const handleGenItinerary = async () => {
        addToast('Generando itinerario con IA...', 'info');
        const aiItinerary = await generateItineraryFromAI(trip);
        setItinerary(aiItinerary);
        addToast('Itinerario generado con éxito.', 'success');
        trackEvent('itinerary_generated_by_ai', { tripId: trip.id });
    };

    const handleAddBlock = (newBlockData: Omit<ItineraryBlock, 'id'>) => {
        addBlock(newBlockData);
        setAddBlockOpen(false);
        addToast('Bloque añadido.', 'success');
    };

    const handleSuggestActivity = async (day: ItineraryDay, gap: any) => {
        addToast('Buscando sugerencias con IA...', 'info');
        const suggestion = await suggestActivityForGap(trip, day, gap);
        setCurrentSuggestion({ day, suggestion });
        setSuggestionModalOpen(true);
    };

    const handleConfirmSuggestion = () => {
        if (currentSuggestion) {
            addBlock({ ...currentSuggestion.suggestion, date: currentSuggestion.day.date });
            setSuggestionModalOpen(false);
            setCurrentSuggestion(null);
            addToast('Actividad sugerida añadida.', 'success');
        }
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const dayOfDraggedItem = itinerary.find(d => d.blocks.some(b => b.id === active.id));
            const dayOfDropTarget = itinerary.find(d => d.blocks.some(b => b.id === over.id));

            if (dayOfDraggedItem && dayOfDropTarget && dayOfDraggedItem.date === dayOfDropTarget.date) {
                const oldIndex = dayOfDraggedItem.blocks.findIndex(b => b.id === active.id);
                const newIndex = dayOfDropTarget.blocks.findIndex(b => b.id === over.id);
                reorderBlocks(dayOfDraggedItem.date, oldIndex, newIndex);
            } else {
                addToast("Solo se pueden reordenar bloques dentro del mismo día.", "error");
            }
        }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (awareness && itineraryContainerRef.current) {
            const bounds = itineraryContainerRef.current.getBoundingClientRect();
            awareness.setLocalStateField('cursor', {
                x: e.clientX,
                y: e.clientY
            });
             awareness.setLocalStateField('editingBlock', null); // Reset editing indicator on move
        }
    }, [awareness]);

    const handleMouseLeave = useCallback(() => {
        if (awareness) {
            awareness.setLocalStateField('cursor', null);
        }
    }, [awareness]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            <AddBlockDialog isOpen={isAddBlockOpen} onClose={() => setAddBlockOpen(false)} onAddBlock={handleAddBlock} tripDates={trip.dates} itinerary={itinerary} />
            <AISuggestionModal isOpen={isSuggestionModalOpen} onClose={() => setSuggestionModalOpen(false)} suggestion={currentSuggestion?.suggestion || null} onConfirm={handleConfirmSuggestion} />
            
            <AnimatePresence>
                {selectedCommentBlockId && (
                    <CommentsPanel 
                        key="comments-panel"
                        thread={commentThreads.get(selectedCommentBlockId)}
                        onClose={() => setSelectedCommentBlockId(null)} 
                        onAddComment={(content) => addComment(selectedCommentBlockId, content)}
                        onResolveThread={() => toggleCommentThreadResolved(selectedCommentBlockId)}
                    />
                )}
            </AnimatePresence>
            
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                    <h2 className="text-xl font-bold">Plan del Viaje</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={undo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Deshacer"><UndoIcon/></button>
                        <button onClick={redo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Rehacer"><RedoIcon/></button>
                        <button onClick={handleGenItinerary} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">✨ Generar con IA</button>
                        <button onClick={() => setAddBlockOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">+ Añadir Bloque</button>
                    </div>
                </div>
                
                <div 
                    ref={itineraryContainerRef} 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative h-[calc(100vh-25rem)] overflow-y-auto pr-2"
                >
                    {itinerary.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500">El itinerario está vacío.</p>
                            <p className="text-sm">Usá IA para empezar o añadí un bloque manualmente.</p>
                        </div>
                    ) : (
                        <ItineraryTimeline 
                            itineraryId={trip.id}
                            days={itinerary} 
                            commentThreads={commentThreads}
                            onSaveBlock={updateBlock}
                            onDeleteBlock={deleteBlock}
                            onDuplicateBlock={(id) => addBlock(itinerary.flatMap(d => d.blocks).find(b => b.id === id)!)}
                            onSuggestActivity={handleSuggestActivity}
                            onSelectCommentBlock={setSelectedCommentBlockId}
                            recentlyUpdatedBlock={recentlyUpdatedBlockId}
                            onDragEnd={handleDragEnd}
                            containerRef={itineraryContainerRef}
                        />
                    )}
                </div>
            </div>
            <div className="space-y-6">
                <TripCalendar startDate={trip.dates.start} endDate={trip.dates.end} onDateSelect={(date) => document.getElementById(`itinerary-day-${date}`)?.scrollIntoView({ behavior: 'smooth' })} />
                <WeatherForecast isLoading={isLoadingWeather} forecast={weatherForecast} />
            </div>
        </div>
    );
};

const PackingTab: React.FC<{trip: Trip, onUpdateTrip: (updates: Partial<Trip>) => void}> = ({ trip, onUpdateTrip }) => {
    const { addToast } = useToast();

    const handleCreatePackingList = async () => {
        addToast('Creando lista con IA...', 'info');
        // This is a simplified version. A real app might have a dedicated page for AI list creation.
        const listDetails = {
            title: `Lista para ${trip.title}`,
            destination: trip.destination.join(', '),
            dates: trip.dates,
            bagType: 'checked',
            tripType: trip.interests,
            plannedActivities: 'Variado',
            expectedWeather: 'Consultar pronóstico'
        };
        const { items } = await generatePackingListFromAI(listDetails);
        const newItems: Omit<PackingListItem, 'id' | 'packed'>[] = items.map(item => ({...item, category: item.category as PackingCategory}));
        
        try {
            const newList = await createPackingList({ tripId: trip.id, title: listDetails.title, items: newItems});
            onUpdateTrip({ packingListId: newList.id });
            addToast('¡Lista de empaque creada!', 'success');
        } catch(e) {
            addToast('Error al crear la lista de empaque.', 'error');
        }
    };

    if (trip.packingListId) {
        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                 <h2 className="text-xl font-bold mb-4">Lista de Empaque Creada</h2>
                 <p className="mb-4">Ya tenés una lista de empaque para este viaje.</p>
                 <a href={`/#/app/packing/${trip.packingListId}`} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                     Ver mi Lista
                 </a>
             </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold mb-4">Prepará tu Equipaje</h2>
            <p className="mb-4">Aún no tenés una lista de empaque para este viaje.</p>
            <button onClick={handleCreatePackingList} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                ✨ Crear Lista con IA
            </button>
        </div>
    );
};

const SmartSaverTab: React.FC<{tripId: string}> = ({ tripId }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">Ahorro Inteligente</h2>
        <p className="mb-4">Encontrá las mejores combinaciones de vuelos y hoteles.</p>
        <a href={`/#/app/trips/${tripId}/saver`} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            Buscar Ofertas
        </a>
    </div>
);

export default TripOverviewPage;