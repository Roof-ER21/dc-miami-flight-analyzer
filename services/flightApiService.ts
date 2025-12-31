// SerpAPI Google Flights Integration
import type { FlightOffer, AirportCode } from '../types';
import { analyzeFlightValue } from '../utils/flightLogic';

// SerpAPI Response Types
interface SerpApiFlightSegment {
  departure_airport: {
    name: string;
    id: string;
    time: string;
  };
  arrival_airport: {
    name: string;
    id: string;
    time: string;
  };
  duration: number;
  airplane: string;
  airline: string;
  airline_logo: string;
  travel_class: string;
  flight_number: string;
  legroom?: string;
  extensions?: string[];
}

interface SerpApiLayover {
  duration: number;
  name: string;
  id: string;
  overnight?: boolean;
}

interface SerpApiFlight {
  flights: SerpApiFlightSegment[];
  layovers?: SerpApiLayover[];
  total_duration: number;
  carbon_emissions?: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  price: number;
  type: string;
  airline_logo?: string;
  departure_token?: string;
  booking_token?: string;
}

interface SerpApiResponse {
  search_metadata?: {
    id: string;
    status: string;
    created_at: string;
    processed_at: string;
  };
  search_parameters?: {
    engine: string;
    departure_id: string;
    arrival_id: string;
    outbound_date: string;
  };
  best_flights?: SerpApiFlight[];
  other_flights?: SerpApiFlight[];
  price_insights?: {
    lowest_price: number;
    price_level: string;
    typical_price_range: number[];
  };
  airports?: Array<{
    departure: Array<{ airport: { name: string; id: string } }>;
    arrival: Array<{ airport: { name: string; id: string } }>;
  }>;
  error?: string;
}

const SERPAPI_URL = 'https://serpapi.com/search.json';

// Map travel_class to our cabin type
const mapCabinClass = (travelClass: string): 'Economy' | 'First' => {
  const normalized = travelClass.toLowerCase();
  if (normalized.includes('first') || normalized.includes('business')) {
    return 'First';
  }
  return 'Economy';
};

// Extract time from datetime string (e.g., "2025-01-15 08:30" -> "08:30")
const extractTime = (datetime: string): string => {
  const parts = datetime.split(' ');
  return parts.length > 1 ? parts[1] : datetime;
};

// Transform SerpAPI response to our FlightOffer format
const transformSerpApiResponse = (
  data: SerpApiResponse,
  searchDate: string
): FlightOffer[] => {
  const flights: FlightOffer[] = [];

  const allFlights = [
    ...(data.best_flights || []),
    ...(data.other_flights || []),
  ];

  allFlights.forEach((flight, index) => {
    if (!flight.flights || flight.flights.length === 0) return;

    const firstSegment = flight.flights[0];
    const lastSegment = flight.flights[flight.flights.length - 1];
    const cabin = mapCabinClass(firstSegment.travel_class);

    const offer: FlightOffer = {
      id: `serp-${searchDate}-${firstSegment.flight_number}-${index}`,
      date: searchDate,
      origin: firstSegment.departure_airport.id as AirportCode,
      destination: lastSegment.arrival_airport.id as AirportCode,
      airline: firstSegment.airline,
      flightNumber: firstSegment.flight_number,
      departureTime: extractTime(firstSegment.departure_airport.time),
      price: flight.price,
      currency: 'USD',
      status: analyzeFlightValue(flight.price, cabin),
      stops: flight.flights.length - 1,
      cabin,
    };

    flights.push(offer);
  });

  // Sort by price
  flights.sort((a, b) => a.price - b.price);

  return flights;
};

// Check if API key is available
export const hasApiKey = (): boolean => {
  const key = import.meta.env.VITE_SERPAPI_KEY;
  return !!key && key !== 'PLACEHOLDER_API_KEY' && key.length > 10;
};

// Search flights using SerpAPI
export const searchFlightsApi = async (
  origin: AirportCode,
  destination: AirportCode,
  departureDate: string
): Promise<FlightOffer[]> => {
  const apiKey = import.meta.env.VITE_SERPAPI_KEY;

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('SERPAPI_KEY not configured');
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departureDate,
    type: '2', // One-way
    currency: 'USD',
    hl: 'en',
    api_key: apiKey,
  });

  const response = await fetch(`${SERPAPI_URL}?${params}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('API_QUOTA_EXCEEDED');
    }
    if (response.status === 401) {
      throw new Error('API_KEY_INVALID');
    }
    throw new Error(`API request failed: ${response.status}`);
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return transformSerpApiResponse(data, departureDate);
};

// Search multiple dates
export const searchFlightsMultipleDates = async (
  origins: AirportCode[],
  destinations: AirportCode[],
  dates: string[]
): Promise<FlightOffer[]> => {
  const allFlights: FlightOffer[] = [];
  const errors: string[] = [];

  // Limit concurrent requests to avoid rate limiting
  const MAX_CONCURRENT = 3;
  const requests: Array<{ origin: AirportCode; dest: AirportCode; date: string }> = [];

  // Build request list
  for (const origin of origins) {
    for (const dest of destinations) {
      for (const date of dates) {
        requests.push({ origin, dest, date });
      }
    }
  }

  // Process in batches
  for (let i = 0; i < requests.length; i += MAX_CONCURRENT) {
    const batch = requests.slice(i, i + MAX_CONCURRENT);

    const results = await Promise.allSettled(
      batch.map(({ origin, dest, date }) =>
        searchFlightsApi(origin, dest, date)
      )
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allFlights.push(...result.value);
      } else {
        errors.push(`${batch[idx].origin}-${batch[idx].dest}: ${result.reason}`);
      }
    });

    // Small delay between batches to respect rate limits
    if (i + MAX_CONCURRENT < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (errors.length > 0 && allFlights.length === 0) {
    throw new Error(errors[0]);
  }

  return allFlights;
};
