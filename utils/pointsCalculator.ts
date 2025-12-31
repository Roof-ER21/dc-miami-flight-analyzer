// Multi-Partner Points Calculator Engine
// Calculates CPP across all transfer partners for any points program

import {
  POINTS_PROGRAMS,
  PointsProgram,
  getPartnersForProgram,
} from '../data/transferPartners';
import type { TransferPartner } from '../data/transferPartners';
import type { FlightOffer } from '../types';

export interface RedemptionOption {
  partner: TransferPartner;
  partnerPoints: number; // Points in partner currency
  sourcePoints: number; // Points needed from source program (after ratio)
  transferRatio: number;
  taxes: number;
  totalCost: number; // sourcePoints valued at program CPP + taxes
  cpp: number; // Cents per point achieved
  isSweetSpot: boolean;
  sweetSpotDescription?: string;
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  savingsVsCash: number; // How much saved vs paying cash
}

export interface FlightRedemptionAnalysis {
  cashPrice: number;
  bestOption: 'CASH' | 'POINTS';
  bestRedemption: RedemptionOption | null;
  allRedemptions: RedemptionOption[];
  recommendation: string;
  savingsAmount: number;
}

// Calculate CPP for a specific redemption
const calculateCPPForRedemption = (
  cashPrice: number,
  taxes: number,
  sourcePoints: number
): number => {
  if (sourcePoints === 0) return 0;
  // CPP = (Cash Price - Taxes) / Points * 100
  return ((cashPrice - taxes) / sourcePoints) * 100;
};

// Get recommendation based on CPP
const getRecommendation = (cpp: number): RedemptionOption['recommendation'] => {
  if (cpp >= 2.0) return 'EXCELLENT'; // Beating program valuation
  if (cpp >= 1.5) return 'GOOD'; // Solid value
  if (cpp >= 1.0) return 'FAIR'; // Okay value
  return 'POOR'; // Below 1 CPP is generally bad
};

// Calculate all redemption options for a flight
export const calculateAllRedemptions = (
  flight: FlightOffer,
  userProgram: PointsProgram = 'MR'
): RedemptionOption[] => {
  const partners = getPartnersForProgram(userProgram);
  const programValuation = POINTS_PROGRAMS[userProgram].valuationCPP;

  return partners
    .map((partner) => {
      // Get base points required
      const basePoints =
        flight.cabin === 'Economy'
          ? partner.domesticEconomy.saver
          : partner.domesticFirst.saver;

      // Get transfer ratio
      const transferRatio = partner.transferRatios[userProgram] || 1.0;

      // Check for sweet spots
      const sweetSpot = partner.sweetSpots.find(
        (ss) => ss.cabin === flight.cabin
      );

      const finalPartnerPoints = sweetSpot?.points ?? basePoints;
      const finalSourcePoints = Math.ceil(finalPartnerPoints / transferRatio);
      const taxes = sweetSpot?.taxes ?? 5.60;

      // Calculate CPP
      const cpp = calculateCPPForRedemption(flight.price, taxes, finalSourcePoints);

      // Calculate savings vs cash
      const pointsValueAtProgramRate = finalSourcePoints * (programValuation / 100);
      const totalPointsCost = pointsValueAtProgramRate + taxes;
      const savingsVsCash = flight.price - totalPointsCost;

      return {
        partner,
        partnerPoints: finalPartnerPoints,
        sourcePoints: finalSourcePoints,
        transferRatio,
        taxes,
        totalCost: totalPointsCost,
        cpp,
        isSweetSpot: !!sweetSpot,
        sweetSpotDescription: sweetSpot?.description,
        recommendation: getRecommendation(cpp),
        savingsVsCash,
      };
    })
    .sort((a, b) => b.cpp - a.cpp); // Sort by best CPP first
};

// Get the best redemption option
export const getBestRedemption = (
  flight: FlightOffer,
  userProgram: PointsProgram = 'MR'
): RedemptionOption | null => {
  const redemptions = calculateAllRedemptions(flight, userProgram);
  return redemptions.length > 0 ? redemptions[0] : null;
};

// Full flight analysis - should you pay cash or use points?
export const analyzeFlightRedemption = (
  flight: FlightOffer,
  userProgram: PointsProgram = 'MR',
  userPointsBalance?: number
): FlightRedemptionAnalysis => {
  const allRedemptions = calculateAllRedemptions(flight, userProgram);
  const bestRedemption = allRedemptions.length > 0 ? allRedemptions[0] : null;

  // No redemption options available
  if (!bestRedemption) {
    return {
      cashPrice: flight.price,
      bestOption: 'CASH',
      bestRedemption: null,
      allRedemptions: [],
      recommendation: 'No transfer partners available for this program.',
      savingsAmount: 0,
    };
  }

  // Check if user has enough points
  const canAfford = userPointsBalance === undefined || userPointsBalance >= bestRedemption.sourcePoints;

  // Decision logic
  let bestOption: 'CASH' | 'POINTS';
  let recommendation: string;
  let savingsAmount: number;

  // Sweet spot - almost always use points
  if (bestRedemption.isSweetSpot && bestRedemption.cpp >= 1.5) {
    bestOption = 'POINTS';
    savingsAmount = bestRedemption.savingsVsCash;
    recommendation = `SWEET SPOT! Use ${bestRedemption.partner.name} for ${bestRedemption.cpp.toFixed(2)} CPP. ${bestRedemption.sweetSpotDescription}`;

    if (!canAfford && userPointsBalance !== undefined) {
      recommendation += ` (Need ${(bestRedemption.sourcePoints - userPointsBalance).toLocaleString()} more points)`;
    }
  }
  // Excellent value - strongly recommend points
  else if (bestRedemption.cpp >= 2.0) {
    bestOption = 'POINTS';
    savingsAmount = bestRedemption.savingsVsCash;
    recommendation = `Excellent value! Use ${bestRedemption.partner.name} at ${bestRedemption.cpp.toFixed(2)} CPP.`;
  }
  // Good value - recommend points
  else if (bestRedemption.cpp >= 1.5) {
    bestOption = 'POINTS';
    savingsAmount = bestRedemption.savingsVsCash;
    recommendation = `Good value. Consider ${bestRedemption.partner.name} at ${bestRedemption.cpp.toFixed(2)} CPP.`;
  }
  // Cash is cheap - recommend cash
  else if (
    (flight.cabin === 'Economy' && flight.price < 150) ||
    (flight.cabin === 'First' && flight.price < 400)
  ) {
    bestOption = 'CASH';
    savingsAmount = Math.abs(bestRedemption.savingsVsCash);
    recommendation = `Cash deal! This price is too low to justify using points (${bestRedemption.cpp.toFixed(2)} CPP).`;
  }
  // Fair value - could go either way
  else if (bestRedemption.cpp >= 1.0) {
    bestOption = bestRedemption.savingsVsCash > 0 ? 'POINTS' : 'CASH';
    savingsAmount = Math.abs(bestRedemption.savingsVsCash);
    recommendation = bestRedemption.savingsVsCash > 0
      ? `Fair value. ${bestRedemption.partner.name} at ${bestRedemption.cpp.toFixed(2)} CPP saves ~$${savingsAmount.toFixed(0)}.`
      : `Consider cash. Points value (${bestRedemption.cpp.toFixed(2)} CPP) is marginal.`;
  }
  // Poor value - use cash
  else {
    bestOption = 'CASH';
    savingsAmount = Math.abs(bestRedemption.savingsVsCash);
    recommendation = `Pay cash. Point value too low (${bestRedemption.cpp.toFixed(2)} CPP). Save points for better redemptions.`;
  }

  return {
    cashPrice: flight.price,
    bestOption,
    bestRedemption,
    allRedemptions,
    recommendation,
    savingsAmount,
  };
};

// Legacy CPP calculation for backwards compatibility
export const calculateLegacyCPP = (price: number, cabin: 'Economy' | 'First' = 'Economy'): number => {
  // Use Avianca as baseline (best sweet spot)
  const assumedPoints = cabin === 'Economy' ? 10000 : 20000;
  return (price / assumedPoints) * 100;
};

// Get all sweet spots from all partners for a program
export const getAllSweetSpots = (program: PointsProgram) => {
  const partners = getPartnersForProgram(program);
  return partners.flatMap((partner) =>
    partner.sweetSpots.map((ss) => ({
      ...ss,
      partner,
      sourcePoints: Math.ceil(ss.points / (partner.transferRatios[program] || 1)),
    }))
  );
};
