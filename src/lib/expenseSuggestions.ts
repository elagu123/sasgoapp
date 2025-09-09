import type { ExpenseCategory } from '../types';

interface ExpenseSuggestion {
  title: string;
  category: ExpenseCategory;
  estimatedAmount: number; // in cents
  icon: string;
}

export const getSmartExpenseSuggestions = (tripData: {
  destination?: string;
  pace?: string;
  travelers?: number;
  dates?: { start: string; end: string };
}): ExpenseSuggestion[] => {
  const { destination = '', pace = 'moderate', travelers = 1, dates } = tripData;
  
  const destinationLower = destination.toLowerCase();
  const suggestions: ExpenseSuggestion[] = [];
  
  // Calculate trip duration
  let tripDays = 1;
  if (dates) {
    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);
    tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  // Base suggestions that apply to most trips
  const baseSuggestions: ExpenseSuggestion[] = [
    { title: 'Desayuno', category: 'comida', estimatedAmount: 1500, icon: '🥐' },
    { title: 'Almuerzo', category: 'comida', estimatedAmount: 2500, icon: '🍽️' },
    { title: 'Cena', category: 'comida', estimatedAmount: 3500, icon: '🍷' },
    { title: 'Taxi/Uber', category: 'transporte', estimatedAmount: 1200, icon: '🚕' },
    { title: 'Café', category: 'comida', estimatedAmount: 500, icon: '☕' },
    { title: 'Agua/Snacks', category: 'comida', estimatedAmount: 800, icon: '🥤' },
  ];
  
  // Destination-specific suggestions
  if (destinationLower.includes('playa') || destinationLower.includes('beach') || 
      destinationLower.includes('mar') || destinationLower.includes('costa')) {
    suggestions.push(
      { title: 'Protector solar', category: 'salud', estimatedAmount: 1500, icon: '🧴' },
      { title: 'Sombrilla/Carpa', category: 'otros', estimatedAmount: 2000, icon: '⛱️' },
      { title: 'Bebidas en la playa', category: 'comida', estimatedAmount: 1800, icon: '🍹' },
      { title: 'Actividades acuáticas', category: 'ocio', estimatedAmount: 5000, icon: '🏄' },
      { title: 'Alquiler de reposeras', category: 'otros', estimatedAmount: 1000, icon: '🏖️' }
    );
  }
  
  if (destinationLower.includes('montaña') || destinationLower.includes('trekking') || 
      destinationLower.includes('hiking') || destinationLower.includes('naturaleza')) {
    suggestions.push(
      { title: 'Entrada al parque', category: 'ocio', estimatedAmount: 2500, icon: '🏞️' },
      { title: 'Guía de trekking', category: 'ocio', estimatedAmount: 8000, icon: '🥾' },
      { title: 'Alquiler equipo', category: 'otros', estimatedAmount: 4000, icon: '⛰️' },
      { title: 'Refugio de montaña', category: 'alojamiento', estimatedAmount: 3500, icon: '🏠' },
      { title: 'Comida de montaña', category: 'comida', estimatedAmount: 2000, icon: '🥾' }
    );
  }
  
  if (destinationLower.includes('ciudad') || destinationLower.includes('city') || 
      destinationLower.includes('urbano') || destinationLower.includes('centro')) {
    suggestions.push(
      { title: 'Metro/Transporte público', category: 'transporte', estimatedAmount: 800, icon: '🚇' },
      { title: 'Museo/Galería', category: 'ocio', estimatedAmount: 2000, icon: '🏛️' },
      { title: 'Tour de la ciudad', category: 'ocio', estimatedAmount: 4500, icon: '🚌' },
      { title: 'Compras/Souvenirs', category: 'compras', estimatedAmount: 3000, icon: '🛍️' },
      { title: 'Show/Teatro', category: 'ocio', estimatedAmount: 6000, icon: '🎭' }
    );
  }
  
  // International travel suggestions
  if (destinationLower.includes('internacional') || destinationLower.includes('exterior') ||
      destinationLower.includes('europa') || destinationLower.includes('usa') ||
      destinationLower.includes('asia')) {
    suggestions.push(
      { title: 'Seguro de viaje', category: 'salud', estimatedAmount: 3000, icon: '🛡️' },
      { title: 'Cambio de moneda', category: 'otros', estimatedAmount: 2000, icon: '💱' },
      { title: 'Tarjeta SIM/Roaming', category: 'otros', estimatedAmount: 2500, icon: '📱' },
      { title: 'Propinas', category: 'otros', estimatedAmount: 1500, icon: '💰' }
    );
  }
  
  // Pace-based suggestions
  if (pace === 'intense') {
    suggestions.push(
      { title: 'Energéticos/Bebidas', category: 'comida', estimatedAmount: 1200, icon: '⚡' },
      { title: 'Tours múltiples', category: 'ocio', estimatedAmount: 12000, icon: '🏃' },
      { title: 'Transporte rápido', category: 'transporte', estimatedAmount: 3000, icon: '🚄' }
    );
  } else if (pace === 'relaxed') {
    suggestions.push(
      { title: 'Spa/Masajes', category: 'salud', estimatedAmount: 8000, icon: '💆' },
      { title: 'Lectura/Revistas', category: 'otros', estimatedAmount: 1000, icon: '📚' },
      { title: 'Comida gourmet', category: 'comida', estimatedAmount: 5000, icon: '🍾' }
    );
  }
  
  // Adjust amounts based on number of travelers
  const adjustedSuggestions = [...baseSuggestions, ...suggestions].map(suggestion => ({
    ...suggestion,
    estimatedAmount: Math.round(suggestion.estimatedAmount * Math.min(travelers, 2)) // Cap at 2x for large groups
  }));
  
  // Adjust amounts based on trip duration (longer trips = more conservative daily spend)
  const durationFactor = tripDays > 7 ? 0.8 : tripDays < 3 ? 1.3 : 1.0;
  
  return adjustedSuggestions.map(suggestion => ({
    ...suggestion,
    estimatedAmount: Math.round(suggestion.estimatedAmount * durationFactor)
  })).slice(0, 12); // Return max 12 suggestions
};