import { useState, useCallback } from 'react';
import { googleMapsService } from '../services/googleMapsService.ts';
import { useToast } from './useToast.ts';

export interface GeocodeResult {
  coords: { lat: number; lng: number };
  address: string;
}

export const useGeocoding = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { addToast } = useToast();

  const geocodeLocation = useCallback(async (address: string): Promise<GeocodeResult | null> => {
    if (!address.trim()) return null;

    setIsGeocoding(true);
    
    try {
      const coords = await googleMapsService.geocodeLocation(address);
      
      if (coords) {
        return {
          coords,
          address
        };
      } else {
        addToast(`No se pudo encontrar la ubicación: ${address}`, 'warning');
        return null;
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      addToast('Error al buscar la ubicación', 'error');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [addToast]);

  const batchGeocode = useCallback(async (addresses: string[]): Promise<{ [address: string]: GeocodeResult | null }> => {
    const results: { [address: string]: GeocodeResult | null } = {};
    
    setIsGeocoding(true);
    
    try {
      // Process addresses in small batches to avoid rate limiting
      for (let i = 0; i < addresses.length; i += 3) {
        const batch = addresses.slice(i, i + 3);
        
        const batchPromises = batch.map(async (address) => {
          const result = await googleMapsService.geocodeLocation(address);
          return { address, result: result ? { coords: result, address } : null };
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ address, result }) => {
          results[address] = result;
        });
        
        // Small delay between batches to be respectful to the API
        if (i + 3 < addresses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error batch geocoding:', error);
      addToast('Error al procesar ubicaciones', 'error');
    } finally {
      setIsGeocoding(false);
    }
    
    return results;
  }, [addToast]);

  return {
    geocodeLocation,
    batchGeocode,
    isGeocoding
  };
};