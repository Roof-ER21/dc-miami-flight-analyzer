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
export const getGoogleFlightsUrl = (origin: string, dest: string, date: string, _airline?: string, _flightNumber?: string, cabin?: string): string => {
  // Build a specific search query that Google Flights will parse
  const cabinText = cabin === 'First' ? ' first class' : '';
  const searchQuery = `flights from ${origin} to ${dest} on ${date}${cabinText} one way`;

  const params = new URLSearchParams({
    q: searchQuery,
    hl: 'en',
    gl: 'us',
    curr: 'USD',
  });

  return `https://www.google.com/travel/flights?${params.toString()}`;
};

// Generate Kayak URL - cleaner deep linking with prefilled dates
export const getKayakUrl = (origin: string, dest: string, date: string, cabin?: string): string => {
  // Kayak format: /flights/ORIGIN-DEST/DATE?sort=bestflight_a&fs=cabin=X
  const cabinCode = cabin === 'First' ? 'f' : 'e'; // e=economy, p=premium, b=business, f=first
  return `https://www.kayak.com/flights/${origin}-${dest}/${date}?sort=bestflight_a&fs=cabin=${cabinCode}`;
};

// Generate Skyscanner URL - excellent deep linking with exact date
export const getSkyscannerUrl = (origin: string, dest: string, date: string, cabin?: string): string => {
  // Skyscanner format: /transport/flights/ORIGIN/DEST/YYMMDD/
  const formattedDate = date.replace(/-/g, '').slice(2); // YYMMDD format
  const cabinClass = cabin === 'First' ? 'first' : 'economy';
  return `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${formattedDate}/?adultsv2=1&cabinclass=${cabinClass}&rtn=0`;
};

// Generate direct booking link for specific airlines with prefilled search
export const getAirlineDirectUrl = (origin: string, dest: string, date: string, airline: string, cabin?: string): string => {
  const airlineLower = airline.toLowerCase();

  if (airlineLower.includes('american')) {
    return `https://www.aa.com/booking/find-flights?tripType=oneWay&originAirport=${origin}&destinationAirport=${dest}&departureDate=${date}&cabin=${cabin === 'First' ? 'FIRST' : 'ECONOMY'}&passengerCount=1`;
  }
  if (airlineLower.includes('delta')) {
    return `https://www.delta.com/flight-search/book-a-flight?tripType=ONE_WAY&originCity=${origin}&destinationCity=${dest}&departureDate=${date}&paxCount=1&cabinPreference=${cabin === 'First' ? 'FIRST' : 'COACH'}`;
  }
  if (airlineLower.includes('united')) {
    return `https://www.united.com/en/us/fsr/choose-flights?f=${origin}&t=${dest}&d=${date}&tt=1&sc=${cabin === 'First' ? 'first' : 'economy'}&px=1`;
  }
  if (airlineLower.includes('southwest')) {
    return `https://www.southwest.com/air/booking/select.html?originationAirportCode=${origin}&destinationAirportCode=${dest}&departureDate=${date}&tripType=oneway&adultPassengersCount=1`;
  }
  if (airlineLower.includes('jetblue')) {
    return `https://www.jetblue.com/booking/flights?from=${origin}&to=${dest}&depart=${date}&isMultiCity=false&noOfRoute=1&adults=1&fareFamily=${cabin === 'First' ? 'mint' : 'blue'}`;
  }
  if (airlineLower.includes('frontier')) {
    return `https://booking.flyfrontier.com/Flight/Select?o1=${origin}&d1=${dest}&dd1=${date}&ADT=1&mon=true`;
  }
  if (airlineLower.includes('spirit')) {
    return `https://www.spirit.com/book/flights?origin=${origin}&destination=${dest}&departureDate=${date}&adults=1&tripType=one-way`;
  }

  // Fallback to Google Flights
  return getGoogleFlightsUrl(origin, dest, date, airline, undefined, cabin);
};

// Generates a search link for PointsYeah (a great free award tool)
export const getPointsSearchUrl = (_origin: string, _dest: string, _date: string): string => {
  return `https://www.pointsyeah.com/`;
};

export const origins = [AirportCode.DCA, AirportCode.IAD, AirportCode.BWI];
export const destinations = [AirportCode.MIA, AirportCode.FLL];