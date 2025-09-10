

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, UserProfile } from '../types.ts';
import { USER_STORAGE_KEY, AUTH_TOKEN_KEY } from '../constants.ts';
import * as api from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (newPreferences: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // On initial load, try to refresh the token to restore the session.
    // The refresh token is in a secure httpOnly cookie.
    const validateSession = async () => {
        // Check if we're in development mode without backend
        if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
            // Use mock user data for development
            const mockUser: User = {
                id: 'mock-user-1',
                name: 'Demo User',
                email: 'demo@sasgoapp.com',
                preferences: {
                    travelStyle: 'moderate',
                    preferredCategories: ['sightseeing', 'food', 'culture'],
                    budgetHistory: [
                        { destination: 'Barcelona', budget: 1500 },
                        { destination: 'Tokyo', budget: 2200 }
                    ]
                }
            };
            setUser(mockUser);
            setIsLoading(false);
            return;
        }

        try {
            const { accessToken } = await api.refreshToken();
            api.setAuthToken(accessToken);
            const { user: freshUser } = await api.getMe();
            setUser(freshUser);
        } catch (error) {
            console.error("No valid session found on load.", error);
            api.setAuthToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };
    validateSession();
  }, []);

  const login = async (email: string, pass: string) => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
      // Use mock login for development
      const mockUser: User = {
        id: 'mock-user-1',
        name: 'Demo User',
        email: email,
        preferences: {
          travelStyle: 'moderate',
          preferredCategories: ['sightseeing', 'food', 'culture'],
          budgetHistory: [
            { destination: 'Barcelona', budget: 1500 },
            { destination: 'Tokyo', budget: 2200 }
          ]
        }
      };
      setUser(mockUser);
      return;
    }

    const { accessToken, user: loggedInUser } = await api.login(email, pass);
    api.setAuthToken(accessToken); // Store token in memory
    setUser(loggedInUser);
  };
  
  const register = async (name: string, email: string, pass: string) => {
    // Check if we're in development mode without backend
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
      // Mock registration - just simulate success
      return;
    }

    await api.register(name, email, pass);
    // After successful registration, the user should be redirected to login.
  };

  const logout = () => {
    setUser(null);
    api.setAuthToken(null); // Clear token from memory
    api.logout(); // Tell backend to clear the httpOnly cookie
    navigate('/');
  };
  
  const updatePreferences = useCallback((newPreferences: Partial<UserProfile>) => {
    setUser(currentUser => {
        if (!currentUser) return null;
        const updatedUser = {
            ...currentUser,
            preferences: {
                ...currentUser.preferences,
                ...newPreferences,
            }
        };
        // In a real app, you would also PATCH this to the backend
        // api.updateUserPreferences(updatedUser.preferences);
        return updatedUser;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updatePreferences
  }), [user, isLoading, updatePreferences]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};