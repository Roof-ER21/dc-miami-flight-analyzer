// Sweet Spot Finder Component - Highlights best value redemptions
import React, { useMemo } from 'react';
import { Zap, TrendingUp, Plane, ExternalLink } from 'lucide-react';
import type { FlightOffer, PointsProgram } from '../types';
import { analyzeFlightRedemption } from '../utils/pointsCalculator';
import { getGoogleFlightsUrl } from '../utils/flightLogic';

interface SweetSpotFinderProps {
  flights: FlightOffer[];
  userProgram: PointsProgram;
  maxItems?: number;
}

const SweetSpotFinder: React.FC<SweetSpotFinderProps> = ({
  flights,
  userProgram,
  maxItems = 5,
}) => {
  const sweetSpots = useMemo(() => {
    return flights
      .map((flight) => ({
        flight,
        analysis: analyzeFlightRedemption(flight, userProgram),
      }))
      .filter((item) => item.analysis.bestRedemption?.isSweetSpot)
      .sort(
        (a, b) =>
          (b.analysis.bestRedemption?.cpp || 0) -
          (a.analysis.bestRedemption?.cpp || 0)
      )
      .slice(0, maxItems);
  }, [flights, userProgram, maxItems]);

  // Find excellent values (CPP >= 2.0 but not sweet spots)
  const excellentValues = useMemo(() => {
    return flights
      .map((flight) => ({
        flight,
        analysis: analyzeFlightRedemption(flight, userProgram),
      }))
      .filter(
        (item) =>
          item.analysis.bestRedemption &&
          item.analysis.bestRedemption.cpp >= 2.0 &&
          !item.analysis.bestRedemption.isSweetSpot
      )
      .sort(
        (a, b) =>
          (b.analysis.bestRedemption?.cpp || 0) -
          (a.analysis.bestRedemption?.cpp || 0)
      )
      .slice(0, 3);
  }, [flights, userProgram]);

  if (sweetSpots.length === 0 && excellentValues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Sweet Spots Section */}
      {sweetSpots.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600 fill-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900">Sweet Spot Finder</h3>
              <p className="text-xs text-purple-600">Best points redemption values</p>
            </div>
            <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">
              {sweetSpots.length} found
            </span>
          </div>

          <div className="space-y-3">
            {sweetSpots.map(({ flight, analysis }) => (
              <div
                key={flight.id}
                className="bg-white p-4 rounded-lg border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">
                        {flight.origin} → {flight.destination}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {flight.cabin}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      {new Date(flight.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' • '}
                      {flight.airline} {flight.flightNumber}
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      {analysis.bestRedemption?.sweetSpotDescription}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-700">
                      {analysis.bestRedemption?.cpp.toFixed(2)}¢
                    </div>
                    <div className="text-xs text-slate-500 mb-1">per point</div>
                    <div className="text-sm font-medium text-slate-700">
                      {analysis.bestRedemption?.sourcePoints.toLocaleString()} pts
                    </div>
                    <div className="text-xs text-slate-500">
                      via {analysis.bestRedemption?.partner.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-100">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Cash:</span>
                    <span className="font-medium text-slate-700">${flight.price}</span>
                    {analysis.savingsAmount > 0 && (
                      <span className="text-emerald-600 text-xs">
                        Save ~${analysis.savingsAmount.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <a
                    href={getGoogleFlightsUrl(flight.origin, flight.destination, flight.date, flight.airline, flight.flightNumber, flight.cabin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Book <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excellent Values Section */}
      {excellentValues.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900">Excellent Value Flights</h3>
              <p className="text-xs text-emerald-600">2+ cents per point redemptions</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {excellentValues.map(({ flight, analysis }) => (
              <div
                key={flight.id}
                className="bg-white p-3 rounded-lg border border-emerald-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-sm text-slate-900">
                    {flight.origin} → {flight.destination}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  {new Date(flight.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-emerald-600">
                    {analysis.bestRedemption?.cpp.toFixed(2)}¢
                  </span>
                  <span className="text-xs text-slate-500">
                    {analysis.bestRedemption?.sourcePoints.toLocaleString()} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SweetSpotFinder;
