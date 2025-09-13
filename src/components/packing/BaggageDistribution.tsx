import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PackingListItem } from '../../types';

interface BaggageContainer {
  id: string;
  name: string;
  icon: string;
  maxWeight: number;
  maxVolume: number;
  currentWeight: number;
  currentVolume: number;
  items: PackingListItem[];
  color: string;
  restrictions: string[];
  tips: string[];
}

interface BaggageDistributionProps {
  items: PackingListItem[];
  onItemMove: (itemId: string, fromContainer: string, toContainer: string) => void;
  onContainerUpdate: (containerId: string, updates: Partial<BaggageContainer>) => void;
}

const WEIGHT_ESTIMATES: Record<string, number> = {
  // Ropa (en gramos)
  'camiseta': 200,
  'camisa': 250,
  'pantalón': 400,
  'jean': 600,
  'suéter': 500,
  'abrigo': 800,
  'ropa interior': 50,
  'medias': 30,
  'pijama': 300,
  
  // Calzado
  'zapatillas': 800,
  'zapatos': 600,
  'botas': 1200,
  'sandalias': 300,
  
  // Electrónicos
  'laptop': 2000,
  'tablet': 500,
  'teléfono': 200,
  'cargador': 200,
  'power bank': 400,
  'cámara': 600,
  
  // Higiene
  'shampoo': 300,
  'crema': 100,
  'perfume': 150,
  'cepillo': 50,
  
  // Documentos
  'pasaporte': 50,
  'documentos': 100,
  
  // Default
  'default': 200
};

const estimateItemWeight = (item: PackingListItem): number => {
  const name = item.name.toLowerCase();
  let weight = WEIGHT_ESTIMATES['default'];
  
  // Buscar coincidencias en el nombre
  for (const [key, value] of Object.entries(WEIGHT_ESTIMATES)) {
    if (name.includes(key.toLowerCase())) {
      weight = value;
      break;
    }
  }
  
  return weight * item.qty; // Multiplicar por cantidad
};

const DraggableItem: React.FC<{
  item: PackingListItem;
  containerId: string;
  isOptimal: boolean;
}> = ({ item, containerId, isOptimal }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    data: { containerId, item }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const weight = estimateItemWeight(item);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 bg-white dark:bg-gray-700 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'shadow-lg z-50 rotate-2' : 'border-gray-200 dark:border-gray-600'
      } ${
        !isOptimal ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : ''
      }`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {item.name}
          </span>
          {item.qty > 1 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
              x{item.qty}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 ml-2">
          {weight}g
        </div>
      </div>
      
      {!isOptimal && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          ⚠️ Ubicación subóptima
        </div>
      )}
    </motion.div>
  );
};

const BaggageContainer: React.FC<{
  container: BaggageContainer;
  items: PackingListItem[];
  onOptimize: () => void;
  suggestions: string[];
}> = ({ container, items, onOptimize, suggestions }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const weightPercentage = (container.currentWeight / container.maxWeight) * 100;
  const isOverweight = weightPercentage > 100;
  const isNearLimit = weightPercentage > 80;

  const getWeightColor = () => {
    if (isOverweight) return 'text-red-600 dark:text-red-400';
    if (isNearLimit) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = () => {
    if (isOverweight) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Determinar si cada item está optimally placed
  const getItemOptimality = (item: PackingListItem): boolean => {
    // Lógica para determinar ubicación óptima
    if (container.id === 'personal' && item.category === 'electrónica') return true;
    if (container.id === 'personal' && item.category === 'documentos') return true;
    if (container.id === 'carry-on' && item.priority === 1) return true;
    if (container.id === 'checked' && item.category === 'ropa' && item.priority !== 1) return true;
    
    // Si no hay reglas específicas, considerar como óptimo
    return true;
  };

  return (
    <motion.div
      layout
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 ${
        isOverweight 
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
          : isNearLimit
          ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{container.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {container.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {items.length} items
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onOptimize}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Optimizar distribución"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>
          </div>
        </div>

        {/* Weight Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Peso actual
            </span>
            <span className={`font-medium ${getWeightColor()}`}>
              {(container.currentWeight / 1000).toFixed(1)}kg / {(container.maxWeight / 1000).toFixed(1)}kg
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${getProgressColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(weightPercentage, 100)}%` }}
              transition={{ duration: 0.8 }}
            />
            {isOverweight && (
              <motion.div
                className="h-2 bg-red-600 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${weightPercentage - 100}%` }}
                style={{ marginTop: '-8px' }}
              />
            )}
          </div>

          {isOverweight && (
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              ⚠️ Sobrepeso: {((container.currentWeight - container.maxWeight) / 1000).toFixed(1)}kg
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Espacio: 70% usado</span>
          <span>Límite aerolínea: ✅</span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            {/* Restrictions & Tips */}
            {(container.restrictions.length > 0 || container.tips.length > 0) && (
              <div className="mb-4 space-y-2">
                {container.restrictions.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                    <div className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">
                      🚫 Restricciones:
                    </div>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                      {container.restrictions.map((restriction, index) => (
                        <li key={index}>• {restriction}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {container.tips.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                    <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                      💡 Tips:
                    </div>
                    <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                      {container.tips.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="space-y-2 min-h-[100px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3">
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    containerId={container.id}
                    isOptimal={getItemOptimality(item)}
                  />
                ))}
              </SortableContext>
              
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="text-2xl mb-2">{container.icon}</div>
                  <p className="text-sm">
                    Arrastra items aquí
                  </p>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">
                  ✨ Sugerencias de optimización:
                </div>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BaggageDistribution: React.FC<BaggageDistributionProps> = ({
  items,
  onItemMove,
  onContainerUpdate
}) => {
  const [containers, setContainers] = useState<BaggageContainer[]>([
    {
      id: 'personal',
      name: 'Mochila Personal',
      icon: '🎒',
      maxWeight: 7000, // 7kg
      maxVolume: 20,
      currentWeight: 0,
      currentVolume: 0,
      items: [],
      color: 'blue',
      restrictions: [
        'Máximo 40x30x15cm',
        'Solo items esenciales',
        'Acceso durante vuelo'
      ],
      tips: [
        'Documentos y electrónicos importantes',
        'Medicamentos esenciales',
        'Artículos de valor'
      ]
    },
    {
      id: 'carry-on',
      name: 'Carry-On',
      icon: '💼',
      maxWeight: 10000, // 10kg
      maxVolume: 55,
      currentWeight: 0,
      currentVolume: 0,
      items: [],
      color: 'green',
      restrictions: [
        'Máximo 55x40x20cm',
        'Líquidos en envases <100ml',
        'Sin objetos punzantes'
      ],
      tips: [
        'Ropa para primeros días',
        'Artículos de higiene básicos',
        'Cambio de ropa completo'
      ]
    },
    {
      id: 'checked',
      name: 'Maleta Facturada',
      icon: '🧳',
      maxWeight: 23000, // 23kg
      maxVolume: 158,
      currentWeight: 0,
      currentVolume: 0,
      items: [],
      color: 'purple',
      restrictions: [
        'Máximo 23kg',
        'Dimensiones: 158cm lineales',
        'Sin baterías de litio'
      ],
      tips: [
        'Resto de ropa y zapatos',
        'Artículos voluminosos',
        'Souvenirs (espacio reservado)'
      ]
    }
  ]);

  // Distribuir items automáticamente al cargar
  const distributedItems = useMemo(() => {
    const distribution: Record<string, PackingListItem[]> = {
      personal: [],
      'carry-on': [],
      checked: []
    };

    items.forEach(item => {
      // Lógica de distribución automática
      if (item.category === 'documentos' || 
          (item.category === 'electrónica' && item.name.toLowerCase().includes('cargador'))) {
        distribution.personal.push(item);
      } else if (item.priority === 1 || 
                item.category === 'higiene' ||
                (item.category === 'ropa' && item.priority <= 2)) {
        distribution['carry-on'].push(item);
      } else {
        distribution.checked.push(item);
      }
    });

    return distribution;
  }, [items]);

  // Calcular peso actual de cada contenedor
  const containersWithWeights = useMemo(() => {
    return containers.map(container => {
      const containerItems = distributedItems[container.id] || [];
      const currentWeight = containerItems.reduce((total, item) => {
        return total + estimateItemWeight(item);
      }, 0);

      return {
        ...container,
        currentWeight,
        items: containerItems
      };
    });
  }, [containers, distributedItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const itemId = active.id as string;
    const fromContainer = active.data.current?.containerId;
    const toContainer = over.id as string;

    if (fromContainer !== toContainer) {
      onItemMove(itemId, fromContainer, toContainer);
    }
  };

  const handleOptimize = (containerId: string) => {
    // Lógica de optimización automática
    console.log(`Optimizando contenedor: ${containerId}`);
    
    // Aquí iría la lógica para redistribuir items automáticamente
    // basado en peso, prioridad, restricciones, etc.
  };

  const getContainerSuggestions = (container: BaggageContainer): string[] => {
    const suggestions: string[] = [];
    
    if (container.currentWeight > container.maxWeight * 0.9) {
      suggestions.push('Considera mover items pesados a maleta facturada');
    }
    
    if (container.id === 'personal' && container.items.length > 10) {
      suggestions.push('Reduce items no esenciales para facilitar acceso');
    }
    
    if (container.id === 'carry-on' && container.items.some(item => item.category === 'ropa' && item.priority === 3)) {
      suggestions.push('Mueve ropa opcional a maleta facturada');
    }
    
    return suggestions;
  };

  // Estadísticas generales
  const totalWeight = containersWithWeights.reduce((total, container) => total + container.currentWeight, 0);
  const maxCapacity = containersWithWeights.reduce((total, container) => total + container.maxWeight, 0);
  const utilizationPercentage = (totalWeight / maxCapacity) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Overall Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">📦</span>
          Distribución de Equipaje
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totalWeight / 1000).toFixed(1)}kg
            </div>
            <div className="text-sm text-gray-500">Peso Total</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(utilizationPercentage)}%
            </div>
            <div className="text-sm text-gray-500">Capacidad Usada</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {items.length}
            </div>
            <div className="text-sm text-gray-500">Items Totales</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(totalWeight * 0.01)}
            </div>
            <div className="text-sm text-gray-500">Costo Exceso Estimado</div>
          </div>
        </div>

        {/* Warnings */}
        {containersWithWeights.some(c => c.currentWeight > c.maxWeight) && (
          <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
            <div className="flex items-center text-red-800 dark:text-red-300">
              <span className="mr-2">⚠️</span>
              <span className="font-medium">
                Algunos contenedores exceden el límite de peso
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Containers */}
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {containersWithWeights.map((container) => (
            <BaggageContainer
              key={container.id}
              container={container}
              items={container.items}
              onOptimize={() => handleOptimize(container.id)}
              suggestions={getContainerSuggestions(container)}
            />
          ))}
        </div>
      </DndContext>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <span>⚡</span>
            <span>Optimizar Todo Automáticamente</span>
          </button>
          
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <span>💾</span>
            <span>Guardar Distribución</span>
          </button>
          
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <span>📊</span>
            <span>Ver Reporte de Peso</span>
          </button>
          
          <button className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2">
            <span>🔄</span>
            <span>Resetear a Automático</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaggageDistribution;