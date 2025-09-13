import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PackingListItem, PackingCategory } from '../../types';

interface AdvancedPackingChecklistProps {
  items: PackingListItem[];
  onItemUpdate: (itemId: string, updates: Partial<PackingListItem>) => void;
  onItemAdd: (item: Omit<PackingListItem, 'id'>) => void;
  onItemDelete: (itemId: string) => void;
  onReorder: (oldIndex: number, newIndex: number, category: PackingCategory) => void;
  isPackingMode?: boolean;
}

interface CategoryStats {
  total: number;
  packed: number;
  critical: number;
  optional: number;
}

const categoryConfig = {
  documentos: { icon: '📄', color: 'red', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  ropa: { icon: '👕', color: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  calzado: { icon: '👟', color: 'green', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  electrónica: { icon: '🔌', color: 'purple', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  higiene: { icon: '🧴', color: 'pink', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
  salud: { icon: '💊', color: 'orange', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  otros: { icon: '🎒', color: 'gray', bgColor: 'bg-gray-50 dark:bg-gray-900/20' }
};

const priorityConfig = {
  1: { label: 'Crítico', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: '🔴' },
  2: { label: 'Importante', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '🟡' },
  3: { label: 'Opcional', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: '🟢' }
};

const SortableItem: React.FC<{
  item: PackingListItem;
  onUpdate: (updates: Partial<PackingListItem>) => void;
  onDelete: () => void;
  isPackingMode: boolean;
}> = ({ item, onUpdate, onDelete, isPackingMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedQty, setEditedQty] = useState(item.qty);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate({ 
      name: editedName.trim() || item.name, 
      qty: editedQty 
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedQty(item.qty);
    setIsEditing(false);
  };

  const priorityInfo = priorityConfig[item.priority || 3];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 ${
        isDragging ? 'shadow-lg z-10' : 'hover:shadow-md'
      } ${item.packed ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-white dark:bg-gray-800'}`}
    >
      <div className="flex items-center space-x-3">
        {/* Drag Handle */}
        {!isPackingMode && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}

        {/* Checkbox */}
        <motion.button
          onClick={() => onUpdate({ packed: !item.packed })}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            item.packed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {item.packed && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.button>

        {/* Item Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                autoFocus
              />
              <input
                type="number"
                value={editedQty}
                onChange={(e) => setEditedQty(parseInt(e.target.value) || 1)}
                className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                min="1"
              />
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-800 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleCancel}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${item.packed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {item.name}
                </span>
                {item.qty > 1 && (
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    x{item.qty}
                  </span>
                )}
                {item.autoSuggested && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                    IA
                  </span>
                )}
                {item.weatherRelevant && (
                  <span className="text-xs" title="Dependiente del clima">🌤️</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Priority Indicator */}
                <span 
                  className={`text-xs px-2 py-0.5 rounded-full ${priorityInfo.bg} ${priorityInfo.color}`}
                  title={priorityInfo.label}
                >
                  {priorityInfo.icon}
                </span>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mt-1 text-xs text-gray-500 italic">
              {item.notes}
            </div>
          )}

          {/* Related Activities */}
          {item.relatedActivities && item.relatedActivities.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.relatedActivities.map((activityId) => (
                <span
                  key={activityId}
                  className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded-full"
                >
                  {activityId}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CategorySection: React.FC<{
  category: PackingCategory;
  items: PackingListItem[];
  stats: CategoryStats;
  isExpanded: boolean;
  onToggle: () => void;
  onItemUpdate: (itemId: string, updates: Partial<PackingListItem>) => void;
  onItemDelete: (itemId: string) => void;
  onItemAdd: () => void;
  isPackingMode: boolean;
}> = ({ 
  category, 
  items, 
  stats, 
  isExpanded, 
  onToggle, 
  onItemUpdate, 
  onItemDelete, 
  onItemAdd,
  isPackingMode 
}) => {
  const config = categoryConfig[category] || categoryConfig.otros;
  const progressPercentage = stats.total > 0 ? (stats.packed / stats.total) * 100 : 0;

  return (
    <motion.div
      layout
      className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${config.bgColor}`}
    >
      {/* Header */}
      <motion.button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
              {category.replace('_', ' ')}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <span>
                {stats.packed}/{stats.total} items
              </span>
              {stats.critical > 0 && (
                <span className="text-red-600">
                  {stats.critical} críticos
                </span>
              )}
              <div className="flex items-center space-x-1">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <motion.div
                    className={`h-1.5 rounded-full bg-${config.color}-500`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isPackingMode && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onItemAdd();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              whileTap={{ scale: 0.95 }}
              title="Agregar item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </motion.button>
          )}
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </motion.button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-3">
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => onItemUpdate(item.id, updates)}
                    onDelete={() => onItemDelete(item.id)}
                    isPackingMode={isPackingMode}
                  />
                ))}
              </SortableContext>

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-3xl mb-2">📦</div>
                  <p>No hay items en esta categoría</p>
                  {!isPackingMode && (
                    <button
                      onClick={onItemAdd}
                      className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      Agregar primer item
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AdvancedPackingChecklist: React.FC<AdvancedPackingChecklistProps> = ({
  items,
  onItemUpdate,
  onItemAdd,
  onItemDelete,
  onReorder,
  isPackingMode = false
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<PackingCategory>>(
    new Set(['documentos', 'ropa', 'electrónica'])
  );
  const [viewMode, setViewMode] = useState<'category' | 'priority' | 'status'>('category');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by category and calculate stats
  const { groupedItems, categoryStats } = useMemo(() => {
    const grouped: Record<PackingCategory, PackingListItem[]> = {
      documentos: [],
      ropa: [],
      calzado: [],
      electrónica: [],
      higiene: [],
      salud: [],
      otros: []
    };

    const stats: Record<PackingCategory, CategoryStats> = {
      documentos: { total: 0, packed: 0, critical: 0, optional: 0 },
      ropa: { total: 0, packed: 0, critical: 0, optional: 0 },
      calzado: { total: 0, packed: 0, critical: 0, optional: 0 },
      electrónica: { total: 0, packed: 0, critical: 0, optional: 0 },
      higiene: { total: 0, packed: 0, critical: 0, optional: 0 },
      salud: { total: 0, packed: 0, critical: 0, optional: 0 },
      otros: { total: 0, packed: 0, critical: 0, optional: 0 }
    };

    items.forEach(item => {
      const category = item.category as PackingCategory;
      if (grouped[category]) {
        grouped[category].push(item);
        stats[category].total++;
        if (item.packed) stats[category].packed++;
        if (item.priority === 1) stats[category].critical++;
        if (item.priority === 3) stats[category].optional++;
      }
    });

    // Sort items within each category by priority and then by name
    Object.keys(grouped).forEach(category => {
      grouped[category as PackingCategory].sort((a, b) => {
        if (a.priority !== b.priority) {
          return (a.priority || 3) - (b.priority || 3);
        }
        return a.name.localeCompare(b.name);
      });
    });

    return { groupedItems: grouped, categoryStats: stats };
  }, [items]);

  const toggleCategory = (category: PackingCategory) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      // Find which category the items belong to
      let category: PackingCategory | null = null;
      let oldIndex = -1;
      let newIndex = -1;

      Object.entries(groupedItems).forEach(([cat, categoryItems]) => {
        const activeIndex = categoryItems.findIndex(item => item.id === active.id);
        const overIndex = categoryItems.findIndex(item => item.id === over.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          category = cat as PackingCategory;
          oldIndex = activeIndex;
          newIndex = overIndex;
        }
      });

      if (category && oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex, category);
      }
    }
  };

  const handleAddItem = (category: PackingCategory) => {
    const newItem: Omit<PackingListItem, 'id'> = {
      name: 'Nuevo item',
      qty: 1,
      category,
      packed: false,
      priority: 2,
      autoSuggested: false
    };
    onItemAdd(newItem);
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const total = items.length;
    const packed = items.filter(item => item.packed).length;
    const critical = items.filter(item => item.priority === 1).length;
    const criticalPacked = items.filter(item => item.priority === 1 && item.packed).length;
    
    return {
      total,
      packed,
      critical,
      criticalPacked,
      percentage: total > 0 ? (packed / total) * 100 : 0,
      criticalPercentage: critical > 0 ? (criticalPacked / critical) * 100 : 0
    };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📋 Lista de Equipaje
          </h2>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { mode: 'category', label: 'Categoría', icon: '📂' },
                { mode: 'priority', label: 'Prioridad', icon: '⭐' },
                { mode: 'status', label: 'Estado', icon: '✅' }
              ].map((option) => (
                <button
                  key={option.mode}
                  onClick={() => setViewMode(option.mode as any)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === option.mode
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            {/* Packing Mode Toggle */}
            {!isPackingMode && (
              <div className="text-sm text-gray-500">
                Modo: Organización
              </div>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Progreso General
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {overallStats.packed}/{overallStats.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallStats.percentage}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(overallStats.percentage)}% completado
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Items Críticos
              </span>
              <span className="text-lg font-bold text-red-700 dark:text-red-300">
                {overallStats.criticalPacked}/{overallStats.critical}
              </span>
            </div>
            <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
              <motion.div
                className="bg-red-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallStats.criticalPercentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="text-xs text-red-500 mt-1">
              {Math.round(overallStats.criticalPercentage)}% empacado
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Peso Estimado
              </span>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                ~{Math.round(overallStats.total * 0.5)}kg
              </span>
            </div>
            <div className="text-xs text-green-500 mt-1">
              Basado en {overallStats.total} items
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {Object.entries(groupedItems)
            .filter(([_, items]) => items.length > 0 || !isPackingMode)
            .map(([category, categoryItems]) => (
              <CategorySection
                key={category}
                category={category as PackingCategory}
                items={categoryItems}
                stats={categoryStats[category as PackingCategory]}
                isExpanded={expandedCategories.has(category as PackingCategory)}
                onToggle={() => toggleCategory(category as PackingCategory)}
                onItemUpdate={onItemUpdate}
                onItemDelete={onItemDelete}
                onItemAdd={() => handleAddItem(category as PackingCategory)}
                isPackingMode={isPackingMode}
              />
            ))}
        </div>
      </DndContext>

      {/* Quick Actions */}
      {!isPackingMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              🔍 Buscar items
            </button>
            <button className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
              📋 Plantillas
            </button>
            <button className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
              🎒 Optimizar peso
            </button>
            <button className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
              📤 Exportar lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPackingChecklist;