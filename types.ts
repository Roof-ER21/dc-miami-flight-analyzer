export enum AirportCode {
  DCA = 'DCA',
  IAD = 'IAD',
  BWI = 'BWI',
  MIA = 'MIA',
  FLL = 'FLL',
}

export interface FlightRoute {
  origin: AirportCode;
  destination: AirportCode;
}

export enum ValueStatus {
  CASH_DEAL = 'CASH DEAL',
  CHECK_POINTS = 'CHECK POINTS',
  STANDARD = 'STANDARD',
}

export interface FlightOffer {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  airline: string;
  flightNumber: string;
  departureTime: string;
  origin: AirportCode;
  destination: AirportCode;
  price: number;
  currency: string;
  status: ValueStatus;
  stops: number;
  cabin: 'Economy' | 'First';
}

export interface FilterState {
  origins: AirportCode[];
  destinations: AirportCode[];
}

// Points program type
export type PointsProgram = 'MR' | 'UR' | 'TYP' | 'C1' | 'BILT';

// User preferences stored in localStorage
export interface UserPreferences {
  pointsProgram: PointsProgram;
  pointsBalance: number;
  preferredAirlines: string[];
  cashDealThreshold: { economy: number; first: number };
  pointsThreshold: { economy: number; first: number };
  darkMode: boolean;
}

// Enhanced flight with redemption analysis
export interface EnhancedFlightOffer extends FlightOffer {
  bestRedemption: {
    partnerName: string;
    sourcePoints: number;
    cpp: number;
    recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    isSweetSpot: boolean;
  } | null;
  analysisResult: 'CASH' | 'POINTS';
  savingsAmount: number;
}