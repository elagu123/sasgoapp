import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import PackingWizard from '../components/packing/PackingWizard';
import AdvancedPackingChecklist from '../components/packing/AdvancedPackingChecklist';
import BaggageDistribution from '../components/packing/BaggageDistribution';
import type { PackingListItem, Trip } from '../types';

type ViewMode = 'wizard' | 'checklist' | 'distribution' | 'templates';

const RevolutionaryPackingPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { data: trips } = useTrips();
  
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('checklist');
  const [packingItems, setPackingItems] = useState<PackingListItem[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [isPackingMode, setIsPackingMode] = useState(false);

  useEffect(() => {
    if (tripId && trips) {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        setCurrentTrip(trip);
        // Cargar items existentes si los hay
        if (trip.packingList?.items) {
          setPackingItems(trip.packingList.items);
        }
      }
    }
  }, [tripId, trips]);

  const handleWizardComplete = (generatedItems: PackingListItem[]) => {
    setPackingItems(generatedItems);
    setShowWizard(false);
    setViewMode('checklist');
  };

  const handleItemUpdate = (itemId: string, updates: Partial<PackingListItem>) => {
    setPackingItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleItemAdd = (newItem: Omit<PackingListItem, 'id'>) => {
    const item: PackingListItem = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setPackingItems(prev => [...prev, item]);
  };

  const handleItemDelete = (itemId: string) => {
    setPackingItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleReorder = (oldIndex: number, newIndex: number, category: string) => {
    // Implementar reordenamiento dentro de categoría
    const categoryItems = packingItems.filter(item => item.category === category);
    const otherItems = packingItems.filter(item => item.category !== category);
    
    const reorderedCategoryItems = [...categoryItems];
    const [movedItem] = reorderedCategoryItems.splice(oldIndex, 1);
    reorderedCategoryItems.splice(newIndex, 0, movedItem);
    
    setPackingItems([...otherItems, ...reorderedCategoryItems]);
  };

  const handleItemMove = (itemId: string, fromContainer: string, toContainer: string) => {
    // Para la distribución de equipaje - actualizar metadata del item
    setPackingItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, assignedContainer: toContainer }
          : item
      )
    );
  };

  const handleContainerUpdate = (containerId: string, updates: any) => {
    // Manejar actualizaciones de contenedores
    console.log(`Updating container ${containerId}:`, updates);
  };

  const getProgress = () => {
    if (packingItems.length === 0) return 0;
    const packedItems = packingItems.filter(item => item.packed).length;
    return (packedItems / packingItems.length) * 100;
  };

  const getCriticalItemsProgress = () => {
    const criticalItems = packingItems.filter(item => item.priority === 1);
    if (criticalItems.length === 0) return 100;
    const packedCritical = criticalItems.filter(item => item.packed).length;
    return (packedCritical / criticalItems.length) * 100;
  };

  if (!currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧳</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Viaje no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            El viaje que buscas no existe o no tienes permisos para verlo.
          </p>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const viewModes = [
    { 
      id: 'checklist', 
      label: 'Lista Inteligente', 
      icon: '📋', 
      description: 'Organiza tu equipaje por categorías'
    },
    { 
      id: 'distribution', 
      label: 'Distribución', 
      icon: '🎒', 
      description: 'Optimiza peso entre maletas'
    },
    { 
      id: 'templates', 
      label: 'Plantillas', 
      icon: '📚', 
      description: 'Usa listas predefinidas'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <button 
                  onClick={() => navigate('/app/dashboard')}
                  className="hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Dashboard
                </button>
                <span>›</span>
                <button 
                  onClick={() => navigate(`/app/trips/${currentTrip.id}`)}
                  className="hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {Array.isArray(currentTrip.destination) ? currentTrip.destination[0] : currentTrip.destination}
                </button>
                <span>›</span>
                <span>Equipaje</span>
              </nav>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3">🎒</span>
                Sistema de Equipaje Inteligente
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Planifica, organiza y optimiza tu equipaje con IA
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Progress Overview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center min-w-[120px]">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(getProgress())}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Completado
                </div>
              </div>

              {/* Packing Mode Toggle */}
              <button
                onClick={() => setIsPackingMode(!isPackingMode)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isPackingMode
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {isPackingMode ? '✅ Modo Empaque' : '📝 Modo Planificación'}
              </button>

              {/* Wizard Button */}
              <button
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>🧙‍♂️</span>
                <span>Generar con IA</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6 pb-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Items:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {packingItems.filter(item => item.packed).length}/{packingItems.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Críticos:</span>
              <span className={`font-medium ${getCriticalItemsProgress() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(getCriticalItemsProgress())}%
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Peso est.:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ~{Math.round(packingItems.length * 0.5)}kg
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Viaje en:</span>
              <span className="font-medium text-blue-600">
                {Math.ceil((new Date(currentTrip.startDate || currentTrip.dates?.start || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{mode.icon}</span>
                <div className="text-left">
                  <div>{mode.label}</div>
                  <div className="text-xs opacity-75">{mode.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'checklist' && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdvancedPackingChecklist
                items={packingItems}
                onItemUpdate={handleItemUpdate}
                onItemAdd={handleItemAdd}
                onItemDelete={handleItemDelete}
                onReorder={handleReorder}
                isPackingMode={isPackingMode}
              />
            </motion.div>
          )}

          {viewMode === 'distribution' && (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BaggageDistribution
                items={packingItems}
                onItemMove={handleItemMove}
                onContainerUpdate={handleContainerUpdate}
              />
            </motion.div>
          )}

          {viewMode === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Plantillas de Equipaje
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                Próximamente: biblioteca de plantillas personalizables para diferentes tipos de viaje
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { icon: '🏖️', title: 'Playa/Vacaciones', desc: 'Lista para viajes de relax' },
                  { icon: '🏔️', title: 'Aventura/Trekking', desc: 'Equipamiento outdoor' },
                  { icon: '💼', title: 'Viaje de Negocios', desc: 'Profesional y eficiente' },
                  { icon: '🎒', title: 'Mochilero', desc: 'Minimalista y liviano' },
                  { icon: '❄️', title: 'Destinos Fríos', desc: 'Ropa de abrigo' },
                  { icon: '🌴', title: 'Destinos Tropicales', desc: 'Clima cálido y húmedo' }
                ].map((template, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="text-4xl mb-3">{template.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {template.desc}
                    </p>
                    <button className="mt-4 w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Próximamente
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <PackingWizard
            trip={currentTrip}
            onComplete={handleWizardComplete}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* Empty State */}
      {packingItems.length === 0 && viewMode === 'checklist' && !showWizard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-40"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎒</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Comienza a preparar tu equipaje!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Usa nuestro asistente inteligente para generar una lista personalizada 
              basada en tu destino y actividades.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setShowWizard(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🧙‍♂️ Generar con Asistente IA
              </button>
              <button
                onClick={() => handleItemAdd({
                  name: 'Primer item',
                  qty: 1,
                  category: 'otros',
                  packed: false,
                  priority: 2,
                  autoSuggested: false
                })}
                className="w-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                📝 Crear lista manualmente
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RevolutionaryPackingPage;