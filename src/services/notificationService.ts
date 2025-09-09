import type { Trip } from '../types';
import { NOTIFICATIONS_STORAGE_KEY } from '../constants';

export interface NotificationSettings {
    enabled: boolean;
    daysBefore: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
    reminderTypes: {
        departure: boolean;
        packing: boolean;
        documents: boolean;
    };
    quietHours: {
        enabled: boolean;
        start: string; // HH:MM format
        end: string;   // HH:MM format
    };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    daysBefore: 3,
    emailNotifications: false,
    pushNotifications: true,
    reminderTypes: {
        departure: true,
        packing: true,
        documents: true,
    },
    quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
    },
};

export class NotificationService {
    private static instance: NotificationService;
    private settings: NotificationSettings;
    private notifiedTrips = new Set<string>();

    private constructor() {
        this.settings = this.loadSettings();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private loadSettings(): NotificationSettings {
        try {
            const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
        return DEFAULT_NOTIFICATION_SETTINGS;
    }

    public getSettings(): NotificationSettings {
        return { ...this.settings };
    }

    public async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
        this.settings = { ...this.settings, ...newSettings };
        
        // Request permission if push notifications are enabled
        if (this.settings.pushNotifications && this.settings.enabled) {
            await this.requestPermission();
        }
        
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.settings));
    }

    public async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    private isInQuietHours(): boolean {
        if (!this.settings.quietHours.enabled) {
            return false;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const { start, end } = this.settings.quietHours;
        
        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (start > end) {
            return currentTime >= start || currentTime <= end;
        }
        
        // Handle same-day quiet hours (e.g., 12:00 to 14:00)
        return currentTime >= start && currentTime <= end;
    }

    private showNotification(title: string, body: string, options?: NotificationOptions): void {
        if (!this.settings.enabled || !this.settings.pushNotifications || this.isInQuietHours()) {
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/vite.svg',
                badge: '/vite.svg',
                tag: 'sasgo-trip-reminder',
                ...options,
            });
        }
    }

    public checkUpcomingTrips(trips: Trip[]): void {
        if (!this.settings.enabled) {
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        trips.forEach(trip => {
            const tripKey = `${trip.id}-${trip.dates.start}`;
            
            // Skip if we've already notified about this trip
            if (this.notifiedTrips.has(tripKey)) {
                return;
            }

            const startDate = new Date(trip.dates.start);
            startDate.setHours(0, 0, 0, 0);
            
            const diffTime = startDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Check if trip is within notification window
            if (diffDays > 0 && diffDays <= this.settings.daysBefore) {
                this.sendTripReminders(trip, diffDays);
                this.notifiedTrips.add(tripKey);
            }
        });
    }

    private sendTripReminders(trip: Trip, daysUntil: number): void {
        const destination = Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination;
        
        // Departure reminder
        if (this.settings.reminderTypes.departure) {
            this.showNotification(
                '¡Viaje próximo!',
                `Tu viaje a ${destination} comienza en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}.`,
                { tag: `trip-departure-${trip.id}` }
            );
        }

        // Packing reminder (only if 3 days or less)
        if (this.settings.reminderTypes.packing && daysUntil <= 3) {
            const packingStatus = trip.packingProgress;
            if (!packingStatus || packingStatus.packed < packingStatus.total) {
                this.showNotification(
                    'Recordatorio de empaque',
                    `No olvides terminar de empacar para tu viaje a ${destination}.${packingStatus ? ` Te faltan ${packingStatus.total - packingStatus.packed} items.` : ''}`,
                    { tag: `trip-packing-${trip.id}` }
                );
            }
        }

        // Documents reminder (only if 1-2 days)
        if (this.settings.reminderTypes.documents && daysUntil <= 2) {
            this.showNotification(
                'Verifica tus documentos',
                `Asegúrate de tener todos los documentos necesarios para tu viaje a ${destination}.`,
                { tag: `trip-documents-${trip.id}` }
            );
        }
    }

    // Clean up old notifications from memory (call this periodically)
    public cleanupOldNotifications(trips: Trip[]): void {
        const currentTripKeys = new Set(trips.map(trip => `${trip.id}-${trip.dates.start}`));
        
        // Remove notifications for trips that no longer exist or have passed
        this.notifiedTrips.forEach(tripKey => {
            if (!currentTripKeys.has(tripKey)) {
                this.notifiedTrips.delete(tripKey);
            }
        });
    }

    // Test notification
    public sendTestNotification(): void {
        this.showNotification(
            'Notificación de prueba',
            'Las notificaciones están funcionando correctamente.',
            { tag: 'test-notification' }
        );
    }
}

export const notificationService = NotificationService.getInstance();