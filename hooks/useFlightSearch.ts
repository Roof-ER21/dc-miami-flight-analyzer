// useFlightSearch - Combined API + Mock fallback hook with caching
import { useState, useCallback } from 'react';
import type { FlightOffer, AirportCode } from '../types';
import { fetchFlightDeals } from '../services/mockFlightService';
import { searchFlightsMultipleDates, hasApiKey } from '../services/flightApiService';
import { generateTravelDates, formatDateISO } from '../utils/flightLogic';

export type DataSource = 'api' | 'mock' | 'cache' | 'none';

// Cache configuration
const CACHE_KEY = 'dc-miami-flight-cache';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

interface CachedData {
  flights: FlightOffer[];
  timestamp: number;
  source: 'api' | 'mock';
  origins: string[];
  destinations: string[];
}

// Cache utilities
const getCache = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
};

const setCache = (data: CachedData): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache flight data:', e);
  }
};

const isCacheValid = (
  cache: CachedData | null,
  origins: AirportCode[],
  destinations: AirportCode[]
): boolean => {
  if (!cache) return false;

  // Check if cache is expired
  const age = Date.now() - cache.timestamp;
  if (age > CACHE_DURATION_MS) return false;

  // Check if origins/destinations match
  const originsMatch = origins.every(o => cache.origins.includes(o)) &&
                       cache.origins.every(o => origins.includes(o as AirportCode));
  const destsMatch = destinations.every(d => cache.destinations.includes(d)) &&
                     cache.destinations.every(d => destinations.includes(d as AirportCode));

  return originsMatch && destsMatch;
};

const getCacheAge = (cache: CachedData | null): string => {
  if (!cache) return '';

  const ageMs = Date.now() - cache.timestamp;
  const ageMinutes = Math.floor(ageMs / (60 * 1000));
  const ageHours = Math.floor(ageMinutes / 60);

  if (ageHours > 0) {
    return `${ageHours}h ${ageMinutes % 60}m ago`;
  }
  return `${ageMinutes}m ago`;
};

interface UseFlightSearchResult {
  flights: FlightOffer[];
  isLoading: boolean;
  error: string | null;
  dataSource: DataSource;
  searchFlights: (origins: AirportCode[], destinations: AirportCode[], forceRefresh?: boolean) => Promise<void>;
  hasRealApiKey: boolean;
  cacheAge: string;
  clearCache: () => void;
}

export const useFlightSearch = (): UseFlightSearchResult => {
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('none');
  const [cacheAge, setCacheAge] = useState<string>('');

  const hasRealApiKey = hasApiKey();

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCacheAge('');
  }, []);

  const searchFlights = useCallback(async (
    origins: AirportCode[],
    destinations: AirportCode[],
    forceRefresh: boolean = false
  ) => {
    setIsLoading(true);
    setError(null);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cache = getCache();
      if (isCacheValid(cache, origins, destinations)) {
        console.log('Using cached flight data');
        setFlights(cache!.flights);
        setDataSource('cache');
        setCacheAge(getCacheAge(cache));
        setIsLoading(false);
        return;
      }
    }

    try {
      // Try real API if key is available
      if (hasRealApiKey) {
        try {
          const dates = generateTravelDates();
          const dateStrings = dates.map(d => formatDateISO(d));

          // Limit to first 3 dates to conserve API calls (free tier = 250/month)
          const limitedDates = dateStrings.slice(0, 3);

          const apiFlights = await searchFlightsMultipleDates(
            origins,
            destinations,
            limitedDates
          );

          if (apiFlights.length > 0) {
            // Cache the results
            setCache({
              flights: apiFlights,
              timestamp: Date.now(),
              source: 'api',
              origins: origins as string[],
              destinations: destinations as string[],
            });

            setFlights(apiFlights);
            setDataSource('api');
            setCacheAge('Just now');
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

          // Log but continue to fallback
          console.warn('API search failed, falling back to mock:', errorMessage);

          if (errorMessage === 'API_QUOTA_EXCEEDED') {
            setError('API quota exceeded for this month. Showing sample data.');
          } else if (errorMessage === 'API_KEY_INVALID') {
            setError('Invalid API key. Showing sample data.');
          }
          // Continue to mock fallback
        }
      }

      // Fallback to mock data
      const mockFlights = await fetchFlightDeals(origins, destinations);

      // Cache mock data too (so we don't regenerate it constantly)
      setCache({
        flights: mockFlights,
        timestamp: Date.now(),
        source: 'mock',
        origins: origins as string[],
        destinations: destinations as string[],
      });

      setFlights(mockFlights);
      setDataSource('mock');
      setCacheAge('Just now');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flights';
      setError(errorMessage);
      setFlights([]);
      setDataSource('none');
    } finally {
      setIsLoading(false);
    }
  }, [hasRealApiKey]);

  return {
    flights,
    isLoading,
    error,
    dataSource,
    searchFlights,
    hasRealApiKey,
    cacheAge,
    clearCache,
  };
};
