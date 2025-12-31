import { ValueStatus, AirportCode } from '../types';

// Helper to format date as YYYY-MM-DD
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Generate list of Mon, Wed, Fri for next 90 days
export const generateTravelDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  // Start from tomorrow
  const start = new Date(today);
  start.setDate(today.getDate() + 1);

  for (let i = 0; i < 90; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // We want Mon (1), Wed (3), Fri (5)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      dates.push(current);
    }
  }
  return dates;
};

// Updated Logic: Context-aware value analysis
export const analyzeFlightValue = (price: number, cabin: 'Economy' | 'First'): ValueStatus => {
  if (cabin === 'First') {
    // First Class Thresholds
    if (price < 450) return ValueStatus.CASH_DEAL; // Excellent First Class price
    if (price > 900) return ValueStatus.CHECK_POINTS; // Expensive, check points
    return ValueStatus.STANDARD;
  } else {
    // Economy Thresholds
    if (price < 150) return ValueStatus.CASH_DEAL; // Excellent Eco price
    if (price > 350) return ValueStatus.CHECK_POINTS; // Expensive, check points
    return ValueStatus.STANDARD;
  }
};

// Calculate Cents Per Point based on a baseline award cost (e.g. 10,000 points)
export const calculateCPP = (price: number): number => {
  const ASSUMED_POINTS_COST = 10000;
  return (price / ASSUMED_POINTS_COST) * 100;
};

export const getStatusColor = (status: ValueStatus | string): string => {
  switch (status) {
    case ValueStatus.CASH_DEAL:
    case 'GOOD VALUE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case ValueStatus.CHECK_POINTS:
    case 'POOR VALUE':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

// Generates a deep link to Google Flights for the specific route and date
// Optional: Include airline, flight number, and cabin for a more specific search
export const getGoogleFlightsUrl = (origin: string, dest: string, date: string, airline?: string, flightNumber?: string, cabin?: string): string => {
  let query = `Flights to ${dest} from ${origin} on ${date}`;
  if (airline && flightNumber) {
    // Adding airline and flight number makes the search result much more specific
    query = `${airline} flight ${flightNumber} from ${origin} to ${dest} on ${date}`;
  }
  // Append cabin class to the query if it's not Economy (Google defaults to Economy)
  if (cabin && cabin === 'First') {
    query += ` in First Class`;
  }
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
};

// Generates a search link for PointsYeah (a great free award tool)
export const getPointsSearchUrl = (_origin: string, _dest: string, _date: string): string => {
  // Direct deep linking to results often requires auth tokens for these tools.
  // We direct the user to the homepage of PointsYeah which is highly rated for this.
  return `https://www.pointsyeah.com/`; 
};

export const origins = [AirportCode.DCA, AirportCode.IAD, AirportCode.BWI];
export const destinations = [AirportCode.MIA, AirportCode.FLL];