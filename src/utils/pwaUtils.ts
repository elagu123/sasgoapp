// PWA utilities for service worker registration and install prompts
import React from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installCallbacks: ((canInstall: boolean) => void)[] = [];

  private constructor() {
    this.init();
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Before install prompt triggered');
      // Only prevent default if we want to show custom UI
      // Don't prevent if we're not going to show the prompt
      if (!this.deferredPrompt) {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.notifyInstallCallbacks(true);
      }
    });

    // Listen for the app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;
      this.notifyInstallCallbacks(false);
    });

    // Register service worker
    this.registerServiceWorker();
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('[PWA] New service worker version available');
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateAvailableNotification();
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 1000 * 60 * 60); // Check every hour

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  private showUpdateAvailableNotification(): void {
    // This could trigger a toast or banner notifying the user of an update
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  private notifyInstallCallbacks(canInstall: boolean): void {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  public onInstallStateChange(callback: (canInstall: boolean) => void): void {
    this.installCallbacks.push(callback);
    
    // Immediately call with current state
    callback(this.canInstall());
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for the user's choice
      const choiceResult = await this.deferredPrompt.userChoice;
      console.log('[PWA] User choice:', choiceResult.outcome);
      
      // Clean up
      this.deferredPrompt = null;
      this.notifyInstallCallbacks(false);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  public isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!await this.requestNotificationPermission()) {
      console.log('[PWA] Notification permission denied');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker to show notification
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, defaultOptions);
      }
    } else {
      // Fallback to regular notification
      new Notification(title, defaultOptions);
    }
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public onNetworkChange(callback: (isOnline: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

export const pwaManager = PWAManager.getInstance();

// Hook for React components
export const usePWA = () => {
  const [canInstall, setCanInstall] = React.useState(pwaManager.canInstall());
  const [isStandalone, setIsStandalone] = React.useState(pwaManager.isStandalone());
  const [isOnline, setIsOnline] = React.useState(pwaManager.isOnline());

  React.useEffect(() => {
    // Listen for install state changes
    pwaManager.onInstallStateChange(setCanInstall);

    // Listen for network changes
    pwaManager.onNetworkChange(setIsOnline);

    // Listen for PWA update available
    const handleUpdateAvailable = () => {
      // Could trigger a state update for showing update banner
      console.log('[PWA Hook] Update available');
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  return {
    canInstall,
    isStandalone,
    isOnline,
    promptInstall: pwaManager.promptInstall.bind(pwaManager),
    requestNotificationPermission: pwaManager.requestNotificationPermission.bind(pwaManager),
    showNotification: pwaManager.showNotification.bind(pwaManager)
  };
};

