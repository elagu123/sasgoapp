export type HHMM = `${string}:${string}`;

export type BlockType = 'activity' | 'meal' | 'transfer' | 'hotel' | 'break';
export type Category = 'sightseeing' | 'food' | 'culture' | 'shopping' | 'outdoors' | 'nightlife' | 'rest';

export interface ItineraryBlock {
    id: string;
    date: string;
    startTime: HHMM;
    endTime: HHMM;
    title: string;
    description?: string;
    type: BlockType;
    category: Category;
    durationMin?: number;
    updatedAt?: string;
    coords?: {
        lat: number;
        lng: number;
    };
    // Nuevos campos para equipaje inteligente
    suggestedItems?: ActivityPackingItem[];
    weatherRequirements?: {
        temperature: number;
        condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
        recommendations: string[];
    };
}

export interface ItineraryDay {
    dayIndex: number;
    date: string; // YYYY-MM-DD
    blocks: ItineraryBlock[];
}

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface TripMember {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: Role;
}

export interface Invite {
    id: string;
    email: string;
    role: Role;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    invitedAt: string;
    invitedBy: string;
}

export type ExpenseCategory = 'alojamiento' | 'comida' | 'transporte' | 'ocio' | 'compras' | 'otros';

export interface Expense {
    id: string;
    tripId: string;
    title: string;
    amount: number; // In cents
    currency: 'USD' | 'ARS' | 'EUR';
    date: string; // YYYY-MM-DD
    category: ExpenseCategory;
}

export type PrivacySetting = 'private' | 'link' | 'public';

export type ReservationType = 'FLIGHT' | 'HOTEL' | 'CAR_RENTAL' | 'OTHER';

export interface Reservation {
    id: string;
    tripId: string;
    type: ReservationType;
    title: string;
    details: Record<string, any>; // Flexible for different reservation types
    startDate: string; // ISO String
    endDate?: string; // ISO String
}

export interface TripDocument {
    id: string;
    tripId: string;
    name: string;
    fileType: string; // e.g., 'application/pdf', 'image/jpeg'
    file: Blob;
    uploadedAt: string; // ISO String
}

export interface Trip {
    id: string;
    userId: string;
    title: string;
    destination: string | string[]; // Support both single destination and array
    startDate: string; // YYYY-MM-DD for compatibility
    endDate: string;   // YYYY-MM-DD for compatibility
    dates?: {
        start: string; // YYYY-MM-DD - backward compatibility
        end: string;   // YYYY-MM-DD - backward compatibility
    };
    travelers: number;
    pace: 'relaxed' | 'moderate' | 'intense';
    budget: number; // In whole currency units, e.g., dollars
    spentBudget?: number; // Amount already spent
    interests: string[];
    createdAt: string; // ISO 8601
    members: TripMember[];
    privacy: PrivacySetting;
    itinerary?: ItineraryDay[];
    itineraryCompletion?: number;
    packingListId?: string;
    packingList?: PackingList;
    expenses?: Expense[];
    reservations?: Reservation[];
    version?: number;
    weather?: {
        averageTemp: number;
        condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
    };
    packingProgress?: {
        total: number;
        packed: number;
    };
    imageUrl?: string;
    image?: string; // Alternative naming for Enhanced components
    selectedAccommodationId?: string;
    
    // Enhanced Dashboard properties
    country?: string; // For flag display
    isFavorite?: boolean;
    isArchived?: boolean;
    
    // Progress tracking for enhanced cards
    itineraryProgress?: number; // Percentage (0-100)
    bookingProgress?: number; // Percentage (0-100)
    documentsProgress?: number; // Percentage (0-100)
    
    // Status tracking
    status?: 'planning' | 'ready' | 'ongoing' | 'completed';
    
    // Smart alerts
    alerts?: {
        id: string;
        type: 'weather' | 'visa' | 'vaccination' | 'booking' | 'packing';
        message: string;
        priority: 'high' | 'medium' | 'low';
        actionable: boolean;
        link?: string;
    }[];
}

export type PackingCategory = 'ropa' | 'calzado' | 'higiene' | 'electrónica' | 'documentos' | 'salud' | 'bebé' | 'trabajo' | 'otros';

export interface ActivityPackingItem {
    name: string;
    category: PackingCategory;
    priority: 1 | 2 | 3; // 1=indispensable, 2=recomendado, 3=opcional
    reason: string; // Por qué se necesita para esta actividad
    weatherDependent?: boolean;
    timeOfDayRelevant?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
}

export interface PackingListItem {
    id: string;
    name: string;
    qty: number;
    category: PackingCategory;
    packed: boolean;
    notes?: string;
    lastUpdatedOfflineAt?: number;
    order?: number;
    // Nuevos campos para conexión con itinerario
    relatedActivities?: string[]; // IDs de actividades que requieren este ítem
    autoSuggested?: boolean; // Si fue sugerido automáticamente por IA
    weatherRelevant?: boolean;
    priority?: 1 | 2 | 3;
}

export interface PackingList {
    id: string;
    tripId: string;
    trip?: Trip;
    title: string;
    items: PackingListItem[];
}

export interface UserProfile {
    travelStyle: 'backpacker' | 'comfort' | 'luxury' | 'balanced';
    preferredCategories: string[];
    budgetHistory: { destination: string; budget: number }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserProfile;
}

export interface EventSuggestion {
    id: string;
    title: string;
    category: string;
    rating: number;
    description: string;
}

export type PatchOp = 'add_block' | 'update_block' | 'remove_block' | 'reorder_blocks' | 'add_item' | 'update_item' | 'remove_item' | 'reorder_items';


export type TicketStatus = 'ABIERTO' | 'EN_REVISION' | 'PRESUPUESTADO' | 'EN_REPARACION' | 'LISTO_ENTREGADO';

export interface GearTicket {
    id: string;
    createdAt: string; // ISO
    category: string; // 'reparación' | 'consulta'
    description: string;
    status: TicketStatus;
}

export interface Gear {
    id: string;
    serial: string;
    qrCode: string;
    modelName: string;
    color: string;
    size: string;
    purchaseDate: string; // ISO String
    channel: string;
    warrantyExpiresAt: string; // ISO String
    tickets: GearTicket[];
}

export interface SavingsCategory {
    id: string;
    name: string;
    budget: number; // in cents
    spent: number;  // in cents
    color?: string;
}

export interface SavingsPlan {
    id:string;
    tripId: string;
    currency: 'USD' | 'EUR' | 'ARS';
    totalCap: number; // in cents
    categories: SavingsCategory[];
}

export interface Recommendation {
    tripId: string; // Corresponds to an ID in MOCK_PUBLIC_TRIPS
    title: string;
    destination: string[];
    durationDays: number;
    imageUrl: string;
    explanation: string;
}

export interface StayCandidate {
    place_id: string;
    name: string;
    type: 'hotel' | 'hostel' | 'apartment' | 'bnb' | 'capsule';
    neighborhood: string;
    coords: { lat: number, lng: number };
    rating: number;
    reviews_count: number;
    price_level: 1 | 2 | 3 | 4;
    price_estimate_nightly: number;
    currency: string;
    amenities: string[];
    distance_to_pois_km: number;
    transit_score: number;
    safety_score: number;
    value_score: number;
    sources: string[];
    imageUrl: string;
}

export interface Neighborhood {
    id: string;
    name: string;
    polygon: any;
    median_price: number;
    value_hotspots: any;
    safety_index: number;
    transit_index: number;
}

export interface GetawayCandidate {
  id: string;
  destination: string;
  travelTime: string; // e.g., "3h en auto"
  estimatedCost: number;
  weather: string; // e.g., "25°C Soleado"
  imageUrl: string;
  valueScore?: number; // for "Mejor valor" badge
  explanation: string; // for the "why" tooltip
}

export interface GetawayTransportPlan {
  mode: 'auto' | 'tren' | 'bus' | 'avión';
  details: string;
  estimatedCost: number;
  duration: string;
}

export interface GetawayHotelPlan {
  name: string;
  type: string;
  estimatedCost: number;
}

export interface GetawayPlan {
  id: string;
  candidate: GetawayCandidate;
  transportPlan: GetawayTransportPlan;
  hotelPlan: GetawayHotelPlan;
  itinerary: Omit<ItineraryDay, 'dayIndex'>[]; // A simplified itinerary
  packingList: Omit<PackingListItem, 'id' | 'packed'>[];
  budgetBreakdown: { category: string; amount: number }[];
  totalEstimatedCost: number;
}

export interface WeatherForecastDay {
    date: string; // YYYY-MM-DD
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly_cloudy';
    icon: string;
    temp_max: number;
    temp_min: number;
}


export interface ActivityCandidate {
    place_id: string;
    name: string;
    type: 'tour' | 'museum' | 'attraction' | 'show' | 'park';
    rating: number;
    reviews_count: number;
    price_estimate: number;
    currency: string;
    value_score: number; // 0 to 10
    top_review_summary: {
        pros: string[];
        cons: string[];
    };
    sources: string[];
    imageUrl: string;
    // New properties for filtering
    isIndoor: boolean;
    durationMin: number;
    queueRisk: 'low' | 'medium' | 'high';
    isAccessible: boolean;
    isFamilyFriendly: boolean;
}

export interface Ticket {
    id: string;
    activity_place_id: string;
    activityName: string;
    holder_name: string;
    start_iso: string;
    qrCode: string; // simulated data
    source: 'upload' | 'email' | 'manual';
    walletLink?: string;
    calendarEventId?: string;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string; // ISO 8601
}

export interface CommentThread {
    id: string; // blockId
    comments: Comment[];
    isResolved: boolean;
}

export interface AwarenessState {
    user: {
        id: string;
        name: string;
        color: string;
    };
    cursor: {
        x: number;
        y: number;
    } | null;
    editingBlock: string | null; // blockId
}

export interface AwareUser {
    clientId: number;
    state: AwarenessState;
}


export type OptimizationCategory = 'PACING' | 'LOGISTICS' | 'WEATHER' | 'COST';

export interface OptimizationSuggestion {
    id: string;
    category: OptimizationCategory;
    title: string;
    description: string;
    dayIndex?: number; // Optional: to link suggestion to a specific day
}