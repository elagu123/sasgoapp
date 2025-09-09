import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext.tsx';

import ProtectedRoute from './components/ProtectedRoute.tsx';
import Header from './components/Header.tsx';
import AiCopilot from './components/AiCopilot.tsx';

import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import OnboardingPage from './pages/OnboardingPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import PackingDashboardPage from './pages/PackingDashboardPage.tsx';
import NewPackingListPage from './pages/NewPackingListPage.tsx';
import PackingListPage from './pages/PackingListPage.tsx';
import TripOverviewPage from './pages/TripOverviewPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import LostFoundPublicPage from './pages/LostFoundPublicPage.tsx';
import { getTrips } from './services/api.ts';
import { NOTIFICATIONS_STORAGE_KEY } from './constants.ts';
import { useSyncQueue } from './hooks/useSyncQueue.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { notificationService } from './services/notificationService.ts';
import PWAInstallBanner from './components/pwa/PWAInstallBanner.tsx';

// --- Lazy Loaded Pages ---
const SmartSaverPage = React.lazy(() => import('./pages/SmartSaverPage.tsx'));
const GearDashboardPage = React.lazy(() => import('./pages/GearDashboardPage.tsx'));
const NewGearPage = React.lazy(() => import('./pages/NewGearPage.tsx'));
const GearDetailPage = React.lazy(() => import('./pages/GearDetailPage.tsx'));
const GetawayPlannerPage = React.lazy(() => import('./pages/GetawayPlannerPage.tsx'));
const GetawayPlanPage = React.lazy(() => import('./pages/GetawayPlanPage.tsx'));


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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/l/:code" element={<LostFoundPublicPage />} />
        
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="packing" element={<PackingDashboardPage />} />
          <Route path="packing/new" element={<NewPackingListPage />} />
          <Route path="packing/:id" element={<PackingListPage />} />
          <Route path="trips/:id" element={<TripOverviewPage />} />
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
    </ErrorBoundary>
  );
}

export default App;