// Enhanced Value Analyzer with Sweet Spot Detection
// Provides comprehensive flight value analysis for points vs cash decisions

import type { FlightOffer, PointsProgram, EnhancedFlightOffer } from '../types';
import { analyzeFlightRedemption, type FlightRedemptionAnalysis } from './pointsCalculator';

export interface ValueAlert {
  type: 'SWEET_SPOT' | 'EXCELLENT_VALUE' | 'CASH_DEAL' | 'AVOID';
  title: string;
  description: string;
  flight: FlightOffer;
  analysis: FlightRedemptionAnalysis;
}

// Enhance a flight with redemption analysis
export const enhanceFlight = (
  flight: FlightOffer,
  userProgram: PointsProgram = 'MR',
  userPointsBalance?: number
): EnhancedFlightOffer => {
  const analysis = analyzeFlightRedemption(flight, userProgram, userPointsBalance);

  return {
    ...flight,
    bestRedemption: analysis.bestRedemption ? {
      partnerName: analysis.bestRedemption.partner.name,
      sourcePoints: analysis.bestRedemption.sourcePoints,
      cpp: analysis.bestRedemption.cpp,
      recommendation: analysis.bestRedemption.recommendation,
      isSweetSpot: analysis.bestRedemption.isSweetSpot,
    } : null,
    analysisResult: analysis.bestOption,
    savingsAmount: analysis.savingsAmount,
  };
};

// Enhance all flights in a batch
export const enhanceFlights = (
  flights: FlightOffer[],
  userProgram: PointsProgram = 'MR',
  userPointsBalance?: number
): EnhancedFlightOffer[] => {
  return flights.map(f => enhanceFlight(f, userProgram, userPointsBalance));
};

// Find all sweet spots in a list of flights
export const findSweetSpots = (
  flights: FlightOffer[],
  userProgram: PointsProgram = 'MR'
): ValueAlert[] => {
  const alerts: ValueAlert[] = [];

  for (const flight of flights) {
    const analysis = analyzeFlightRedemption(flight, userProgram);

    if (analysis.bestRedemption?.isSweetSpot) {
      alerts.push({
        type: 'SWEET_SPOT',
        title: `Sweet Spot: ${flight.origin} → ${flight.destination}`,
        description: analysis.recommendation,
        flight,
        analysis,
      });
    }
  }

  return alerts.sort((a, b) =>
    (b.analysis.bestRedemption?.cpp || 0) - (a.analysis.bestRedemption?.cpp || 0)
  );
};

// Find best cash deals (flights too cheap to use points)
export const findCashDeals = (
  flights: FlightOffer[],
  userProgram: PointsProgram = 'MR',
  economyThreshold = 150,
  firstThreshold = 400
): ValueAlert[] => {
  const alerts: ValueAlert[] = [];

  for (const flight of flights) {
    const threshold = flight.cabin === 'Economy' ? economyThreshold : firstThreshold;

    if (flight.price < threshold) {
      const analysis = analyzeFlightRedemption(flight, userProgram);
      alerts.push({
        type: 'CASH_DEAL',
        title: `Cash Deal: $${flight.price}`,
        description: `${flight.origin} → ${flight.destination} on ${flight.date}. Too cheap for points!`,
        flight,
        analysis,
      });
    }
  }

  return alerts.sort((a, b) => a.flight.price - b.flight.price);
};

// Find excellent value redemptions (CPP >= 2.0)
export const findExcellentValues = (
  flights: FlightOffer[],
  userProgram: PointsProgram = 'MR'
): ValueAlert[] => {
  const alerts: ValueAlert[] = [];

  for (const flight of flights) {
    const analysis = analyzeFlightRedemption(flight, userProgram);

    if (analysis.bestRedemption && analysis.bestRedemption.cpp >= 2.0 && !analysis.bestRedemption.isSweetSpot) {
      alerts.push({
        type: 'EXCELLENT_VALUE',
        title: `${analysis.bestRedemption.cpp.toFixed(2)} CPP Value`,
        description: `${flight.origin} → ${flight.destination} via ${analysis.bestRedemption.partner.name}`,
        flight,
        analysis,
      });
    }
  }

  return alerts.sort((a, b) =>
    (b.analysis.bestRedemption?.cpp || 0) - (a.analysis.bestRedemption?.cpp || 0)
  );
};

// Get summary stats for a list of flights
export const getFlightStats = (
  flights: FlightOffer[],
  userProgram: PointsProgram = 'MR'
) => {
  const enhancedFlights = enhanceFlights(flights, userProgram);

  const sweetSpots = enhancedFlights.filter(f => f.bestRedemption?.isSweetSpot);
  const cashDeals = enhancedFlights.filter(f => f.analysisResult === 'CASH' && f.price < 150);
  const pointsRecommended = enhancedFlights.filter(f => f.analysisResult === 'POINTS');
  const avgCPP = enhancedFlights
    .filter(f => f.bestRedemption)
    .reduce((sum, f) => sum + (f.bestRedemption?.cpp || 0), 0) /
    enhancedFlights.filter(f => f.bestRedemption).length;

  return {
    totalFlights: flights.length,
    sweetSpotCount: sweetSpots.length,
    cashDealCount: cashDeals.length,
    pointsRecommendedCount: pointsRecommended.length,
    averageCPP: isNaN(avgCPP) ? 0 : avgCPP,
    averagePrice: flights.reduce((sum, f) => sum + f.price, 0) / flights.length,
    lowestPrice: Math.min(...flights.map(f => f.price)),
    highestCPP: Math.max(...enhancedFlights.map(f => f.bestRedemption?.cpp || 0)),
  };
};

// Format CPP value with color class
export const getCPPColorClass = (cpp: number): string => {
  if (cpp >= 2.0) return 'text-emerald-600 bg-emerald-50';
  if (cpp >= 1.5) return 'text-blue-600 bg-blue-50';
  if (cpp >= 1.0) return 'text-amber-600 bg-amber-50';
  return 'text-slate-500 bg-slate-50';
};

// Format recommendation badge
export const getRecommendationBadge = (
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
): { text: string; className: string } => {
  switch (recommendation) {
    case 'EXCELLENT':
      return { text: 'Excellent', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'GOOD':
      return { text: 'Good', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'FAIR':
      return { text: 'Fair', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'POOR':
      return { text: 'Poor', className: 'bg-red-100 text-red-800 border-red-200' };
    default:
      return { text: 'Unknown', className: 'bg-slate-100 text-slate-600' };
  }
};
