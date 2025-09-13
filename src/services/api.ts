import type { PatchOp, PackingList, PackingCategory, Trip, TripMember, Invite, Role, PackingListItem, User, Expense, Gear, Reservation } from '../types.ts';
import { MOCK_FULL_PACKING_LIST_V6 } from '../constants.ts';
import { v4 as uuidv4 } from 'uuid';

// --- API CLIENT ---
// Centraliza la lógica para hacer llamadas a la API del backend.
// Se encarga de añadir el base URL, las cabeceras (como Authorization),
// y de manejar las respuestas y errores de forma consistente.

const API_BASE_URL = '/api'; // Usamos un proxy de Vite, o sería 'http://localhost:3001/api'

let inMemoryAccessToken: string | null = null;
let csrfTokenInitialized = false;

export const setAuthToken = (token: string | null) => {
    inMemoryAccessToken = token;
};

export const getAuthToken = (): string | null => {
    return inMemoryAccessToken;
};

// Check if we're in production mode without backend
const isProductionWithoutBackend = () => {
    return import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL;
};

// Initialize CSRF token
export const initializeCsrfToken = async (): Promise<void> => {
    if (csrfTokenInitialized) return;

    // Skip CSRF initialization if we're in production without backend
    if (isProductionWithoutBackend()) {
        console.log('Skipping CSRF token initialization - no backend available');
        csrfTokenInitialized = true;
        return;
    }

    try {
        await fetch(`${API_BASE_URL}/auth/csrf-token`, {
            method: 'GET',
            credentials: 'include' // Important for cookies
        });
        csrfTokenInitialized = true;
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        // Mark as initialized to prevent repeated attempts
        csrfTokenInitialized = true;
    }
};

/**
 * Lee el valor de una cookie específica del navegador.
 * @param name El nombre de la cookie a leer.
 * @returns El valor de la cookie o null si no se encuentra.
 */
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

class ApiError extends Error {
    status: number;
    body: any;

    constructor(message: string, status: number, body: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    // Initialize CSRF token for non-safe methods
    const method = options.method?.toUpperCase();
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        await initializeCsrfToken();
    }

    const token = inMemoryAccessToken;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // --- CSRF Protection ---
    // Para métodos que no son seguros, leemos la cookie csrf-token y la enviamos en la cabecera X-CSRF-Token.
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfToken = getCookie('csrf-token');
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        } else {
            console.warn('Cookie de token CSRF no encontrada. La petición podría fallar.');
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies in requests
    });
    
    // Si la respuesta no tiene cuerpo (ej. 204 No Content), no intentes parsear JSON
    if (response.status === 204) {
        return undefined;
    }

    const body = await response.json();

    if (!response.ok) {
        throw new ApiError(body.message || 'Error en la llamada a la API', response.status, body);
    }

    return body;
};


// --- Auth API ---

export const login = async (email: string, password: string): Promise<{ accessToken: string; user: User }> => {
    return apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

export const register = async (name: string, email: string, password: string): Promise<{ user: User }> => {
    return apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
    // Skip refresh if we're in production without backend
    if (isProductionWithoutBackend()) {
        console.log('Skipping token refresh - no backend available');
        throw new Error('No backend available');
    }

    // The browser will automatically send the httpOnly refresh token cookie
    return apiClient('/auth/refresh', { method: 'POST' });
};

export const logout = async (): Promise<void> => {
    // Tell the backend to clear the httpOnly refresh token cookie
    return apiClient('/auth/logout', { method: 'POST' });
};

export const getMe = async (): Promise<{ user: User }> => {
    return apiClient('/auth/me');
};


// --- Trip API (Real Implementation) ---

export const getTrips = async (): Promise<Trip[]> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_TRIPS } = await import('../constants.ts');
        return Promise.resolve(MOCK_TRIPS);
    }
    
    return apiClient('/trips');
};

export const getTrip = async (tripId: string): Promise<Trip> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_TRIPS } = await import('../constants.ts');
        const trip = MOCK_TRIPS.find(t => t.id === tripId);
        if (trip) {
            return Promise.resolve(trip);
        }
        throw new Error(`Trip with id ${tripId} not found`);
    }
    
    return apiClient(`/trips/${tripId}`);
};

export const createTrip = async (tripData: Partial<Omit<Trip, 'id'>>): Promise<Trip> => {
    const payload = {
        title: tripData.title,
        destination: tripData.destination,
        startDate: tripData.dates?.start,
        endDate: tripData.dates?.end,
        budget: tripData.budget
    }
    return apiClient('/trips', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const updateTrip = async (tripId: string, tripData: Partial<Trip>): Promise<Trip> => {
    // El backend espera `startDate` y `endDate` en el cuerpo, no anidados.
    const payload = {
        ...tripData,
        startDate: tripData.dates?.start,
        endDate: tripData.dates?.end,
    };
    delete payload.dates; // Limpiamos el objeto anidado

    return apiClient(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};

export const deleteTrip = async (tripId: string): Promise<void> => {
    await apiClient(`/trips/${tripId}`, { method: 'DELETE' });
};


// --- Packing List API ---

export const getPackingLists = async (): Promise<PackingList[]> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_PACKING_LISTS } = await import('../constants.ts');
        return Promise.resolve(MOCK_PACKING_LISTS);
    }
    
    return apiClient('/packing');
};

export const getPackingList = async (packingId: string): Promise<PackingList> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_PACKING_LISTS } = await import('../constants.ts');
        const packingList = MOCK_PACKING_LISTS.find(pl => pl.id === packingId);
        if (packingList) {
            return Promise.resolve(packingList);
        }
        throw new Error(`Packing list with id ${packingId} not found`);
    }
    
    return apiClient(`/packing/${packingId}`);
};

export const createPackingList = async (data: { tripId: string, title: string, items: Omit<PackingListItem, 'id' | 'packed'>[] }): Promise<PackingList> => {
    return apiClient('/packing', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const patchPackingList = async (packingId: string, op: PatchOp, payload: any): Promise<PackingList> => {
    return apiClient(`/packing/${packingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ op, payload }),
    });
};

// --- Expense API ---

export const getExpenses = async (tripId: string): Promise<Expense[]> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_EXPENSES } = await import('../constants.ts');
        const expenses = MOCK_EXPENSES.filter(expense => expense.tripId === tripId);
        return Promise.resolve(expenses);
    }
    
    return apiClient(`/expenses?tripId=${tripId}`);
};

export const createExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    return apiClient('/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData),
    });
};

export const updateExpense = async (expenseId: string, expenseData: Partial<Expense>): Promise<Expense> => {
    return apiClient(`/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(expenseData),
    });
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
    return apiClient(`/expenses/${expenseId}`, {
        method: 'DELETE',
    });
};

// --- Gear API ---

export const getGearList = async (): Promise<Gear[]> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_GEAR } = await import('../constants.ts');
        return Promise.resolve(MOCK_GEAR);
    }
    
    return apiClient('/gear');
};

export const getGearItem = async (gearId: string): Promise<Gear> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_GEAR } = await import('../constants.ts');
        const gear = MOCK_GEAR.find(g => g.id === gearId);
        if (gear) {
            return Promise.resolve(gear);
        }
        throw new Error(`Gear with id ${gearId} not found`);
    }
    
    return apiClient(`/gear/${gearId}`);
}

export const createGear = async (gearData: any): Promise<Gear> => {
    return apiClient('/gear', {
        method: 'POST',
        body: JSON.stringify(gearData),
    });
};

// --- Reservation API ---
export const getReservations = async (tripId: string): Promise<Reservation[]> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_RESERVATIONS } = await import('../constants.ts');
        const reservations = MOCK_RESERVATIONS.filter(reservation => reservation.tripId === tripId);
        return Promise.resolve(reservations);
    }
    
    return apiClient(`/reservations?tripId=${tripId}`);
};

export const createReservation = async (reservationData: Omit<Reservation, 'id'>): Promise<Reservation> => {
    return apiClient('/reservations', {
        method: 'POST',
        body: JSON.stringify(reservationData),
    });
};

export const deleteReservation = async (reservationId: string): Promise<void> => {
    return apiClient(`/reservations/${reservationId}`, {
        method: 'DELETE',
    });
};


// --- Mock APIs (unchanged for now) ---
// El resto de las APIs (listas, gastos, etc.) se mantienen simuladas hasta que las integremos.

export const patchItinerary = async (itineraryId: string, op: PatchOp, payload: any, opId: string) => {
  console.log('PATCHING ITINERARY:', { itineraryId, op, payload, opId });
  await new Promise(res => setTimeout(res, 500));
  
  if (payload.fields.title && payload.fields.title.toLowerCase().includes('conflict')) {
      console.log("SIMULATING CONFLICT for block update");
      const error: any = new Error("Simulated conflict on block update");
      error.status = 409;
      const remoteBlock = { 
          ...payload.fields, 
          title: 'Server Version Title',
          description: 'This description was updated on the server.' 
      };
      error.body = { error: 'CONFLICT', remote: remoteBlock };
      throw error;
  }

  return { ok: true };
};

export const resolvePackingTemplate = async (templateKey: string): Promise<{ items: { name: string; qty: number; category: PackingCategory; notes?: string }[] }> => {
    await new Promise(res => setTimeout(res, 500));
    const templates = { 'playa_basico': [{ name: 'Traje de baño', qty: 2, category: 'ropa' as PackingCategory }] };
    return { items: templates[templateKey as keyof typeof templates] || [] };
};

export const getPackingListPdf = async (packingId: string) => {
    await new Promise(res => setTimeout(res, 1200));
    const mockPdfBlob = new Blob(["Simulated PDF"], { type: 'application/pdf' });
    return { blob: mockPdfBlob, filename: `packing-list-${packingId}.pdf` };
};

export const getItineraryPdf = async (itineraryId: string) => {
    await new Promise(res => setTimeout(res, 1500));
    const mockPdfBlob = new Blob(["Simulated PDF"], { type: 'application/pdf' });
    return { blob: mockPdfBlob, filename: `itinerary-${itineraryId}.pdf` };
};

// --- Collaboration API (Real Implementation) ---

export const getTripMembers = async (tripId: string): Promise<{ members: TripMember[], invites: Invite[] }> => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Use mock data for development
        const { MOCK_TRIPS } = await import('../constants.ts');
        const trip = MOCK_TRIPS.find(t => t.id === tripId);
        if (trip) {
            return Promise.resolve({ 
                members: trip.members || [], 
                invites: [] // No pending invites in mock data
            });
        }
        return Promise.resolve({ members: [], invites: [] });
    }
    
    return apiClient(`/trips/${tripId}/members`);
};

export const inviteUser = async (tripId: string, email: string, role: Role): Promise<Trip> => {
    return apiClient(`/trips/${tripId}/share`, {
        method: 'POST',
        body: JSON.stringify({ email, permissionLevel: role })
    });
};

export const updateMemberRole = async (tripId: string, memberId: string, role: Role): Promise<{ ok: true }> => {
    return apiClient(`/trips/${tripId}/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    });
};

export const removeMember = async (tripId: string, memberId: string): Promise<{ ok: true }> => {
    return apiClient(`/trips/${tripId}/members/${memberId}`, {
        method: 'DELETE'
    });
};

export const cancelInvitation = async (invitationId: string): Promise<{ ok: true }> => {
    return apiClient(`/trips/invitations/${invitationId}`, {
        method: 'DELETE'
    });
};

export const uploadTripImage = async (tripId: string, imageFile: File): Promise<{ message: string; imageUrl: string; trip: Trip }> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/image`, {
        method: 'POST',
        headers: {
            ...(inMemoryAccessToken && { Authorization: `Bearer ${inMemoryAccessToken}` }),
            'X-CSRF-Token': getCookie('csrfToken') || '',
        },
        credentials: 'include',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error uploading image' }));
        throw new ApiError(`${response.status}`, errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};

export const deleteTripImage = async (tripId: string): Promise<{ message: string; trip: Trip }> => {
    return apiClient(`/trips/${tripId}/image`, {
        method: 'DELETE'
    });
};