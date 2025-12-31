// Price Checker - Compare current prices against watched routes
import type { FlightOffer } from '../types';
import type { WatchedRoute, PriceAlert } from '../hooks/usePriceAlerts';

interface PriceCheckResult {
  newAlerts: Omit<PriceAlert, 'id' | 'createdAt' | 'dismissed'>[];
  updatedRoutes: { routeId: string; price: number }[];
}

// Get stored baseline prices for comparison
const PRICE_HISTORY_KEY = 'dc-miami-price-history';

interface PriceHistoryEntry {
  routeKey: string; // origin-destination-date
  price: number;
  airline: string;
  checkedAt: string;
}

const getPriceHistory = (): Record<string, PriceHistoryEntry> => {
  try {
    const stored = localStorage.getItem(PRICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const savePriceHistory = (history: Record<string, PriceHistoryEntry>) => {
  localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(history));
};

const getRouteKey = (origin: string, destination: string, date: string): string => {
  return `${origin}-${destination}-${date}`;
};

// Check if a flight date falls within a watched route's date range
const isDateInRange = (flightDate: string, dateFrom: string, dateTo: string): boolean => {
  const flight = new Date(flightDate);
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  return flight >= from && flight <= to;
};

export const checkPricesAgainstWatched = (
  flights: FlightOffer[],
  watchedRoutes: WatchedRoute[]
): PriceCheckResult => {
  const newAlerts: Omit<PriceAlert, 'id' | 'createdAt' | 'dismissed'>[] = [];
  const updatedRoutes: { routeId: string; price: number }[] = [];
  const priceHistory = getPriceHistory();
  const updatedHistory = { ...priceHistory };

  // Group flights by route for easier lookup
  const flightsByRoute = flights.reduce((acc, flight) => {
    const key = getRouteKey(flight.origin, flight.destination, flight.date);
    if (!acc[key] || acc[key].price > flight.price) {
      acc[key] = flight;
    }
    return acc;
  }, {} as Record<string, FlightOffer>);

  // Check each watched route
  watchedRoutes.forEach((route) => {
    let lowestPriceForRoute: number | null = null;
    let bestFlight: FlightOffer | null = null;

    // Find all matching flights for this route's date range
    Object.entries(flightsByRoute).forEach(([_key, flight]) => {
      if (
        flight.origin === route.origin &&
        flight.destination === route.destination &&
        isDateInRange(flight.date, route.dateFrom, route.dateTo)
      ) {
        if (lowestPriceForRoute === null || flight.price < lowestPriceForRoute) {
          lowestPriceForRoute = flight.price;
          bestFlight = flight;
        }
      }
    });

    if (lowestPriceForRoute !== null && bestFlight) {
      // Track updated price for this route
      updatedRoutes.push({ routeId: route.id, price: lowestPriceForRoute });

      // Check if price dropped below target
      if (lowestPriceForRoute <= route.targetPrice) {
        // Check if we already alerted for this price
        const historyKey = getRouteKey(route.origin, route.destination, bestFlight.date);
        const previousEntry = priceHistory[historyKey];

        if (!previousEntry || previousEntry.price > lowestPriceForRoute) {
          // Price dropped! Create alert
          const savedAmount = previousEntry
            ? previousEntry.price - lowestPriceForRoute
            : (route.lastPrice || route.targetPrice) - lowestPriceForRoute;

          if (savedAmount > 0) {
            newAlerts.push({
              routeId: route.id,
              origin: route.origin,
              destination: route.destination,
              date: bestFlight.date,
              previousPrice: previousEntry?.price || route.lastPrice || route.targetPrice,
              currentPrice: lowestPriceForRoute,
              savedAmount: Math.max(0, savedAmount),
              airline: bestFlight.airline,
            });
          }
        }

        // Update price history
        updatedHistory[historyKey] = {
          routeKey: historyKey,
          price: lowestPriceForRoute,
          airline: bestFlight.airline,
          checkedAt: new Date().toISOString(),
        };
      }
    }
  });

  // Save updated history
  savePriceHistory(updatedHistory);

  return { newAlerts, updatedRoutes };
};

// Clean up old price history entries (older than 30 days)
export const cleanupPriceHistory = () => {
  const history = getPriceHistory();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cleanedHistory = Object.entries(history).reduce((acc, [key, entry]) => {
    if (new Date(entry.checkedAt) > thirtyDaysAgo) {
      acc[key] = entry;
    }
    return acc;
  }, {} as Record<string, PriceHistoryEntry>);

  savePriceHistory(cleanedHistory);
};
