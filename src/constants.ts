import type { Trip, PackingList, Gear, PackingListItem, TripMember, StayCandidate, GetawayCandidate, GetawayPlan, WeatherForecastDay, ActivityCandidate, Ticket, PackingCategory } from './types.ts';

export const USER_STORAGE_KEY = 'sasgo_user';
export const AUTH_TOKEN_KEY = 'sasgo_auth_token';
export const NOTIFICATIONS_STORAGE_KEY = 'sasgo_notifications_settings';

// Get today's date and calculate other dates based on it for dynamic statuses
const today = new Date();
const toYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

const tripOngoingStart = new Date(today);
tripOngoingStart.setDate(today.getDate() - 2);
const tripOngoingEnd = new Date(today);
tripOngoingEnd.setDate(today.getDate() + 4);

const tripFinishedStart = new Date(today);
tripFinishedStart.setDate(today.getDate() - 30);
const tripFinishedEnd = new Date(today);
tripFinishedEnd.setDate(today.getDate() - 23);


export const MOCK_TRIPS: Trip[] = [
    {
        id: 'trip1',
        userId: 'user1',
        title: 'Aventura en la Patagonia',
        destination: ['Bariloche, Argentina'],
        dates: { start: '2024-08-20', end: '2024-08-27' },
        travelers: 2,
        pace: 'moderate',
        budget: 2000,
        interests: ['naturaleza', 'trekking', 'gastronomía'],
        createdAt: '2024-05-10T10:00:00Z',
        itineraryCompletion: 38,
        packingListId: 'pl1',
        privacy: 'private',
        version: 1,
        // FIX: Added missing 'members' property to satisfy the Trip type.
        members: [
            { id: 'user1', name: 'Alex Viajero', email: 'viajero@sasgo.com', avatarUrl: 'https://i.pravatar.cc/150?u=viajero@sasgo.com', role: 'OWNER' }
        ],
        weather: { averageTemp: 5, condition: 'snowy' },
        packingProgress: { total: 42, packed: 16 },
        imageUrl: 'https://images.unsplash.com/photo-1588252281179-d4b53512b9f3?q=80&w=800'
    },
    {
        id: 'trip2',
        userId: 'user1',
        title: 'Fin de semana en la Costa',
        destination: ['Mar del Plata, Argentina'],
        dates: { start: toYYYYMMDD(tripOngoingStart), end: toYYYYMMDD(tripOngoingEnd) }, // Ongoing
        travelers: 4,
        pace: 'relaxed',
        budget: 800,
        interests: ['playa', 'familia', 'gastronomía'],
        createdAt: '2024-06-15T12:00:00Z',
        itineraryCompletion: 80,
        privacy: 'link',
        members: [
            { id: 'user1', name: 'Alex Viajero', email: 'viajero@sasgo.com', avatarUrl: 'https://i.pravatar.cc/150?u=viajero@sasgo.com', role: 'OWNER' },
            { id: 'user2', name: 'Maria Sol', email: 'maria@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=maria@example.com', role: 'EDITOR' }
        ],
        version: 3,
        weather: { averageTemp: 22, condition: 'sunny' },
        packingProgress: { total: 25, packed: 20 },
        imageUrl: 'https://images.unsplash.com/photo-1610212570398-317173357599?q=80&w=800'
    },
    {
        id: 'trip3',
        userId: 'user1',
        title: 'Ruta del Vino',
        destination: ['Mendoza, Argentina'],
        dates: { start: '2024-10-05', end: '2024-10-12' },
        travelers: 2,
        pace: 'moderate',
        budget: 2500,
        interests: ['vinos', 'gastronomía', 'paisajes'],
        createdAt: '2024-07-01T15:00:00Z',
        itineraryCompletion: 15,
        privacy: 'public',
        members: [
            { id: 'user1', name: 'Alex Viajero', email: 'viajero@sasgo.com', avatarUrl: 'https://i.pravatar.cc/150?u=viajero@sasgo.com', role: 'OWNER' }
        ],
        version: 1,
        weather: { averageTemp: 18, condition: 'cloudy' },
        packingProgress: { total: 30, packed: 5 },
        imageUrl: 'https://images.unsplash.com/photo-1568942395273-513a8a3a0329?q=80&w=800'
    },
     {
        id: 'trip4',
        userId: 'user1',
        title: 'Explorando el Norte',
        destination: ['Salta, Argentina', 'Jujuy, Argentina'],
        dates: { start: toYYYYMMDD(tripFinishedStart), end: toYYYYMMDD(tripFinishedEnd) }, // Finished
        travelers: 1,
        pace: 'fast-paced',
        budget: 1500,
        interests: ['cultura', 'historia', 'naturaleza'],
        createdAt: '2024-03-20T09:00:00Z',
        itineraryCompletion: 100,
        packingListId: 'pl1',
        privacy: 'private',
        members: [
             { id: 'user1', name: 'Alex Viajero', email: 'viajero@sasgo.com', avatarUrl: 'https://i.pravatar.cc/150?u=viajero@sasgo.com', role: 'OWNER' }
        ],
        version: 5,
        weather: { averageTemp: 25, condition: 'sunny' },
        packingProgress: { total: 35, packed: 35 },
        imageUrl: 'https://images.unsplash.com/photo-1628759322965-7480e74d1566?q=80&w=800'
    },
];

export const MOCK_FULL_PACKING_LIST_V6: PackingList = {
    id: 'pl1',
    tripId: 'trip1',
    title: 'Equipaje para Bariloche',
    items: [
        { id: 'item1', name: 'Campera de nieve', qty: 1, category: 'ropa', packed: true, notes: 'La más abrigada' },
        { id: 'item2', name: 'Buzo térmico', qty: 3, category: 'ropa', packed: true },
        { id: 'item3', name: 'Pantalón de trekking', qty: 2, category: 'ropa', packed: false },
        { id: 'item4', name: 'Botas de montaña', qty: 1, category: 'calzado', packed: true },
        { id: 'item5', name: 'Pasaporte', qty: 1, category: 'documentos', packed: false, notes: 'Verificar vencimiento' },
        { id: 'item6', name: 'Cargador portátil', qty: 1, category: 'electrónica', packed: true },
        { id: 'item7', name: 'Cepillo de dientes', qty: 1, category: 'higiene', packed: false },
        { id: 'item8', name: 'Guantes', qty: 2, category: 'ropa', packed: false },
        { id: 'item9', name: 'Gorro', qty: 1, category: 'ropa', packed: false },
        { id: 'item10', name: 'Anteojos de sol', qty: 1, category: 'otros', packed: true },
        { id: 'item11', name: 'Ibuprofeno', qty: 1, category: 'salud', packed: false },
    ]
};

export const MOCK_GEAR: Gear[] = [
    {
        id: 'gear1',
        serial: 'ST-MOVA-24-CEL-AB12CD34',
        qrCode: 'qr-mova-1',
        modelName: 'Mova Valija Carry-On',
        color: 'celeste',
        size: '24"',
        purchaseDate: '2024-01-15',
        channel: 'tienda online',
        warrantyExpiresAt: '2026-01-16T10:00:00Z',
        tickets: [
            // FIX: Corrected status to match enum.
            { id: 't1', createdAt: '2024-03-20T10:00:00Z', category: 'reparación', description: 'Una de las ruedas no gira bien.', status: 'LISTO_ENTREGADO' }
        ]
    },
    {
        id: 'gear2',
        serial: 'ST-CAPRI-23-ROJ-EF56GH78',
        qrCode: 'qr-capri-1',
        modelName: 'Capri Mochila Urbana',
        color: 'rojo',
        size: '25L',
        purchaseDate: '2023-11-01',
        channel: 'sucursal',
        warrantyExpiresAt: '2024-11-01T10:00:00Z',
        tickets: []
    }
];

export const MOCK_PRODUCT_CATALOG = [
    { modelCode: 'ST-MOVA-24', modelName: 'Mova Valija Carry-On', defaultWarrantyMonths: 24 },
    { modelCode: 'ST-CAPRI-23', modelName: 'Capri Mochila Urbana', defaultWarrantyMonths: 12 },
];


export const MOCK_STAY_CANDIDATES: StayCandidate[] = [
    {
        place_id: 'stay1', name: 'Hotel Montaña Azul', type: 'hotel', neighborhood: 'Centro Cívico', coords: { lat: -41.1335, lng: -71.3103 },
        rating: 4.5, reviews_count: 1200, price_level: 3, price_estimate_nightly: 150, currency: 'USD',
        amenities: ['wifi', 'desayuno', 'piscina'], distance_to_pois_km: 0.5, transit_score: 9, safety_score: 8, value_score: 9.5,
        sources: ['booking.com', 'expedia.com'], imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
    },
    {
        place_id: 'stay2', name: 'Cabañas del Bosque', type: 'apartment', neighborhood: 'Villa Los Coihues', coords: { lat: -41.1495, lng: -71.4258 },
        rating: 4.8, reviews_count: 850, price_level: 2, price_estimate_nightly: 110, currency: 'USD',
        amenities: ['wifi', 'cocina', 'estacionamiento'], distance_to_pois_km: 8.2, transit_score: 5, safety_score: 9, value_score: 8.9,
        sources: ['airbnb.com'], imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800'
    }
];

export const MOCK_GETAWAY_CANDIDATES: GetawayCandidate[] = [
    { id: 'getaway1', destination: 'Tigre, Buenos Aires', travelTime: '1h en auto', estimatedCost: 150, weather: '22°C Soleado', imageUrl: 'https://images.unsplash.com/photo-1580553625749-c76a91159828?q=80&w=800', valueScore: 9.2, explanation: 'Un escape rápido y relajante cerca de la ciudad, ideal para paseos en lancha.' },
    { id: 'getaway2', destination: 'Chascomús, Buenos Aires', travelTime: '1.5h en auto', estimatedCost: 120, weather: '21°C Parcialmente Nublado', imageUrl: 'https://images.unsplash.com/photo-1621687922960-ff5c13824056?q=80&w=800', explanation: 'Perfecto para desconectar junto a la laguna y disfrutar de la tranquilidad.' },
];

export const MOCK_FULL_GETAWAY_PLAN: GetawayPlan = {
    id: 'plan1',
    candidate: MOCK_GETAWAY_CANDIDATES[0],
    transportPlan: { mode: 'auto', details: 'Tomar Autopista Panamericana Ramal Tigre.', estimatedCost: 20, duration: '1h' },
    hotelPlan: { name: 'Wyndham Nordelta', type: 'Hotel 5 estrellas', estimatedCost: 200 },
    itinerary: [{ date: 'Sábado', blocks: [{ id: 'b1', date: 'Sábado', startTime: '14:00', endTime: '16:00', title: 'Paseo en Catamarán', type: 'activity', category: 'outdoors' }] }],
    packingList: [{ name: 'Repelente de mosquitos', qty: 1, category: 'higiene' }, { name: 'Gorra', qty: 1, category: 'ropa' }],
    budgetBreakdown: [{ category: 'Transporte', amount: 20 }, { category: 'Alojamiento', amount: 200 }, { category: 'Comida', amount: 80 }, { category: 'Actividades', amount: 50 }],
    totalEstimatedCost: 350
};

export const MOCK_WEATHER_FORECAST: WeatherForecastDay[] = [
    { date: '2024-08-20', condition: 'snowy', icon: '❄️', temp_max: 2, temp_min: -5 },
    { date: '2024-08-21', condition: 'partly_cloudy', icon: '⛅️', temp_max: 3, temp_min: -4 },
    { date: '2024-08-22', condition: 'sunny', icon: '☀️', temp_max: 5, temp_min: -2 },
];

export const MOCK_ACTIVITY_CANDIDATES: ActivityCandidate[] = [
    { place_id: 'act1', name: 'Cerro Campanario (Aerosilla)', type: 'attraction', rating: 4.9, reviews_count: 5000, price_estimate: 15, currency: 'USD', value_score: 9.8, top_review_summary: { pros: ['Vistas increíbles', 'Rápido ascenso'], cons: ['Puede haber viento'] }, sources: ['viator.com'], imageUrl: 'https://images.unsplash.com/photo-1609670230350-7987f6b4d3a3?q=80&w=800', isIndoor: false, durationMin: 90, queueRisk: 'medium', isAccessible: true, isFamilyFriendly: true },
    { place_id: 'act2', name: 'Museo de la Patagonia', type: 'museum', rating: 4.5, reviews_count: 1500, price_estimate: 5, currency: 'USD', value_score: 8.5, top_review_summary: { pros: ['Interesante historia local', 'Bien conservado'], cons: ['Un poco pequeño'] }, sources: ['tripadvisor.com'], imageUrl: 'https://images.unsplash.com/photo-1580553625749-c76a91159828?q=80&w=800', isIndoor: true, durationMin: 75, queueRisk: 'low', isAccessible: true, isFamilyFriendly: true },
];

export const MOCK_PARSED_TICKET: Ticket = {
    id: 'ticket-parsed-1', activity_place_id: 'act1', activityName: 'Cerro Campanario (Aerosilla)', holder_name: 'Alex Viajero', start_iso: '2024-08-21T14:00:00Z', qrCode: '...', source: 'upload'
};

export const MOCK_PUBLIC_TRIPS: Trip[] = [
    { id: 'pub-trip1', userId: 'user2', title: 'Trekking en El Chaltén', destination: ['El Chaltén, Argentina'], dates: { start: '2024-11-10', end: '2024-11-18' }, travelers: 1, pace: 'fast-paced', budget: 1800, interests: ['trekking', 'montaña', 'naturaleza'], createdAt: '2024-07-01T10:00:00Z', members: [], privacy: 'public', imageUrl: 'https://images.unsplash.com/photo-1588252281179-d4b53512b9f3?q=80&w=800' },
    { id: 'pub-trip2', userId: 'user3', title: 'Viñedos y Bodegas en Mendoza', destination: ['Mendoza, Argentina'], dates: { start: '2024-10-05', end: '2024-10-11' }, travelers: 2, pace: 'relaxed', budget: 2200, interests: ['vinos', 'gastronomía'], createdAt: '2024-06-20T10:00:00Z', members: [], privacy: 'public', imageUrl: 'https://images.unsplash.com/photo-1568942395273-513a8a3a0329?q=80&w=800' },
];