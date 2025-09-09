import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import OnboardingWizard from '../components/onboarding/OnboardingWizard.tsx';

const OnboardingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user needs onboarding
    const hasCompletedOnboarding = localStorage.getItem(`onboarding-completed-${user?.id}`);
    const hasPreferences = user?.preferences && 
      user.preferences.travelStyle && 
      user.preferences.preferredCategories.length > 0;

    if (!hasCompletedOnboarding && !hasPreferences) {
      setShouldShowOnboarding(true);
    } else {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleOnboardingComplete = () => {
    if (user?.id) {
      localStorage.setItem(`onboarding-completed-${user.id}`, 'true');
    }
    navigate('/app/dashboard');
  };

  const handleOnboardingSkip = () => {
    if (user?.id) {
      localStorage.setItem(`onboarding-completed-${user.id}`, 'true');
    }
    navigate('/app/dashboard');
  };

  if (!shouldShowOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWizard 
      onComplete={handleOnboardingComplete}
      onSkip={handleOnboardingSkip}
    />
  );
};

export default OnboardingPage;