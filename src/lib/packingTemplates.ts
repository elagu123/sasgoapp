import type { PackingListItem, PackingCategory } from '../types';

interface PackingTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tags: string[];
  items: Omit<PackingListItem, 'id' | 'packed'>[];
}

export const PACKING_TEMPLATES: PackingTemplate[] = [
  {
    id: 'playa_basico',
    name: 'Básico de Playa',
    description: 'Esenciales para vacaciones de playa relajadas',
    emoji: '🏖️',
    tags: ['playa', 'verano', 'relaxed'],
    items: [
      { name: 'Traje de baño', qty: 2, category: 'ropa', notes: 'Uno de repuesto' },
      { name: 'Toalla de playa', qty: 1, category: 'otros', notes: '' },
      { name: 'Protector solar', qty: 1, category: 'salud', notes: 'SPF 50+' },
      { name: 'Sandalias', qty: 1, category: 'calzado', notes: '' },
      { name: 'Sombrero o gorra', qty: 1, category: 'ropa', notes: '' },
      { name: 'Camisetas', qty: 3, category: 'ropa', notes: '' },
      { name: 'Shorts', qty: 2, category: 'ropa', notes: '' },
      { name: 'Vestido de playa', qty: 2, category: 'ropa', notes: '' },
    ]
  },
  {
    id: 'montana_aventura',
    name: 'Aventura en Montaña',
    description: 'Gear esencial para trekking y montañismo',
    emoji: '🏔️',
    tags: ['montaña', 'trekking', 'intense', 'aventura'],
    items: [
      { name: 'Botas de trekking', qty: 1, category: 'calzado', notes: 'Impermeables' },
      { name: 'Mochila de día', qty: 1, category: 'otros', notes: '30-40L' },
      { name: 'Chaqueta impermeable', qty: 1, category: 'ropa', notes: '' },
      { name: 'Capas térmicas', qty: 2, category: 'ropa', notes: 'Base layers' },
      { name: 'Pantalones de trekking', qty: 2, category: 'ropa', notes: '' },
      { name: 'Linterna frontal', qty: 1, category: 'electrónica', notes: 'Con baterías extra' },
      { name: 'Kit primeros auxilios', qty: 1, category: 'salud', notes: '' },
      { name: 'Agua reutilizable', qty: 1, category: 'otros', notes: 'Botella o hidratación' },
    ]
  },
  {
    id: 'ciudad_trabajo',
    name: 'Viaje de Negocios',
    description: 'Profesional y elegante para reuniones',
    emoji: '💼',
    tags: ['trabajo', 'ciudad', 'moderate'],
    items: [
      { name: 'Trajes o blazers', qty: 2, category: 'ropa', notes: '' },
      { name: 'Camisas formales', qty: 3, category: 'ropa', notes: '' },
      { name: 'Zapatos formales', qty: 1, category: 'calzado', notes: '' },
      { name: 'Corbatas', qty: 2, category: 'ropa', notes: '' },
      { name: 'Laptop', qty: 1, category: 'electrónica', notes: 'Con cargador' },
      { name: 'Documentos trabajo', qty: 1, category: 'documentos', notes: 'Contratos, presentaciones' },
      { name: 'Tarjetas de visita', qty: 1, category: 'documentos', notes: '' },
      { name: 'Agenda/notebook', qty: 1, category: 'otros', notes: '' },
    ]
  },
  {
    id: 'familia_completo',
    name: 'Viaje Familiar',
    description: 'Todo lo necesario para viajar con niños',
    emoji: '👨‍👩‍👧‍👦',
    tags: ['familiar', 'niños', 'moderate'],
    items: [
      { name: 'Ropa extra niños', qty: 5, category: 'ropa', notes: 'Cambios adicionales' },
      { name: 'Pañales', qty: 20, category: 'bebé', notes: 'Más de lo necesario' },
      { name: 'Medicinas niños', qty: 1, category: 'salud', notes: 'Fiebre, alergias' },
      { name: 'Juguetes/tablets', qty: 2, category: 'electrónica', notes: 'Entretenimiento' },
      { name: 'Snacks', qty: 5, category: 'otros', notes: 'Comida para el viaje' },
      { name: 'Toallitas húmedas', qty: 3, category: 'higiene', notes: '' },
      { name: 'Protector solar niños', qty: 1, category: 'salud', notes: 'Especial para niños' },
    ]
  },
  {
    id: 'invierno_frio',
    name: 'Destino Frío',
    description: 'Equipamiento para clima frío y nieve',
    emoji: '❄️',
    tags: ['invierno', 'frío', 'nieve'],
    items: [
      { name: 'Abrigo de invierno', qty: 1, category: 'ropa', notes: 'Impermeable y cálido' },
      { name: 'Guantes térmicos', qty: 1, category: 'ropa', notes: '' },
      { name: 'Gorro de lana', qty: 1, category: 'ropa', notes: '' },
      { name: 'Bufanda', qty: 1, category: 'ropa', notes: '' },
      { name: 'Botas impermeables', qty: 1, category: 'calzado', notes: 'Para nieve' },
      { name: 'Ropa térmica', qty: 3, category: 'ropa', notes: 'Camisetas y pantalones' },
      { name: 'Calcetines lana', qty: 4, category: 'ropa', notes: '' },
      { name: 'Calentadores manos', qty: 5, category: 'otros', notes: 'Desechables' },
    ]
  }
];

export const getSmartTemplateRecommendations = (tripData: {
  destination?: string;
  pace?: string;
  tripType?: string[];
  expectedWeather?: string;
  plannedActivities?: string;
}): PackingTemplate[] => {
  const { destination = '', pace = '', tripType = [], expectedWeather = '', plannedActivities = '' } = tripData;
  
  const allText = `${destination} ${pace} ${tripType.join(' ')} ${expectedWeather} ${plannedActivities}`.toLowerCase();
  
  return PACKING_TEMPLATES
    .map(template => {
      let score = 0;
      
      // Check tag matches
      template.tags.forEach(tag => {
        if (allText.includes(tag)) {
          score += 10;
        }
      });
      
      // Specific destination patterns
      if (allText.includes('playa') || allText.includes('beach') || allText.includes('mar')) {
        if (template.id === 'playa_basico') score += 20;
      }
      
      if (allText.includes('montaña') || allText.includes('trekking') || allText.includes('hiking')) {
        if (template.id === 'montana_aventura') score += 20;
      }
      
      if (allText.includes('trabajo') || allText.includes('negocio') || allText.includes('reunión')) {
        if (template.id === 'ciudad_trabajo') score += 20;
      }
      
      if (allText.includes('familia') || allText.includes('niños') || allText.includes('bebé')) {
        if (template.id === 'familia_completo') score += 20;
      }
      
      if (allText.includes('frío') || allText.includes('nieve') || allText.includes('invierno')) {
        if (template.id === 'invierno_frio') score += 20;
      }
      
      // Pace matching
      if (pace === 'intense' && template.tags.includes('intense')) score += 15;
      if (pace === 'relaxed' && template.tags.includes('relaxed')) score += 15;
      if (pace === 'moderate' && template.tags.includes('moderate')) score += 15;
      
      return { ...template, score };
    })
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Return top 3 recommendations
};

export const getTemplateById = (id: string): PackingTemplate | undefined => {
  return PACKING_TEMPLATES.find(template => template.id === id);
};