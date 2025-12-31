// 2025 Transfer Partner Data for Major Points Programs
// Sources: The Points Guy, Upgraded Points, US Credit Card Guide

export type PointsProgram = 'MR' | 'UR' | 'TYP' | 'C1' | 'BILT';

export interface SweetSpot {
  description: string;
  points: number;
  taxes: number;
  cabin: 'Economy' | 'First' | 'Business';
  routePattern?: string; // Optional route matching
}

export interface TransferPartner {
  id: string;
  name: string;
  code: string; // Airline code
  programs: PointsProgram[]; // Which programs transfer here
  transferRatios: Partial<Record<PointsProgram, number>>; // Ratio per program
  domesticEconomy: { saver: number; standard: number };
  domesticFirst: { saver: number; standard: number };
  domesticBusiness?: { saver: number; standard: number };
  valuationCPP: number; // Average cents per point value
  sweetSpots: SweetSpot[];
  bookingUrl: string;
  notes?: string;
}

// 2025 Award Charts - Domestic US Routes
export const TRANSFER_PARTNERS: TransferPartner[] = [
  {
    id: 'avianca',
    name: 'Avianca LifeMiles',
    code: 'AV',
    programs: ['MR', 'UR', 'TYP', 'C1', 'BILT'],
    transferRatios: { MR: 1.0, UR: 1.0, TYP: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 10000, standard: 15000 },
    domesticFirst: { saver: 20000, standard: 30000 },
    valuationCPP: 1.4,
    sweetSpots: [
      {
        description: 'Domestic Economy - THE Sweet Spot (Star Alliance)',
        points: 10000,
        taxes: 5.60,
        cabin: 'Economy',
      },
      {
        description: 'Domestic First Class',
        points: 20000,
        taxes: 5.60,
        cabin: 'First',
      },
    ],
    bookingUrl: 'https://www.lifemiles.com/',
    notes: 'Best value for domestic flights. Books United, AA, and other partners.',
  },
  {
    id: 'british-airways',
    name: 'British Airways Avios',
    code: 'BA',
    programs: ['MR', 'UR', 'TYP', 'C1', 'BILT'],
    transferRatios: { MR: 1.0, UR: 1.0, TYP: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 11000, standard: 16500 },
    domesticFirst: { saver: 22000, standard: 33000 },
    valuationCPP: 1.5,
    sweetSpots: [
      {
        description: 'Short-haul AA flights (under 1151 miles)',
        points: 11000,
        taxes: 5.60,
        cabin: 'Economy',
      },
    ],
    bookingUrl: 'https://www.britishairways.com/',
    notes: 'Great for booking AA flights. Distance-based pricing.',
  },
  {
    id: 'aadvantage',
    name: 'American Airlines AAdvantage',
    code: 'AA',
    programs: ['MR', 'UR', 'TYP', 'C1', 'BILT'],
    transferRatios: { MR: 1.0, UR: 1.0, TYP: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 12500, standard: 20000 },
    domesticFirst: { saver: 25000, standard: 45000 },
    valuationCPP: 1.4,
    sweetSpots: [
      {
        description: 'Web Specials Economy',
        points: 7500,
        taxes: 5.60,
        cabin: 'Economy',
      },
    ],
    bookingUrl: 'https://www.aa.com/',
    notes: 'Look for Web Specials for better rates.',
  },
  {
    id: 'delta',
    name: 'Delta SkyMiles',
    code: 'DL',
    programs: ['MR'],
    transferRatios: { MR: 1.0 },
    domesticEconomy: { saver: 12000, standard: 35000 },
    domesticFirst: { saver: 30000, standard: 80000 },
    valuationCPP: 1.2,
    sweetSpots: [],
    bookingUrl: 'https://www.delta.com/',
    notes: 'Dynamic pricing. Flash sales occasionally.',
  },
  {
    id: 'jetblue',
    name: 'JetBlue TrueBlue',
    code: 'B6',
    programs: ['MR', 'UR', 'TYP', 'C1', 'BILT'],
    transferRatios: { MR: 0.8, UR: 1.0, TYP: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 6000, standard: 20000 },
    domesticFirst: { saver: 15000, standard: 45000 }, // Mint
    valuationCPP: 1.3,
    sweetSpots: [
      {
        description: 'Low-cost economy redemptions',
        points: 6000,
        taxes: 5.60,
        cabin: 'Economy',
      },
    ],
    bookingUrl: 'https://www.jetblue.com/',
    notes: 'Revenue-based. Best for cheap flights. Direct DCA-MIA routes.',
  },
  {
    id: 'united',
    name: 'United MileagePlus',
    code: 'UA',
    programs: ['UR', 'TYP', 'BILT'],
    transferRatios: { UR: 1.0, TYP: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 12500, standard: 25000 },
    domesticFirst: { saver: 25000, standard: 50000 },
    valuationCPP: 1.2,
    sweetSpots: [],
    bookingUrl: 'https://www.united.com/',
    notes: 'Dynamic pricing since 2023.',
  },
  {
    id: 'southwest',
    name: 'Southwest Rapid Rewards',
    code: 'WN',
    programs: ['UR', 'C1', 'BILT'],
    transferRatios: { UR: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 8000, standard: 25000 },
    domesticFirst: { saver: 8000, standard: 25000 }, // No first class
    valuationCPP: 1.3,
    sweetSpots: [],
    bookingUrl: 'https://www.southwest.com/',
    notes: 'Revenue-based. No blackout dates.',
  },
  {
    id: 'virgin-atlantic',
    name: 'Virgin Atlantic Flying Club',
    code: 'VS',
    programs: ['MR', 'UR', 'TYP', 'C1', 'BILT'],
    transferRatios: { MR: 1.0, UR: 1.0, TYP: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 12500, standard: 20000 },
    domesticFirst: { saver: 25000, standard: 40000 },
    valuationCPP: 1.5,
    sweetSpots: [
      {
        description: 'Book Delta domestic via Virgin',
        points: 12500,
        taxes: 5.60,
        cabin: 'Economy',
      },
    ],
    bookingUrl: 'https://www.virginatlantic.com/',
    notes: 'Can book Delta flights at better rates than SkyMiles.',
  },
  {
    id: 'air-france-klm',
    name: 'Air France/KLM Flying Blue',
    code: 'AF',
    programs: ['MR', 'UR', 'TYP', 'C1', 'BILT'],
    transferRatios: { MR: 1.0, UR: 1.0, TYP: 1.0, C1: 1.0, BILT: 1.0 },
    domesticEconomy: { saver: 12500, standard: 18750 },
    domesticFirst: { saver: 25000, standard: 37500 },
    valuationCPP: 1.4,
    sweetSpots: [
      {
        description: 'Promo Rewards discounts',
        points: 10000,
        taxes: 5.60,
        cabin: 'Economy',
      },
    ],
    bookingUrl: 'https://www.flyingblue.com/',
    notes: 'Monthly Promo Rewards with discounts up to 50%.',
  },
];

// Points program metadata
export const POINTS_PROGRAMS: Record<PointsProgram, {
  name: string;
  fullName: string;
  valuationCPP: number;
  color: string;
}> = {
  MR: {
    name: 'Amex MR',
    fullName: 'American Express Membership Rewards',
    valuationCPP: 2.0,
    color: '#006FCF', // Amex blue
  },
  UR: {
    name: 'Chase UR',
    fullName: 'Chase Ultimate Rewards',
    valuationCPP: 2.0,
    color: '#1A4480', // Chase blue
  },
  TYP: {
    name: 'Citi TYP',
    fullName: 'Citi ThankYou Points',
    valuationCPP: 1.8,
    color: '#003B70', // Citi blue
  },
  C1: {
    name: 'Capital One',
    fullName: 'Capital One Miles',
    valuationCPP: 1.85,
    color: '#D03027', // Capital One red
  },
  BILT: {
    name: 'Bilt',
    fullName: 'Bilt Rewards Points',
    valuationCPP: 1.8,
    color: '#000000', // Bilt black
  },
};

// Helper to get partners available for a specific program
export const getPartnersForProgram = (program: PointsProgram): TransferPartner[] => {
  return TRANSFER_PARTNERS.filter(p => p.programs.includes(program));
};

// Helper to get best partner for a domestic flight
export const getBestDomesticPartner = (
  program: PointsProgram,
  cabin: 'Economy' | 'First'
): TransferPartner | null => {
  const partners = getPartnersForProgram(program);
  if (partners.length === 0) return null;

  return partners.reduce((best, current) => {
    const bestPoints = cabin === 'Economy'
      ? best.domesticEconomy.saver
      : best.domesticFirst.saver;
    const currentPoints = cabin === 'Economy'
      ? current.domesticEconomy.saver
      : current.domesticFirst.saver;

    // Adjust for transfer ratio
    const bestRatio = best.transferRatios[program] || 1;
    const currentRatio = current.transferRatios[program] || 1;

    const bestEffective = bestPoints / bestRatio;
    const currentEffective = currentPoints / currentRatio;

    return currentEffective < bestEffective ? current : best;
  });
};
