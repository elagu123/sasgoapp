import type { ItineraryBlock, ActivityPackingItem, PackingListItem, PackingCategory, Trip, ItineraryDay } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

// Base de conocimiento de equipamiento por actividad
const ACTIVITY_PACKING_DATABASE: Record<string, ActivityPackingItem[]> = {
  // Actividades al aire libre
  'trekking': [
    { name: 'Botas de trekking', category: 'calzado', priority: 1, reason: 'Protección y tracción en senderos', weatherDependent: false },
    { name: 'Mochila de día', category: 'otros', priority: 1, reason: 'Para llevar agua y provisiones' },
    { name: 'Gorra o sombrero', category: 'ropa', priority: 2, reason: 'Protección solar', weatherDependent: true },
    { name: 'Protector solar', category: 'higiene', priority: 1, reason: 'Protección UV en altura' },
    { name: 'Bastones de trekking', category: 'otros', priority: 3, reason: 'Apoyo en terrenos difíciles' }
  ],
  
  'sightseeing': [
    { name: 'Zapatillas cómodas', category: 'calzado', priority: 1, reason: 'Para caminar mucho sin cansarse' },
    { name: 'Cámara o celular', category: 'electrónica', priority: 2, reason: 'Capturar recuerdos' },
    { name: 'Mochila pequeña', category: 'otros', priority: 2, reason: 'Para llevar lo esencial' },
    { name: 'Botella de agua', category: 'otros', priority: 1, reason: 'Mantenerse hidratado' }
  ],

  'beach': [
    { name: 'Traje de baño', category: 'ropa', priority: 1, reason: 'Indispensable para la playa' },
    { name: 'Protector solar', category: 'higiene', priority: 1, reason: 'Protección UV intensa' },
    { name: 'Toalla de playa', category: 'otros', priority: 1, reason: 'Para secarse y recostarse' },
    { name: 'Sandalias', category: 'calzado', priority: 1, reason: 'Fáciles de quitar en la arena' },
    { name: 'Gorra', category: 'ropa', priority: 2, reason: 'Protección solar adicional' },
    { name: 'Anteojos de sol', category: 'otros', priority: 2, reason: 'Protección ocular' }
  ],

  'restaurant': [
    { name: 'Ropa semi-formal', category: 'ropa', priority: 2, reason: 'Para restaurantes elegantes', timeOfDayRelevant: 'evening' },
    { name: 'Zapatos cerrados', category: 'calzado', priority: 2, reason: 'Para cenas formales', timeOfDayRelevant: 'evening' }
  ],

  'nightlife': [
    { name: 'Ropa de salir', category: 'ropa', priority: 1, reason: 'Para bars y discotecas', timeOfDayRelevant: 'night' },
    { name: 'Zapatos cómodos', category: 'calzado', priority: 1, reason: 'Para bailar y estar de pie', timeOfDayRelevant: 'night' },
    { name: 'Cargador portátil', category: 'electrónica', priority: 2, reason: 'Batería para la noche' }
  ],

  'hotel': [
    { name: 'Pijama o ropa de dormir', category: 'ropa', priority: 1, reason: 'Para descansar cómodamente' },
    { name: 'Pantuflas', category: 'calzado', priority: 3, reason: 'Comodidad en la habitación' },
    { name: 'Artículos de higiene', category: 'higiene', priority: 1, reason: 'Cuidado personal diario' }
  ],

  'transport': [
    { name: 'Documentos de viaje', category: 'documentos', priority: 1, reason: 'Identificación y tickets' },
    { name: 'Cargador de celular', category: 'electrónica', priority: 2, reason: 'Para viajes largos' },
    { name: 'Almohada de viaje', category: 'otros', priority: 3, reason: 'Comodidad en trayectos largos' },
    { name: 'Entretenimiento', category: 'electrónica', priority: 3, reason: 'Auriculares, tablet, libro' }
  ]
};

// Equipamiento específico por clima
const WEATHER_PACKING_REQUIREMENTS: Record<string, ActivityPackingItem[]> = {
  'rainy': [
    { name: 'Paraguas', category: 'otros', priority: 1, reason: 'Protección contra lluvia', weatherDependent: true },
    { name: 'Impermeable', category: 'ropa', priority: 1, reason: 'Mantener el cuerpo seco', weatherDependent: true },
    { name: 'Zapatos impermeables', category: 'calzado', priority: 2, reason: 'Pies secos', weatherDependent: true },
    { name: 'Bolsas impermeables', category: 'otros', priority: 3, reason: 'Proteger electrónicos', weatherDependent: true }
  ],
  
  'snowy': [
    { name: 'Campera de nieve', category: 'ropa', priority: 1, reason: 'Protección contra frío extremo', weatherDependent: true },
    { name: 'Botas de nieve', category: 'calzado', priority: 1, reason: 'Tracción y aislamiento', weatherDependent: true },
    { name: 'Guantes térmicos', category: 'ropa', priority: 1, reason: 'Protección de manos', weatherDependent: true },
    { name: 'Gorro térmico', category: 'ropa', priority: 1, reason: 'Evitar pérdida de calor', weatherDependent: true },
    { name: 'Bufanda', category: 'ropa', priority: 2, reason: 'Protección del cuello', weatherDependent: true }
  ],

  'hot': [
    { name: 'Ropa liviana', category: 'ropa', priority: 1, reason: 'Transpirabilidad en calor', weatherDependent: true },
    { name: 'Protector solar alto FPS', category: 'higiene', priority: 1, reason: 'Protección UV intensa', weatherDependent: true },
    { name: 'Hidratación extra', category: 'otros', priority: 1, reason: 'Prevenir deshidratación', weatherDependent: true },
    { name: 'Ventilador portátil', category: 'electrónica', priority: 3, reason: 'Alivio del calor', weatherDependent: true }
  ]
};

/**
 * Genera sugerencias inteligentes de equipaje basadas en el itinerario completo
 */
export const generateIntelligentPackingList = (trip: Trip): PackingListItem[] => {
  const suggestions: Map<string, PackingListItem> = new Map();
  
  // 1. Analizar cada actividad del itinerario
  if (trip.itinerary) {
    trip.itinerary.forEach(day => {
      day.blocks.forEach(block => {
        const activitySuggestions = getPackingForActivity(block);
        
        activitySuggestions.forEach(suggestion => {
          const key = `${suggestion.name}_${suggestion.category}`;
          
          if (suggestions.has(key)) {
            // Si ya existe, aumentar cantidad o actualizar prioridad
            const existing = suggestions.get(key)!;
            existing.qty = Math.max(existing.qty, 1);
            existing.priority = Math.min(existing.priority || 3, suggestion.priority);
            existing.relatedActivities?.push(block.id);
          } else {
            // Crear nuevo ítem
            suggestions.set(key, {
              id: uuidv4(),
              name: suggestion.name,
              qty: 1,
              category: suggestion.category,
              packed: false,
              notes: suggestion.reason,
              relatedActivities: [block.id],
              autoSuggested: true,
              weatherRelevant: suggestion.weatherDependent,
              priority: suggestion.priority
            });
          }
        });
      });
    });
  }

  // 2. Agregar ítems básicos para cualquier viaje
  const basicItems = getBasicTravelItems(trip);
  basicItems.forEach(item => {
    const key = `${item.name}_${item.category}`;
    if (!suggestions.has(key)) {
      suggestions.set(key, item);
    }
  });

  // 3. Ajustar cantidades basado en duración del viaje
  const tripDays = calculateTripDays(trip);
  adjustQuantitiesForDuration(Array.from(suggestions.values()), tripDays);

  return Array.from(suggestions.values()).sort((a, b) => {
    // Ordenar por prioridad, luego por categoría
    if (a.priority !== b.priority) {
      return (a.priority || 3) - (b.priority || 3);
    }
    return a.category.localeCompare(b.category);
  });
};

/**
 * Obtiene sugerencias de equipaje para una actividad específica
 */
const getPackingForActivity = (block: ItineraryBlock): ActivityPackingItem[] => {
  const suggestions: ActivityPackingItem[] = [];
  
  // Buscar por tipo de actividad
  const activityKey = mapActivityToPackingKey(block);
  if (ACTIVITY_PACKING_DATABASE[activityKey]) {
    suggestions.push(...ACTIVITY_PACKING_DATABASE[activityKey]);
  }

  // Agregar sugerencias por clima si hay información meteorológica
  if (block.weatherRequirements) {
    const weatherKey = mapWeatherToPackingKey(block.weatherRequirements.condition);
    if (WEATHER_PACKING_REQUIREMENTS[weatherKey]) {
      suggestions.push(...WEATHER_PACKING_REQUIREMENTS[weatherKey]);
    }
  }

  // Filtrar por momento del día si es relevante
  return suggestions.filter(item => 
    !item.timeOfDayRelevant || 
    item.timeOfDayRelevant === 'any' || 
    isTimeRelevant(block.startTime, item.timeOfDayRelevant)
  );
};

/**
 * Mapea una actividad del itinerario a una clave de la base de datos de equipamiento
 */
const mapActivityToPackingKey = (block: ItineraryBlock): string => {
  // Mapeo inteligente basado en título, tipo y categoría
  const title = block.title.toLowerCase();
  const category = block.category;
  const type = block.type;

  // Casos específicos por título
  if (title.includes('trekking') || title.includes('senderismo') || title.includes('cerro') || title.includes('montaña')) {
    return 'trekking';
  }
  if (title.includes('playa') || title.includes('beach') || title.includes('costa')) {
    return 'beach';
  }
  if (title.includes('restaurante') || title.includes('cena') || title.includes('almuerzo')) {
    return 'restaurant';
  }
  if (title.includes('bar') || title.includes('discoteca') || title.includes('noche') || title.includes('nightlife')) {
    return 'nightlife';
  }

  // Mapeo por categoría
  switch (category) {
    case 'outdoors':
      return 'trekking';
    case 'sightseeing':
      return 'sightseeing';
    case 'food':
      return 'restaurant';
    case 'nightlife':
      return 'nightlife';
    case 'rest':
      return type === 'hotel' ? 'hotel' : 'sightseeing';
    default:
      return type === 'transfer' ? 'transport' : 'sightseeing';
  }
};

/**
 * Mapea condiciones climáticas a claves de equipamiento
 */
const mapWeatherToPackingKey = (condition: string): string => {
  switch (condition) {
    case 'rainy':
      return 'rainy';
    case 'snowy':
      return 'snowy';
    case 'sunny':
      return 'hot';
    default:
      return 'sunny';
  }
};

/**
 * Verifica si un momento del día es relevante para una actividad
 */
const isTimeRelevant = (startTime: string, timeOfDay: string): boolean => {
  const hour = parseInt(startTime.split(':')[0]);
  
  switch (timeOfDay) {
    case 'morning':
      return hour >= 6 && hour < 12;
    case 'afternoon':
      return hour >= 12 && hour < 18;
    case 'evening':
      return hour >= 18 && hour < 22;
    case 'night':
      return hour >= 22 || hour < 6;
    default:
      return true;
  }
};

/**
 * Genera ítems básicos para cualquier viaje
 */
const getBasicTravelItems = (trip: Trip): PackingListItem[] => {
  const basicItems: PackingListItem[] = [
    {
      id: uuidv4(),
      name: 'Pasaporte/DNI',
      qty: 1,
      category: 'documentos',
      packed: false,
      priority: 1,
      autoSuggested: true,
      notes: 'Documento de identidad obligatorio'
    },
    {
      id: uuidv4(),
      name: 'Cargador de celular',
      qty: 1,
      category: 'electrónica',
      packed: false,
      priority: 1,
      autoSuggested: true,
      notes: 'Indispensable para comunicación'
    },
    {
      id: uuidv4(),
      name: 'Ropa interior',
      qty: 1, // Se ajustará por duración
      category: 'ropa',
      packed: false,
      priority: 1,
      autoSuggested: true,
      notes: 'Cantidad basada en días de viaje'
    },
    {
      id: uuidv4(),
      name: 'Cepillo de dientes',
      qty: 1,
      category: 'higiene',
      packed: false,
      priority: 1,
      autoSuggested: true,
      notes: 'Higiene personal básica'
    }
  ];

  return basicItems;
};

/**
 * Calcula la duración del viaje en días
 */
const calculateTripDays = (trip: Trip): number => {
  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Ajusta las cantidades de ítems basado en la duración del viaje
 */
const adjustQuantitiesForDuration = (items: PackingListItem[], days: number): void => {
  const itemsToMultiply = ['ropa interior', 'medias', 'remera', 'pantalón'];
  
  items.forEach(item => {
    if (itemsToMultiply.some(keyword => item.name.toLowerCase().includes(keyword))) {
      // Para ropa, calculamos cantidad inteligente
      if (item.name.toLowerCase().includes('interior') || item.name.toLowerCase().includes('medias')) {
        item.qty = Math.min(days, 7); // Máximo 7, se puede lavar
      } else {
        item.qty = Math.ceil(days / 2); // Otras prendas, la mitad de días
      }
      item.notes = `${item.notes}. Cantidad calculada para ${days} días`;
    }
  });
};

/**
 * Actualiza las sugerencias de equipaje cuando cambia el itinerario
 */
export const updatePackingForItineraryChanges = (
  currentPackingList: PackingListItem[],
  updatedTrip: Trip
): PackingListItem[] => {
  // Generar nueva lista inteligente
  const newSuggestions = generateIntelligentPackingList(updatedTrip);
  
  // Mantener ítems manuales del usuario (no auto-sugeridos)
  const manualItems = currentPackingList.filter(item => !item.autoSuggested);
  
  // Combinar manualmente agregados con nuevas sugerencias
  const combined = [...manualItems];
  
  newSuggestions.forEach(newItem => {
    const existing = combined.find(item => 
      item.name.toLowerCase() === newItem.name.toLowerCase() &&
      item.category === newItem.category
    );
    
    if (!existing) {
      combined.push(newItem);
    } else if (existing.autoSuggested) {
      // Actualizar ítem auto-sugerido existente
      existing.relatedActivities = newItem.relatedActivities;
      existing.notes = newItem.notes;
      existing.priority = newItem.priority;
    }
  });
  
  return combined;
};