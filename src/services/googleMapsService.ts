import { Loader } from '@googlemaps/js-api-loader';

// Environment variable for Google Maps API key - replace with your actual key
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

class GoogleMapsService {
  private loader: Loader;
  private static instance: GoogleMapsService;
  private isLoaded = false;

  private constructor() {
    this.loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  async loadGoogleMaps(): Promise<typeof google.maps> {
    if (this.isLoaded) {
      return google.maps;
    }

    try {
      const google = await this.loader.load();
      this.isLoaded = true;
      return google.maps;
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      throw new Error('Failed to load Google Maps. Please check your API key.');
    }
  }

  async geocodeLocation(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const maps = await this.loadGoogleMaps();
      const geocoder = new maps.Geocoder();

      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            console.warn(`Geocoding failed for address "${address}":`, status);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  async searchPlaces(
    query: string, 
    center: { lat: number; lng: number },
    radius: number = 10000
  ): Promise<google.maps.places.PlaceResult[]> {
    try {
      const maps = await this.loadGoogleMaps();
      const service = new maps.places.PlacesService(document.createElement('div'));

      return new Promise((resolve, reject) => {
        service.textSearch({
          query,
          location: new maps.LatLng(center.lat, center.lng),
          radius
        }, (results, status) => {
          if (status === maps.places.PlacesServiceStatus.OK) {
            resolve(results || []);
          } else {
            console.warn(`Places search failed for query "${query}":`, status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  async getNearbyPlaces(
    center: { lat: number; lng: number },
    type: string,
    radius: number = 5000
  ): Promise<google.maps.places.PlaceResult[]> {
    try {
      const maps = await this.loadGoogleMaps();
      const service = new maps.places.PlacesService(document.createElement('div'));

      return new Promise((resolve, reject) => {
        service.nearbySearch({
          location: new maps.LatLng(center.lat, center.lng),
          radius,
          type: type as any
        }, (results, status) => {
          if (status === maps.places.PlacesServiceStatus.OK) {
            resolve(results || []);
          } else {
            console.warn(`Nearby search failed for type "${type}":`, status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return [];
    }
  }

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: string; duration: string } | null> {
    try {
      const maps = await this.loadGoogleMaps();
      const service = new maps.DistanceMatrixService();

      return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [new maps.LatLng(origin.lat, origin.lng)],
          destinations: [new maps.LatLng(destination.lat, destination.lng)],
          travelMode: maps.TravelMode.DRIVING,
          unitSystem: maps.UnitSystem.METRIC
        }, (response, status) => {
          if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
            const element = response.rows[0].elements[0];
            resolve({
              distance: element.distance?.text || '',
              duration: element.duration?.text || ''
            });
          } else {
            console.warn('Distance calculation failed:', status);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }

  isApiKeyConfigured(): boolean {
    return GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE' && GOOGLE_MAPS_API_KEY !== '';
  }
}

export const googleMapsService = GoogleMapsService.getInstance();