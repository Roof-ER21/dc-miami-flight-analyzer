// useFlightSearch - Combined API + Mock fallback hook
import { useState, useCallback } from 'react';
import type { FlightOffer, AirportCode } from '../types';
import { fetchFlightDeals } from '../services/mockFlightService';
import { searchFlightsMultipleDates, hasApiKey } from '../services/flightApiService';
import { generateTravelDates, formatDateISO } from '../utils/flightLogic';

export type DataSource = 'api' | 'mock' | 'none';

interface UseFlightSearchResult {
  flights: FlightOffer[];
  isLoading: boolean;
  error: string | null;
  dataSource: DataSource;
  searchFlights: (origins: AirportCode[], destinations: AirportCode[]) => Promise<void>;
  hasRealApiKey: boolean;
}

export const useFlightSearch = (): UseFlightSearchResult => {
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('none');

  const hasRealApiKey = hasApiKey();

  const searchFlights = useCallback(async (
    origins: AirportCode[],
    destinations: AirportCode[]
  ) => {
    setIsLoading(true);
    setError(null);

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
            setFlights(apiFlights);
            setDataSource('api');
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
      setFlights(mockFlights);
      setDataSource('mock');

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
  };
};
