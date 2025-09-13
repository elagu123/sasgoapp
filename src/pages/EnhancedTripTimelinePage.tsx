import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  Cog6ToothIcon, 
  EllipsisHorizontalIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  StarIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { useTrip } from '../hooks/useTrip';
import { useToast } from '../hooks/useToast';
import { getWeatherForecast } from '../services/geminiService';
import { PDFService } from '../services/pdfService';
import EnhancedTripTimeline from '../components/timeline/EnhancedTripTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import type { WeatherForecastDay, Trip } from '../types';

const EnhancedTripTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const { data: trip, isLoading, error, refetch } = useTrip(id!);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecastDay[] | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch weather forecast
  useEffect(() => {
    if (trip) {
      setIsWeatherLoading(true);
      getWeatherForecast(trip.destination[0], trip.dates.start, trip.dates.end)
        .then(forecast => {
          setWeatherForecast(forecast);
          setIsWeatherLoading(false);
        })
        .catch(error => {
          console.error('Error fetching weather:', error);
          setIsWeatherLoading(false);
        });
    }
  }, [trip]);

  const handleUpdateTrip = async (updates: Partial<Trip>) => {
    if (!trip) return;
    
    try {
      // In a real app, this would call the API to update the trip
      // For now, we'll just trigger a refetch
      await refetch();
      addToast('Viaje actualizado', 'success');
    } catch (error) {
      console.error('Error updating trip:', error);
      addToast('Error al actualizar el viaje', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (!trip) return;
    
    setIsExporting(true);
    try {
      await PDFService.generateTripSummaryPDF(trip);
      addToast('PDF del viaje exportado exitosamente', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      addToast('Error al exportar PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!trip) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.title,
          text: `Mirá mi viaje a ${trip.destination.join(', ')}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Enlace copiado al portapapeles', 'success');
  };

  const handleGoToClassicView = () => {
    navigate(`/app/trips/${id}`);
  };

  const handleGoToMap = () => {
    navigate(`/app/trips/${id}?tab=map`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 mt-4"
          >
            Cargando tu historia de viaje...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Viaje no encontrado</h1>
          <p className="text-white/80 mb-6">No pudimos cargar la información del viaje.</p>
          <motion.button
            onClick={() => navigate('/app/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Volver al Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating Action Buttons */}
      <div className="fixed top-6 left-6 z-50">
        <motion.button
          onClick={() => navigate('/app/dashboard')}
          className="flex items-center space-x-2 px-4 py-2 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Volver</span>
        </motion.button>
      </div>

      <div className="fixed top-6 right-6 z-50">
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleGoToMap}
            className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MapIcon className="w-6 h-6" />
          </motion.button>

          <motion.button
            onClick={handleGoToClassicView}
            className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </motion.button>

          <div className="relative">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <EllipsisHorizontalIcon className="w-6 h-6" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 py-2"
                  onClick={() => setShowMenu(false)}
                >
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                  >
                    <ShareIcon className="w-5 h-5 text-white/70" />
                    <span>Compartir viaje</span>
                  </button>
                  
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 text-white/70" />
                    <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleUpdateTrip({ isFavorite: !trip.isFavorite })}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                  >
                    <StarIcon className={`w-5 h-5 ${trip.isFavorite ? 'text-yellow-400' : 'text-white/70'}`} />
                    <span>{trip.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <EnhancedTripTimeline
        trip={trip}
        weatherForecast={weatherForecast}
        onUpdateTrip={handleUpdateTrip}
      />

      {/* Loading Overlay for Weather */}
      <AnimatePresence>
        {isWeatherLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-6 z-50 bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm"
          >
            Cargando clima...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedTripTimelinePage;