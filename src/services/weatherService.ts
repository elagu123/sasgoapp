import type { WeatherForecastDay } from '../types.ts';

// Environment variable for OpenWeatherMap API key
const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

interface OpenWeatherResponse {
  list: Array<{
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
      feels_like: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
      deg: number;
    };
    pop: number; // Probability of precipitation
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
  }>;
  city: {
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
}

interface GeocodingResponse {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

class WeatherService {
  private static instance: WeatherService;

  private constructor() {}

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  isApiKeyConfigured(): boolean {
    return WEATHER_API_KEY !== 'YOUR_API_KEY_HERE' && WEATHER_API_KEY !== '';
  }

  private async geocodeLocation(locationName: string): Promise<{ lat: number; lon: number } | null> {
    if (!this.isApiKeyConfigured()) {
      throw new Error('Weather API key not configured');
    }

    try {
      const response = await fetch(
        `${WEATHER_API_BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=${WEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data: GeocodingResponse[] = await response.json();
      
      if (data.length === 0) {
        return null;
      }

      return {
        lat: data[0].lat,
        lon: data[0].lon
      };
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  private async getForecastByCoordinates(
    lat: number, 
    lon: number, 
    days: number = 5
  ): Promise<WeatherForecastDay[]> {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&cnt=${days * 8}` // 8 forecasts per day (every 3 hours)
      );

      if (!response.ok) {
        throw new Error(`Weather API failed: ${response.statusText}`);
      }

      const data: OpenWeatherResponse = await response.json();
      
      return this.processForecastData(data);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }

  private processForecastData(data: OpenWeatherResponse): WeatherForecastDay[] {
    // Group forecast data by date
    const dailyForecasts = new Map<string, any[]>();

    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]; // Extract date part (YYYY-MM-DD)
      
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, []);
      }
      
      dailyForecasts.get(date)!.push(item);
    });

    // Convert to our format
    const result: WeatherForecastDay[] = [];

    for (const [date, forecasts] of dailyForecasts) {
      // Find min and max temperatures for the day
      const temps = forecasts.map(f => f.main.temp);
      const temp_min = Math.round(Math.min(...temps));
      const temp_max = Math.round(Math.max(...temps));

      // Determine the most common weather condition for the day
      const weatherCounts = new Map<string, number>();
      forecasts.forEach(f => {
        const weather = f.weather[0].main.toLowerCase();
        weatherCounts.set(weather, (weatherCounts.get(weather) || 0) + 1);
      });

      const mostCommonWeather = Array.from(weatherCounts.entries())
        .sort(([,a], [,b]) => b - a)[0][0];

      // Map weather conditions to our types and icons
      const condition = this.mapWeatherCondition(mostCommonWeather);
      const icon = this.getWeatherIcon(condition);

      result.push({
        date,
        condition,
        icon,
        temp_max,
        temp_min
      });
    }

    return result.slice(0, 5); // Return up to 5 days
  }

  private mapWeatherCondition(openWeatherCondition: string): WeatherForecastDay['condition'] {
    const conditionMap: { [key: string]: WeatherForecastDay['condition'] } = {
      'clear': 'sunny',
      'clouds': 'partly_cloudy',
      'rain': 'rainy',
      'drizzle': 'rainy',
      'thunderstorm': 'rainy',
      'snow': 'snowy',
      'mist': 'cloudy',
      'fog': 'cloudy',
      'haze': 'cloudy',
      'dust': 'cloudy',
      'sand': 'cloudy',
      'ash': 'cloudy',
      'squall': 'cloudy',
      'tornado': 'cloudy'
    };

    return conditionMap[openWeatherCondition] || 'cloudy';
  }

  private getWeatherIcon(condition: WeatherForecastDay['condition']): string {
    const iconMap: { [key in WeatherForecastDay['condition']]: string } = {
      'sunny': '☀️',
      'cloudy': '☁️',
      'partly_cloudy': '⛅',
      'rainy': '🌧️',
      'snowy': '❄️'
    };

    return iconMap[condition];
  }

  async getWeatherForecast(
    destination: string,
    startDate: string,
    endDate: string
  ): Promise<WeatherForecastDay[]> {
    if (!this.isApiKeyConfigured()) {
      console.warn('Weather API key not configured, using mock data');
      return this.getMockWeatherData(startDate, endDate);
    }

    try {
      // Geocode the destination to get coordinates
      const coords = await this.geocodeLocation(destination);
      
      if (!coords) {
        console.warn(`Could not find coordinates for ${destination}, using mock data`);
        return this.getMockWeatherData(startDate, endDate);
      }

      // Calculate number of days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 5); // Max 5 days

      // Fetch weather forecast
      const forecast = await this.getForecastByCoordinates(coords.lat, coords.lon, diffDays);
      
      // Filter to match the requested date range
      const filteredForecast = forecast.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= start && dayDate <= end;
      });

      return filteredForecast;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      console.warn('Falling back to mock weather data');
      return this.getMockWeatherData(startDate, endDate);
    }
  }

  private getMockWeatherData(startDate: string, endDate: string): WeatherForecastDay[] {
    // Mock weather data as fallback
    const mockData: WeatherForecastDay[] = [
      { date: '2024-12-01', condition: 'sunny', icon: '☀️', temp_max: 25, temp_min: 15 },
      { date: '2024-12-02', condition: 'partly_cloudy', icon: '⛅', temp_max: 23, temp_min: 14 },
      { date: '2024-12-03', condition: 'rainy', icon: '🌧️', temp_max: 20, temp_min: 12 },
      { date: '2024-12-04', condition: 'cloudy', icon: '☁️', temp_max: 18, temp_min: 10 },
      { date: '2024-12-05', condition: 'sunny', icon: '☀️', temp_max: 26, temp_min: 16 }
    ];

    // Generate dates based on the requested range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: WeatherForecastDay[] = [];
    
    const current = new Date(start);
    let dataIndex = 0;

    while (current <= end && result.length < 5) {
      const dateStr = current.toISOString().split('T')[0];
      const mockDay = mockData[dataIndex % mockData.length];
      
      result.push({
        ...mockDay,
        date: dateStr
      });

      current.setDate(current.getDate() + 1);
      dataIndex++;
    }

    return result;
  }

  async getCurrentWeather(destination: string): Promise<{
    temp: number;
    condition: WeatherForecastDay['condition'];
    description: string;
    humidity: number;
    windSpeed: number;
  } | null> {
    if (!this.isApiKeyConfigured()) {
      return null;
    }

    try {
      const coords = await this.geocodeLocation(destination);
      if (!coords) return null;

      const response = await fetch(
        `${WEATHER_API_BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        condition: this.mapWeatherCondition(data.weather[0].main.toLowerCase()),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return null;
    }
  }
}

export const weatherService = WeatherService.getInstance();