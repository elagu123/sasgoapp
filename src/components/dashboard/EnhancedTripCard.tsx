import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Trip } from '../../types';

interface SmartAlert {
  id: string;
  type: 'weather' | 'visa' | 'vaccination' | 'booking' | 'packing';
  icon: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  link?: string;
}

interface EnhancedTripCardProps {
  trip: Trip;
  onEdit?: (trip: Trip) => void;
  onArchive?: (trip: Trip) => void;
  onFavorite?: (trip: Trip) => void;
}

const EnhancedTripCard: React.FC<EnhancedTripCardProps> = ({ 
  trip, 
  onEdit, 
  onArchive, 
  onFavorite 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Calcular días restantes
  const daysUntil = Math.ceil(
    (new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Generar alertas inteligentes
  const generateSmartAlerts = (): SmartAlert[] => {
    const alerts: SmartAlert[] = [];

    // Alertas climáticas
    if (trip.weather?.condition === 'rainy' && daysUntil <= 7) {
      alerts.push({
        id: '1',
        type: 'weather',
        icon: '🌧️',
        message: 'Lluvia prevista',
        priority: 'medium',
        actionable: true,
        link: `/trip/${trip.id}/weather`
      });
    }

    // Alertas de documentación
    if (daysUntil <= 30 && daysUntil > 0 && (!trip.documentsProgress || trip.documentsProgress < 100)) {
      alerts.push({
        id: '2',
        type: 'visa',
        icon: '📄',
        message: 'Visa pendiente',
        priority: 'high',
        actionable: true,
        link: `/trip/${trip.id}/documents`
      });
    }

    // Alertas de vacunación
    if (trip.destination.includes('Asia') && daysUntil <= 45) {
      alerts.push({
        id: '3',
        type: 'vaccination',
        icon: '💊',
        message: 'Vacunas requeridas',
        priority: 'high',
        actionable: true,
        link: `/trip/${trip.id}/health`
      });
    }

    // Alertas de empaque
    if (daysUntil <= 7 && trip.packingProgress < 50) {
      alerts.push({
        id: '4',
        type: 'packing',
        icon: '🎒',
        message: 'Equipaje pendiente',
        priority: 'medium',
        actionable: true,
        link: `/trip/${trip.id}/packing`
      });
    }

    return alerts.slice(0, 3); // Máximo 3 alertas
  };

  const smartAlerts = generateSmartAlerts();

  // Obtener flag del país (placeholder - en producción sería un mapa real)
  const getCountryFlag = (destination: string): string => {
    const flags: Record<string, string> = {
      'París': '🇫🇷',
      'Barcelona': '🇪🇸', 
      'Tokyo': '🇯🇵',
      'Londres': '🇬🇧',
      'Roma': '🇮🇹',
      'Nueva York': '🇺🇸',
      'Brasil': '🇧🇷',
      'Argentina': '🇦🇷'
    };
    
    return Object.keys(flags).find(key => 
      destination.toLowerCase().includes(key.toLowerCase())
    ) ? flags[Object.keys(flags).find(key => 
      destination.toLowerCase().includes(key.toLowerCase())
    )!] : '🌍';
  };

  // Próximas 3 actividades (simulado)
  const upcomingActivities = [
    { time: '09:00', activity: 'Visita al Louvre' },
    { time: '14:00', activity: 'Almuerzo en Montmartre' },
    { time: '19:00', activity: 'Cena junto al Sena' }
  ];

  return (
    <motion.div
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onLongPress={() => setShowQuickMenu(true)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Imagen con overlay gradient */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={trip.image || `https://images.unsplash.com/photo-1502602898536-47ad22581b52?q=80&w=800`}
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badge de días restantes */}
        <motion.div 
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {daysUntil > 0 ? `${daysUntil} días` : daysUntil === 0 ? '¡Hoy!' : 'Finalizado'}
        </motion.div>

        {/* Favorite button */}
        <motion.button
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 p-2 rounded-full transition-colors"
          onClick={() => onFavorite?.(trip)}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" fill={trip.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </motion.button>

        {/* Título y destino en overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 flex items-center">
            {trip.destination} {getCountryFlag(trip.destination)}
          </h3>
          <p className="text-sm text-white/80">{trip.title}</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Mini widget clima + viajeros + presupuesto */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Clima */}
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="text-lg">☀️</span>
              <span>{trip.weather?.averageTemp || 22}°C</span>
            </div>
            
            {/* Viajeros (avatares) */}
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(trip.travelers, 4) }).map((_, i) => (
                <div 
                  key={i}
                  className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white font-semibold"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {trip.travelers > 4 && (
                <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white font-semibold">
                  +{trip.travelers - 4}
                </div>
              )}
            </div>
          </div>

          {/* Presupuesto (progress bar pequeño) */}
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              ${trip.budget.toLocaleString()}
            </div>
            <div className="w-16 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div 
                className="bg-green-500 h-1.5 rounded-full" 
                style={{ width: `${Math.min((trip.spentBudget / trip.budget) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Smart Alerts Bar */}
        {smartAlerts.length > 0 && (
          <div className="mb-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {smartAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex-shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    alert.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : alert.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                >
                  <span>{alert.icon}</span>
                  <span>{alert.message}</span>
                  {alert.actionable && (
                    <Link to={alert.link || '#'} className="underline">
                      Ver
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Sections */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Planning</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <motion.div 
                className="bg-blue-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${trip.itineraryProgress || 0}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white mt-1">
              {trip.itineraryProgress || 0}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Packing</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <motion.div 
                className="bg-green-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${trip.packingProgress || 0}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white mt-1">
              {trip.packingProgress || 0}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Booking</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <motion.div 
                className="bg-purple-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${trip.bookingProgress || 0}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white mt-1">
              {trip.bookingProgress || 0}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            to={`/app/trips/${trip.id}/timeline`}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors text-center"
          >
            🚀 Timeline
          </Link>
          
          <Link
            to={`/app/trips/${trip.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            📋 Planificar
          </Link>
          
          <Link
            to={`/app/trips/${trip.id}/packing-v2`}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            🎒 Equipaje
          </Link>
          
          <button
            onClick={() => onEdit?.(trip)}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hover Preview Expandido */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4"
          >
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
              Próximas actividades:
            </div>
            <div className="space-y-1">
              {upcomingActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 text-xs">
                  <span className="font-mono text-gray-500">{activity.time}</span>
                  <span className="text-gray-700 dark:text-gray-300">{activity.activity}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Menu (Long Press) */}
      <AnimatePresence>
        {showQuickMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setShowQuickMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[150px]"
            >
              <button
                onClick={() => {
                  onFavorite?.(trip);
                  setShowQuickMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <span>⭐</span>
                <span>{trip.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}</span>
              </button>
              
              <button
                onClick={() => {
                  onArchive?.(trip);
                  setShowQuickMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <span>📦</span>
                <span>Archivar</span>
              </button>
              
              <Link
                to={`/trip/${trip.id}/share`}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                onClick={() => setShowQuickMenu(false)}
              >
                <span>🔗</span>
                <span>Compartir</span>
              </Link>
              
              <Link
                to={`/trip/${trip.id}/duplicate`}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                onClick={() => setShowQuickMenu(false)}
              >
                <span>📋</span>
                <span>Duplicar</span>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedTripCard;