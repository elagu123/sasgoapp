import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../utils/pwaUtils.ts';
import { useToast } from '../../hooks/useToast.ts';

const PWAInstallBanner: React.FC = () => {
  const { canInstall, isStandalone, promptInstall } = usePWA();
  const { addToast } = useToast();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Show banner if:
    // - PWA can be installed
    // - Not in standalone mode (already installed)
    // - Not dismissed or dismissed more than a week ago
    if (canInstall && !isStandalone && (!dismissed || dismissedTime < weekAgo)) {
      // Delay showing banner to avoid interrupting onboarding
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [canInstall, isStandalone]);

  const handleInstall = async () => {
    try {
      const accepted = await promptInstall();
      if (accepted) {
        addToast('¡SAS Go instalado exitosamente!', 'success');
        setShowBanner(false);
      } else {
        addToast('Instalación cancelada', 'info');
      }
    } catch (error) {
      console.error('Error during PWA install:', error);
      addToast('Error al instalar la aplicación', 'error');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || isDismissed || isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🧳</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Instalar SAS Go
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Accede rápidamente desde tu pantalla de inicio. Funciona sin conexión.
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs transition-colors px-2 py-2"
                >
                  Ahora no
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;