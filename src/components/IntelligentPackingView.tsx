import React, { useState, useEffect } from 'react';
import type { Trip, PackingListItem, ItineraryBlock } from '../types.ts';
import { generateIntelligentPackingList } from '../services/intelligentPackingService.ts';

interface IntelligentPackingViewProps {
  trip: Trip;
  onPackingListUpdate?: (items: PackingListItem[]) => void;
}

const IntelligentPackingView: React.FC<IntelligentPackingViewProps> = ({ 
  trip, 
  onPackingListUpdate 
}) => {
  const [packingItems, setPackingItems] = useState<PackingListItem[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'by-priority' | 'by-activity' | 'by-category'>('by-priority');

  useEffect(() => {
    // Generar lista inteligente cuando cambie el trip
    const intelligentList = generateIntelligentPackingList(trip);
    setPackingItems(intelligentList);
    onPackingListUpdate?.(intelligentList);
  }, [trip, onPackingListUpdate]);

  const toggleItemPacked = (itemId: string) => {
    setPackingItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, packed: !item.packed }
          : item
      )
    );
  };

  const getItemsByPriority = () => {
    const grouped = {
      1: packingItems.filter(item => item.priority === 1),
      2: packingItems.filter(item => item.priority === 2),
      3: packingItems.filter(item => item.priority === 3 || !item.priority)
    };
    return grouped;
  };

  const getItemsByActivity = () => {
    const activityMap = new Map<string, PackingListItem[]>();
    const unrelated: PackingListItem[] = [];

    packingItems.forEach(item => {
      if (item.relatedActivities && item.relatedActivities.length > 0) {
        item.relatedActivities.forEach(activityId => {
          if (!activityMap.has(activityId)) {
            activityMap.set(activityId, []);
          }
          activityMap.get(activityId)!.push(item);
        });
      } else {
        unrelated.push(item);
      }
    });

    return { activityMap, unrelated };
  };

  const getActivityName = (activityId: string): string => {
    if (!trip.itinerary) return 'Actividad desconocida';
    
    for (const day of trip.itinerary) {
      const block = day.blocks.find(b => b.id === activityId);
      if (block) {
        return `${block.title} (Día ${day.dayIndex})`;
      }
    }
    return 'Actividad desconocida';
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Indispensable';
      case 2: return 'Recomendado';
      case 3: return 'Opcional';
      default: return 'Sin clasificar';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50 border-red-200';
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 3: return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const PackingItem: React.FC<{ item: PackingListItem }> = ({ item }) => (
    <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
      item.packed 
        ? 'bg-green-50 border-green-200 opacity-75' 
        : 'bg-white border-gray-200 hover:border-blue-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => toggleItemPacked(item.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.packed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {item.packed && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium ${item.packed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {item.name}
              </h4>
              
              {item.qty > 1 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.qty}x
                </span>
              )}
              
              {item.autoSuggested && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  🤖 IA
                </span>
              )}
              
              {item.weatherRelevant && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                  🌤️ Clima
                </span>
              )}
            </div>
            
            {item.notes && (
              <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
            )}
            
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                getPriorityColor(item.priority || 3)
              }`}>
                {getPriorityLabel(item.priority || 3)}
              </span>
              
              <span className="text-xs text-gray-500 capitalize">
                {item.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderByPriority = () => {
    const grouped = getItemsByPriority();
    
    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([priority, items]) => (
          items.length > 0 && (
            <div key={priority}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  priority === '1' ? 'bg-red-500' :
                  priority === '2' ? 'bg-orange-500' : 'bg-green-500'
                }`}></span>
                {getPriorityLabel(parseInt(priority))} ({items.length} ítems)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => (
                  <PackingItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  const renderByActivity = () => {
    const { activityMap, unrelated } = getItemsByActivity();
    
    return (
      <div className="space-y-6">
        {Array.from(activityMap.entries()).map(([activityId, items]) => (
          <div key={activityId}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-blue-500 mr-2">📍</span>
              {getActivityName(activityId)} ({items.length} ítems)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <PackingItem key={`${item.id}-${activityId}`} item={item} />
              ))}
            </div>
          </div>
        ))}
        
        {unrelated.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ítems generales ({unrelated.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unrelated.map(item => (
                <PackingItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderByCategory = () => {
    const categories = Array.from(new Set(packingItems.map(item => item.category)));
    
    return (
      <div className="space-y-6">
        {categories.map(category => {
          const items = packingItems.filter(item => item.category === category);
          return (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                {category} ({items.length} ítems)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => (
                  <PackingItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const packedCount = packingItems.filter(item => item.packed).length;
  const totalCount = packingItems.length;
  const progressPercentage = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Lista de Equipaje Inteligente
          </h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{packedCount}/{totalCount}</div>
            <div className="text-sm text-gray-500">completado</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <p className="text-gray-600">
          Esta lista fue generada automáticamente basándose en tu itinerario, destino y condiciones climáticas. 
          Los ítems están priorizados según su importancia para tus actividades planificadas.
        </p>
      </div>

      {/* Controles de vista */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'by-priority', label: 'Por Prioridad', icon: '🎯' },
          { key: 'by-activity', label: 'Por Actividad', icon: '📍' },
          { key: 'by-category', label: 'Por Categoría', icon: '📦' }
        ].map(mode => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key as any)}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Contenido principal */}
      <div>
        {viewMode === 'by-priority' && renderByPriority()}
        {viewMode === 'by-activity' && renderByActivity()}
        {viewMode === 'by-category' && renderByCategory()}
      </div>
    </div>
  );
};

export default IntelligentPackingView;