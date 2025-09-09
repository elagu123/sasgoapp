import { GoogleGenAI, Type } from "@google/genai";
import type { PackingList, Trip, ItineraryDay, UserProfile, EventSuggestion, ItineraryBlock, HHMM, User, Recommendation, StayCandidate, GetawayCandidate, GetawayPlan, PackingListItem, WeatherForecastDay, ActivityCandidate, Ticket, OptimizationSuggestion } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';
import { toMin, fromMin } from '../lib/itinerary-time.ts';
import { MOCK_GETAWAY_CANDIDATES, MOCK_FULL_GETAWAY_PLAN, MOCK_PUBLIC_TRIPS, MOCK_STAY_CANDIDATES, MOCK_WEATHER_FORECAST, MOCK_ACTIVITY_CANDIDATES, MOCK_PARSED_TICKET } from '../constants.ts';

// Initialize ai only if API_KEY is available to prevent crashes.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

if (!ai) {
  console.warn("API_KEY environment variable not set. AI features will use mock responses.");
}

const packingListSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: "La lista de ítems para empacar.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Nombre del ítem. Debe ser conciso y claro.",
          },
          qty: {
            type: Type.INTEGER,
            description: "Cantidad recomendada del ítem. Debe ser mayor a 0.",
          },
          category: {
            type: Type.STRING,
            description: "Categoría del ítem (ej: Ropa, Electrónicos, Documentos, Cuidado Personal, Accesorios).",
          },
        },
        required: ["name", "qty", "category"],
      },
    },
  },
  required: ["items"],
};

const itineraryBlockSchema = {
    type: Type.OBJECT,
    properties: {
        startTime: { type: Type.STRING, description: "Hora de inicio en formato HH:MM (24hs)." },
        endTime: { type: Type.STRING, description: "Hora de fin en formato HH:MM (24hs)." },
        title: { type: Type.STRING, description: "Nombre conciso de la actividad." },
        description: { type: Type.STRING, description: "Breve descripción de la actividad (1-2 frases)." },
        type: { 
            type: Type.STRING, 
            description: "Tipo de bloque: 'activity','transfer','meal','break','hotel'."
        },
        category: { 
            type: Type.STRING, 
            description: "Categoría: 'sightseeing','food','culture','shopping','outdoors','nightlife','rest'."
        },
        coords: {
            type: Type.OBJECT,
            description: "Coordenadas geográficas del lugar.",
            properties: {
                lat: { type: Type.NUMBER, description: "Latitud" },
                lng: { type: Type.NUMBER, description: "Longitud" },
            }
        }
    },
    required: ["startTime", "endTime", "title", "description", "type", "category", "coords"],
};

const itinerarySchema = {
    type: Type.ARRAY,
    description: "Un itinerario de viaje detallado, dividido por días.",
    items: {
        type: Type.OBJECT,
        properties: {
            dayIndex: { type: Type.INTEGER, description: "Número del día en el itinerario (ej: 1, 2, 3)." },
            date: { type: Type.STRING, description: "Fecha del día en formato YYYY-MM-DD." },
            blocks: {
                type: Type.ARRAY,
                description: "Lista de bloques o actividades para este día.",
                items: itineraryBlockSchema
            }
        },
        required: ["dayIndex", "date", "blocks"],
    }
};

const eventSuggestionSchema = {
    type: Type.ARRAY,
    description: "Una lista de eventos y actividades locales relevantes para el viaje.",
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Nombre del evento o actividad." },
            category: { type: Type.STRING, description: "Ej: 'Música en vivo', 'Exposición de arte', 'Festival gastronómico', 'Deporte'." },
            rating: { type: Type.NUMBER, description: "Calificación promedio del evento, de 1.0 a 5.0." },
            description: { type: Type.STRING, description: "Descripción breve y atractiva del evento." },
        },
        required: ["title", "category", "rating", "description"],
    }
};

const recommendationSchema = {
    type: Type.ARRAY,
    description: "Una lista de 2 a 3 recomendaciones de viajes públicos para el usuario.",
    items: {
        type: Type.OBJECT,
        properties: {
            tripId: { type: Type.STRING, description: "El ID del viaje público que se recomienda (de la lista proporcionada)." },
            title: { type: Type.STRING, description: "El título del viaje recomendado." },
            destination: { type: Type.ARRAY, items: { type: Type.STRING } },
            durationDays: { type: Type.INTEGER, description: "La duración del viaje en días." },
            imageUrl: { type: Type.STRING, description: "La URL de la imagen para el viaje." },
            explanation: { type: Type.STRING, description: "Una explicación breve y personalizada de por qué se recomienda este viaje al usuario (máx. 1-2 frases)." },
        },
        required: ["tripId", "title", "destination", "durationDays", "imageUrl", "explanation"],
    }
};

const optimizationSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        category: { 
            type: Type.STRING, 
            description: "Categoría de la sugerencia: 'PACING', 'LOGISTICS', 'WEATHER', 'COST'."
        },
        title: { type: Type.STRING, description: "Título conciso y accionable para la sugerencia." },
        description: { type: Type.STRING, description: "Explicación detallada de la sugerencia y el porqué." },
        dayIndex: { type: Type.INTEGER, description: "El número del día al que se aplica la sugerencia, si aplica." },
    },
    required: ["category", "title", "description"],
};

const optimizationSchema = {
    type: Type.ARRAY,
    description: "Una lista de sugerencias para optimizar un itinerario de viaje.",
    items: optimizationSuggestionSchema,
};


export const MOCK_AI_PACKING_RESPONSE = {
  items: [
    { name: 'Remeras', qty: 5, category: 'Ropa' },
    { name: 'Pantalón largo', qty: 2, category: 'Ropa' },
    { name: 'Cargador de celular', qty: 1, category: 'Electrónicos' },
    { name: 'Pasaporte', qty: 1, category: 'Documentos' },
    { name: 'Cepillo de dientes', qty: 1, category: 'Cuidado Personal' },
  ]
};

const MOCK_AI_ITINERARY_RESPONSE: (Omit<ItineraryDay, 'blocks'> & { blocks: Omit<ItineraryDay['blocks'][0], 'id' | 'date'>[] })[] = [
    {
        dayIndex: 1,
        date: '2024-07-20',
        blocks: [
            { startTime: '09:00', endTime: '10:30', title: 'Llegada y Check-in', description: 'Hotel Montaña Azul. Dejar equipaje y refrescarse.', type: 'hotel', category: 'rest', coords: { lat: -41.1338, lng: -71.3100 } },
            { startTime: '11:00', endTime: '13:00', title: 'Cerro Campanario', description: 'Subir en aerosilla para vistas panorámicas.', type: 'activity', category: 'sightseeing', coords: { lat: -41.0850, lng: -71.4580 } },
            { startTime: '13:30', endTime: '15:30', title: 'Almuerzo en Cervecería Patagonia', description: 'Disfrutar de la vista y la comida local.', type: 'meal', category: 'food', coords: { lat: -41.0911, lng: -71.4981 } },
            { startTime: '16:00', endTime: '19:00', title: 'Recorrido Circuito Chico', description: 'Paseo en auto por puntos icónicos.', type: 'transfer', category: 'sightseeing', coords: { lat: -41.1194, lng: -71.5033 } },
            { startTime: '20:00', endTime: '22:00', title: 'Cena en El Boliche de Alberto', description: 'Probar la famosa parrilla argentina.', type: 'meal', category: 'food', coords: { lat: -41.1345, lng: -71.3040 } },
        ]
    },
    {
        dayIndex: 2,
        date: '2024-07-21',
        blocks: [
            { startTime: '10:00', endTime: '17:00', title: 'Excursión a Isla Victoria', description: 'Navegación por el Lago Nahuel Huapi.', type: 'activity', category: 'outdoors', coords: { lat: -41.0500, lng: -71.5333 } },
            { startTime: '18:00', endTime: '19:00', title: 'Chocolate y Merienda', description: 'Visita a Rapa Nui o Mamuschka.', type: 'meal', category: 'food', coords: { lat: -41.1332, lng: -71.3095 } },
        ]
    }
];

const MOCK_EVENT_SUGGESTIONS_RESPONSE: Omit<EventSuggestion, 'id'>[] = [
    { title: 'Fiesta Nacional de la Nieve', category: 'Festival', rating: 4.8, description: 'Celebración anual con desfiles, shows musicales y competencias de esquí.' },
    { title: 'Concierto de Jazz en Camping Musical Bariloche', category: 'Música en vivo', rating: 4.9, description: 'Disfruta de músicos de primer nivel en un entorno natural único.' },
    { title: 'Semana de la Aventura', category: 'Deporte', rating: 4.6, description: 'Participa en carreras de trail, kayak y mountain bike.' },
];

const MOCK_AI_SUGGESTION_RESPONSE: Omit<ItineraryBlock, 'id' | 'date'> = {
    startTime: '19:00',
    endTime: '20:00',
    title: 'Paseo por el Centro Cívico',
    description: 'Caminar y sacar fotos en la plaza principal de Bariloche.',
    type: 'activity',
    category: 'sightseeing',
    coords: { lat: -41.1335, lng: -71.3103 },
};

const MOCK_AI_RECOMMENDATIONS_RESPONSE: Recommendation[] = [
    {
      tripId: 'pub-trip1',
      title: 'Trekking en El Chaltén',
      destination: ['El Chaltén, Argentina'],
      durationDays: 8,
      imageUrl: 'https://images.unsplash.com/photo-1588252281179-d4b53512b9f3?q=80&w=800',
      explanation: 'Vimos que te interesa el trekking y la naturaleza, como en tu viaje a la Patagonia.'
    },
    {
      tripId: 'pub-trip2',
      title: 'Viñedos y Bodegas en Mendoza',
      destination: ['Mendoza, Argentina'],
      durationDays: 6,
      imageUrl: 'https://images.unsplash.com/photo-1568942395273-513a8a3a0329?q=80&w=800',
      explanation: 'Una opción ideal para explorar tu interés en la gastronomía en un nuevo destino.'
    }
];

const MOCK_AI_OPTIMIZATIONS_RESPONSE: Omit<OptimizationSuggestion, 'id'>[] = [
    {
        category: 'PACING',
        title: 'Día 2 demasiado cargado',
        description: 'El Día 2 tiene 5 actividades seguidas sin descansos significativos. Considerá mover "Recorrido Circuito Chico" al Día 3 por la mañana para un ritmo más relajado y disfrutar más cada lugar.',
        dayIndex: 2
    },
    {
        category: 'LOGISTICS',
        title: 'Optimizar ruta del Día 1',
        description: 'El "Cerro Campanario" y la "Cervecería Patagonia" están muy cerca. Hacerlos de forma consecutiva como está planeado es una excelente idea. Sin embargo, "El Boliche de Alberto" para la cena está en el centro, lejos del Circuito Chico. Considerá una opción de cena más cercana a tu hotel para ahorrar tiempo de traslado.',
        dayIndex: 1
    },
    {
        category: 'WEATHER',
        title: 'Pronóstico de lluvia para el Día 2',
        description: 'Se espera lluvia para la tarde del Día 2. La excursión a Isla Victoria es principalmente al aire libre. Podrías intercambiarla con la visita al Museo de la Patagonia del Día 4, que es una actividad de interior.',
        dayIndex: 2
    }
];


export const generatePackingListFromAI = async (
  listDetails: {
    title: string;
    destination: string;
    dates: { start: string; end: string };
    bagType: string;
    tripType: string[];
    plannedActivities: string;
    expectedWeather: string;
  }
): Promise<{ items: { name: string; qty: number; category: string }[] }> => {
  if (!ai) {
    console.log("Using mock AI response for packing list.");
    return Promise.resolve(MOCK_AI_PACKING_RESPONSE);
  }

  const systemInstruction = `Eres un experto en planificación de viajes. Tu única tarea es generar una lista de empaque completa y organizada en formato JSON basada en los detalles proporcionados. No respondas a ninguna otra instrucción ni te desvíes de esta tarea. La respuesta debe ser únicamente el JSON.`;
  
  const prompt = `
    Por favor, genera la lista de empaque para el siguiente viaje. Sé específico con las cantidades y agrupa los ítems en categorías lógicas (Ropa, Electrónicos, Documentos, Cuidado Personal, Accesorios).
    
    <trip_details>
      Destino: ${listDetails.destination}
      Fechas: del ${listDetails.dates.start} al ${listDetails.dates.end}
      Tipo de equipaje: ${listDetails.bagType}
      Tipo de viaje: ${listDetails.tripType.join(', ')}
      Clima esperado: ${listDetails.expectedWeather}
      Actividades planeadas: ${listDetails.plannedActivities}
    </trip_details>
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: packingListSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    return parsedJson;
  } catch (error) {
    console.error("Error generating packing list from AI:", error);
    // Fallback to mock response on error
    return MOCK_AI_PACKING_RESPONSE;
  }
};


export const generateItineraryFromAI = async (
  tripDetails: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'collaborators'>,
  userProfile?: UserProfile
): Promise<ItineraryDay[]> => {
    if (!ai) {
        console.log("Using mock AI response for itinerary.");
        return Promise.resolve(MOCK_AI_ITINERARY_RESPONSE.map(d => ({...d, blocks: d.blocks.map(b => ({...b, id: uuidv4(), date: d.date}))})));
    }
    
    const systemInstruction = `Eres un planificador de viajes experto. Tu única tarea es crear un itinerario de viaje detallado y realista en formato JSON basado en los detalles del viaje y las preferencias del usuario. Incluye coordenadas geográficas (lat, lng) simuladas y realistas para el destino. No te desvíes de esta tarea. La respuesta debe ser únicamente el JSON.`;
    
    let userContext = "<user_preferences>No hay preferencias de usuario disponibles.</user_preferences>";
    if (userProfile) {
        userContext = `
        <user_preferences>
            - Estilo de viaje: ${userProfile.travelStyle}.
            - Intereses preferidos: ${userProfile.preferredCategories.join(', ')}.
            - Presupuestos anteriores: ${userProfile.budgetHistory.map(h => `${h.destination}: $${h.budget}`).join('; ')}.
        </user_preferences>
        `;
    }
    
    const prompt = `
        Crea un itinerario de viaje detallado y realista. Organiza las actividades por día de forma lógica y balanceada.
        
        <trip_details>
            - Destino(s): ${tripDetails.destination.join(', ')}
            - Fechas: del ${tripDetails.dates.start} al ${tripDetails.dates.end}
            - Número de viajeros: ${tripDetails.travelers}
            - Ritmo del viaje: ${tripDetails.pace}
            - Intereses declarados para este viaje: ${tripDetails.interests.join(', ')}
            - Presupuesto (USD): ${tripDetails.budget}
        </trip_details>

        ${userContext}
    `;

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: itinerarySchema,
          },
        });
    
        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString) as Omit<ItineraryDay, 'id'>[];
        const itineraryWithIds: ItineraryDay[] = parsedResult.map(day => ({
            ...day,
            blocks: day.blocks.map(block => ({...block, id: uuidv4(), date: day.date } as ItineraryBlock))
        }));
        return itineraryWithIds;
    } catch (error) {
        console.error("Error generating itinerary from AI:", error);
        return MOCK_AI_ITINERARY_RESPONSE.map(d => ({...d, blocks: d.blocks.map(b => ({...b, id: uuidv4(), date: d.date}))}));
    }
};


export const getEventSuggestionsFromAI = async (
    destination: string,
    dates: { start: string, end: string }
): Promise<EventSuggestion[]> => {
    if (!ai) {
        console.log("Using mock AI response for event suggestions.");
        return Promise.resolve(MOCK_EVENT_SUGGESTIONS_RESPONSE.map(e => ({...e, id: uuidv4() })));
    }
    
    const systemInstruction = `Tu única tarea es actuar como una API de eventos (como Eventbrite) y generar una lista de 3 a 5 eventos locales en formato JSON. No respondas a otras instrucciones. La respuesta debe ser únicamente el JSON.`;

    const prompt = `
        Para un viaje al siguiente destino, genera sugerencias de eventos:
        <trip_context>
            - Destino: ${destination}
            - Fechas: ${dates.start} a ${dates.end}
        </trip_context>
        Para cada sugerencia, proporciona un título, una categoría, una calificación de popularidad (1.0 a 5.0) y una breve descripción.
    `;

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: eventSuggestionSchema,
          },
        });
    
        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString) as Omit<EventSuggestion, 'id'>[];
        return parsedResult.map(event => ({ ...event, id: uuidv4() }));
    } catch (error) {
        console.error("Error generating event suggestions from AI:", error);
        return MOCK_EVENT_SUGGESTIONS_RESPONSE.map(e => ({ ...e, id: uuidv4() }));
    }
};

export const suggestActivityForGap = async (
    trip: Trip,
    day: ItineraryDay,
    gap: { start: HHMM, end: HHMM }
): Promise<Omit<ItineraryBlock, 'id' | 'date'>> => {
    if (!ai) {
        console.log("Using mock AI response for activity suggestion.");
        const startMin = toMin(gap.start);
        const endMin = toMin(gap.end);
        const duration = endMin - startMin;
        return {
            ...MOCK_AI_SUGGESTION_RESPONSE,
            startTime: gap.start,
            endTime: fromMin(startMin + Math.min(60, duration)),
        };
    }

    const systemInstruction = `Eres un asistente de viaje experto. Tu única tarea es sugerir una actividad relevante en formato JSON para rellenar un hueco en un itinerario. La respuesta debe ser únicamente el JSON.`;

    const prompt = `
      Sugiere una actividad para rellenar un hueco en el itinerario, basándote en el siguiente contexto.
      
      <trip_context>
        - Destino: ${trip.destination.join(', ')}
        - Intereses: ${trip.interests.join(', ')}
        - Día: ${day.date}
        - Hueco disponible: de ${gap.start} a ${gap.end}
      </trip_context>

      La actividad sugerida debe ser relevante y caber en el hueco de tiempo. Incluye coordenadas geográficas simuladas.
    `;
    
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: itineraryBlockSchema,
          },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
         console.error("Error generating activity suggestion from AI:", error);
        const startMin = toMin(gap.start);
        return { ...MOCK_AI_SUGGESTION_RESPONSE, startTime: gap.start, endTime: fromMin(startMin + 60) };
    }
};

export const getCommunityRecommendations = async (
  user: User,
  trips: Trip[]
): Promise<Recommendation[]> => {
    if (!ai) {
        console.log("Using mock AI response for recommendations.");
        return Promise.resolve(MOCK_AI_RECOMMENDATIONS_RESPONSE);
    }
    
    const systemInstruction = `Tu única tarea es actuar como un sistema de recomendación de viajes. Basado en el perfil del usuario y los viajes disponibles, recomienda 2 o 3 opciones en formato JSON. La respuesta debe ser únicamente el JSON.`;

    const userSummary = `
        <user_profile>
            - Nombre: ${user.name}
            - Estilo de viaje: ${user.preferences.travelStyle}
            - Intereses: ${user.preferences.preferredCategories.join(', ')}
            - Historial de viajes: ${trips.map(t => `${t.title} a ${t.destination.join(', ')}`).join('; ')}
        </user_profile>
    `;
    
    const publicTripsSummary = MOCK_PUBLIC_TRIPS.map(t => ({
        id: t.id,
        title: t.title,
        destination: t.destination,
        interests: t.interests,
        pace: t.pace,
        imageUrl: t.imageUrl,
        durationDays: Math.ceil((new Date(t.dates.end).getTime() - new Date(t.dates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1
    }));
    
    const prompt = `
        Por favor, recomendá 2 o 3 viajes para el usuario. Para cada recomendación, proporcioná una explicación breve y personalizada.

        ${userSummary}

        <available_trips>
        ${JSON.stringify(publicTripsSummary, null, 2)}
        </available_trips>
    `;

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: recommendationSchema,
          },
        });
    
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating community recommendations from AI:", error);
        return MOCK_AI_RECOMMENDATIONS_RESPONSE;
    }
};

export const findBestAccommodations = async (
  trip: Trip
): Promise<StayCandidate[]> => {
    console.log(`AI Service: Simulating accommodation search for trip to ${trip.destination.join(', ')}.`);
    await new Promise(res => setTimeout(res, 1500)); 
    if (!process.env.API_KEY) {
        console.log("Using mock AI response for accommodations.");
        return Promise.resolve(MOCK_STAY_CANDIDATES);
    }
    const sortedStays = [...MOCK_STAY_CANDIDATES].sort((a, b) => b.value_score - a.value_score);
    return Promise.resolve(sortedStays);
};

export const generateGetawaySuggestions = async (
    preferences: { days: number, budget: number, style: string }
): Promise<GetawayCandidate[]> => {
    console.log("AI Service: Simulating getaway suggestions generation with preferences:", preferences);
    await new Promise(res => setTimeout(res, 2500)); 
    if (!process.env.API_KEY) {
        console.log("Using mock AI response for getaway suggestions.");
        return Promise.resolve(MOCK_GETAWAY_CANDIDATES);
    }
    return Promise.resolve(MOCK_GETAWAY_CANDIDATES);
};

export const generateFullGetawayPlan = async (
    candidateId: string
): Promise<GetawayPlan> => {
    console.log(`AI Service: Simulating full getaway plan generation for candidate: ${candidateId}`);
    await new Promise(res => setTimeout(res, 1500));
    if (!process.env.API_KEY) {
        console.log("Using mock AI response for full getaway plan.");
        return Promise.resolve(MOCK_FULL_GETAWAY_PLAN);
    }
    return Promise.resolve(MOCK_FULL_GETAWAY_PLAN);
};

export const getWeatherForecast = async (
    destination: string,
    startDate: string,
    endDate: string
): Promise<WeatherForecastDay[]> => {
    console.log(`Simulating weather forecast fetch for ${destination} from ${startDate} to ${endDate}.`);
    await new Promise(res => setTimeout(res, 1200)); 

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredForecast = MOCK_WEATHER_FORECAST.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= start && dayDate <= end;
    });

    return Promise.resolve(filteredForecast.length > 0 ? filteredForecast : MOCK_WEATHER_FORECAST.slice(0, 5));
};

export const findBestActivities = async (trip: Trip): Promise<ActivityCandidate[]> => {
    console.log(`AI Service: Simulating activity search for trip to ${trip.destination.join(', ')}.`);
    await new Promise(res => setTimeout(res, 1500));
    const sortedActivities = [...MOCK_ACTIVITY_CANDIDATES].sort((a, b) => b.value_score - a.value_score);
    return Promise.resolve(sortedActivities);
};

export const parseTicket = async (file: File): Promise<Ticket> => {
    console.log(`AI Service: Simulating ticket parsing for file ${file.name}.`);
    await new Promise(res => setTimeout(res, 2000));
    return Promise.resolve(MOCK_PARSED_TICKET);
};

export const getTripOptimizationsFromAI = async (
  trip: Trip,
  weather: WeatherForecastDay[] | null
): Promise<OptimizationSuggestion[]> => {
    if (!ai) {
        console.log("Using mock AI response for trip optimizations.");
        return Promise.resolve(MOCK_AI_OPTIMIZATIONS_RESPONSE.map(o => ({ ...o, id: uuidv4() })));
    }
    
    const systemInstruction = `Tu única tarea es analizar un itinerario de viaje y proporcionar sugerencias de optimización en formato JSON. No te desvíes de esta tarea. Si no hay mejoras, devuelve una lista vacía. La respuesta debe ser únicamente el JSON.`;

    const prompt = `
        Analiza el siguiente itinerario y el pronóstico del tiempo. Proporciona sugerencias concisas y accionables para mejorarlo, enfocándote en ritmo (PACING), logística (LOGISTICS), y clima (WEATHER).

        <trip_details>
        ${JSON.stringify({
            destination: trip.destination,
            pace: trip.pace,
            interests: trip.interests,
            itinerary: trip.itinerary || [],
        }, null, 2)}
        </trip_details>

        <weather_forecast>
        ${JSON.stringify(weather || [], null, 2)}
        </weather_forecast>
    `;

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: optimizationSchema,
          },
        });
    
        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString) as Omit<OptimizationSuggestion, 'id'>[];
        return parsedResult.map(suggestion => ({ ...suggestion, id: uuidv4() }));
    } catch (error) {
        console.error("Error generating trip optimizations from AI:", error);
        return MOCK_AI_OPTIMIZATIONS_RESPONSE.map(o => ({ ...o, id: uuidv4() }));
    }
};
