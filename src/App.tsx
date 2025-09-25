import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext.tsx';

import ProtectedRoute from './components/ProtectedRoute.tsx';
import Header from './components/Header.tsx';
import AiCopilot from './components/AiCopilot.tsx';

// Core pages (loaded immediately)
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

// Lazy-loaded pages (loaded on demand)
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage.tsx'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.tsx'));
const DashboardPageEnhanced = React.lazy(() => import('./pages/DashboardPageEnhanced.tsx'));
const RevolutionaryPackingPage = React.lazy(() => import('./pages/RevolutionaryPackingPage.tsx'));
const EnhancedGetawayPage = React.lazy(() => import('./pages/EnhancedGetawayPage.tsx'));
const PackingDashboardPage = React.lazy(() => import('./pages/PackingDashboardPage.tsx'));
const NewPackingListPage = React.lazy(() => import('./pages/NewPackingListPage.tsx'));
const PackingListPage = React.lazy(() => import('./pages/PackingListPage.tsx'));
const TripOverviewPage = React.lazy(() => import('./pages/TripOverviewPage.tsx'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage.tsx'));
const LostFoundPublicPage = React.lazy(() => import('./pages/LostFoundPublicPage.tsx'));
import { getTrips } from './services/api.ts';
import { NOTIFICATIONS_STORAGE_KEY } from './constants.ts';
import { useSyncQueue } from './hooks/useSyncQueue.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { notificationService } from './services/notificationService.ts';
import PWAInstallBanner from './components/pwa/PWAInstallBanner.tsx';
import { DemoBanner } from './components/common/DemoBanner.tsx';

// --- Lazy Loaded Pages ---
const SmartSaverPage = React.lazy(() => import('./pages/SmartSaverPage.tsx'));
const GearDashboardPage = React.lazy(() => import('./pages/GearDashboardPage.tsx'));
const NewGearPage = React.lazy(() => import('./pages/NewGearPage.tsx'));
const GearDetailPage = React.lazy(() => import('./pages/GearDetailPage.tsx'));
const GetawayPlannerPage = React.lazy(() => import('./pages/GetawayPlannerPage.tsx'));
const GetawayPlanPage = React.lazy(() => import('./pages/GetawayPlanPage.tsx'));
const EnhancedTripTimelinePage = React.lazy(() => import('./pages/EnhancedTripTimelinePage.tsx'));


const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null; // Or a loading spinner

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-center p-8">Cargando página...</div>}>
            <Outlet />
        </Suspense>
      </main>
      <AiCopilot />
    </div>
  );
};


function App() {
  const { isAuthenticated } = useAuth();
  useSyncQueue(); // Activar el sincronizador de cola offline globalmente

  useEffect(() => {
    if (isAuthenticated) {
      const checkUpcomingTrips = async () => {
        try {
          const trips = await getTrips();
          notificationService.checkUpcomingTrips(trips);
          notificationService.cleanupOldNotifications(trips);
        } catch (error) {
          console.error('Error checking upcoming trips for notifications:', error);
        }
      };

      checkUpcomingTrips();
      
      // Set up periodic checking every hour
      const interval = setInterval(checkUpcomingTrips, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);


  return (
    <ErrorBoundary>
      <PWAInstallBanner />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando aplicación...</p>
          </div>
        </div>
      }>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/l/:code" element={<LostFoundPublicPage />} />
        
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard-v2" element={<DashboardPageEnhanced />} />
          <Route path="packing" element={<PackingDashboardPage />} />
          <Route path="packing/new" element={<NewPackingListPage />} />
          <Route path="packing/:id" element={<PackingListPage />} />
          <Route path="trips/:id" element={<TripOverviewPage />} />
          <Route path="trips/:id/timeline" element={<EnhancedTripTimelinePage />} />
          <Route path="trips/:tripId/packing-v2" element={<RevolutionaryPackingPage />} />
          <Route path="getaway-v2" element={<EnhancedGetawayPage />} />
          <Route path="trips/:id/saver" element={<SmartSaverPage />} />
          <Route path="gear" element={<GearDashboardPage />} />
          <Route path="gear/new" element={<NewGearPage />} />
          <Route path="gear/:id" element={<GearDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="getaway-planner" element={<GetawayPlannerPage />} />
          <Route path="getaway/:id" element={<GetawayPlanPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;