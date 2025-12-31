import { FlightOffer, AirportCode } from '../types';
import { generateTravelDates, analyzeFlightValue, formatDateISO } from '../utils/flightLogic';

// Simulation of Airlines commonly flying these routes
const AIRLINES = ['American Airlines', 'United', 'Delta', 'Southwest', 'JetBlue'];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMockPrice = (date: Date): number => {
  // Simulate standard deviation
  let basePrice = 250;
  
  // Weekend proximity logic (Fri is more expensive)
  if (date.getDay() === 5) basePrice += 50;

  // Random fluctuation
  const fluctuation = getRandomInt(-120, 300);
  
  let finalPrice = basePrice + fluctuation;
  if (finalPrice < 79) finalPrice = 79; // Minimum logical price
  return finalPrice;
};

// Mimics an API call to fetch flight data
export const fetchFlightDeals = async (
  selectedOrigins: AirportCode[],
  selectedDestinations: AirportCode[]
): Promise<FlightOffer[]> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const dates = generateTravelDates();
      const offers: FlightOffer[] = [];

      dates.forEach((date) => {
        selectedOrigins.forEach((origin) => {
          selectedDestinations.forEach((dest) => {
            // Random chance that a flight exists for this specific route/day (most do)
            if (Math.random() > 0.1) {
                // Determine base price
                let price = generateMockPrice(date);
                
                // Determine Cabin Class
                // 15% chance of being First Class
                const isFirstClass = Math.random() < 0.15;
                const cabin = isFirstClass ? 'First' : 'Economy';
                
                // Adjust price for First Class
                if (isFirstClass) {
                  // Sometimes we find a "Deal" on First Class (e.g. $350-$450)
                  const isDeal = Math.random() < 0.2; 
                  if (isDeal) {
                    price = getRandomInt(380, 550);
                  } else {
                    price = Math.round(price * 2.5 + getRandomInt(50, 150));
                  }
                }

                const airline = AIRLINES[getRandomInt(0, AIRLINES.length - 1)];
                const flightNum = `${airline.substring(0, 2).toUpperCase()}${getRandomInt(100, 9999)}`;
                // 80% chance of direct flight for these routes
                const stops = Math.random() > 0.8 ? 1 : 0; 
                
                offers.push({
                  id: `${origin}-${dest}-${formatDateISO(date)}-${flightNum}`,
                  date: formatDateISO(date),
                  origin,
                  destination: dest,
                  airline,
                  flightNumber: flightNum,
                  departureTime: `${getRandomInt(6, 21).toString().padStart(2, '0')}:${getRandomInt(0, 5)}0`,
                  price,
                  currency: 'USD',
                  status: analyzeFlightValue(price, cabin as 'Economy' | 'First'),
                  stops: stops,
                  cabin: cabin as 'Economy' | 'First',
                });
            }
          });
        });
      });
      
      // Sort by date then price
      offers.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.price - b.price;
      });

      resolve(offers);
    }, 1500);
  });
};