import React, { createContext, useState, useMemo, useContext } from 'react';
import type { Trip } from '../types';

interface TripContextType {
  trip: Trip | null;
  setTrip: (trip: Trip | null) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trip, setTrip] = useState<Trip | null>(null);

  const value = useMemo(() => ({ trip, setTrip }), [trip]);

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
};
