import React, { useState, useMemo } from 'react';
import { FlightOffer, ValueStatus, PointsProgram } from '../types';
import { getStatusColor, getGoogleFlightsUrl, getKayakUrl, getSkyscannerUrl, getAirlineDirectUrl, getPointsSearchUrl } from '../utils/flightLogic';
import { analyzeFlightRedemption } from '../utils/pointsCalculator';
// Value analyzer utilities available for enhanced display
import { AlertCircle, CheckCircle, ArrowRight, ArrowUp, ArrowDown, ArrowUpDown, Filter, Banknote, Coins, ExternalLink, Gift, MapPin, Armchair, Zap, ChevronDown, Plane } from 'lucide-react';

interface FlightTableProps {
  flights: FlightOffer[];
  isLoading: boolean;
  userProgram?: PointsProgram;
  userPointsBalance?: number;
}

type SortKey = 'date' | 'price' | 'cpp';
type SortDirection = 'asc' | 'desc';
type CabinFilter = 'All' | 'Economy' | 'First';

const SortIcon = ({ column, sortKey, sortDirection }: { column: SortKey, sortKey: SortKey, sortDirection: SortDirection }) => {
  if (sortKey !== column) return <ArrowUpDown className="w-4 h-4 ml-1 text-slate-300 opacity-0 group-hover:opacity-50 transition-opacity" />;
  return sortDirection === 'asc' 
    ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
    : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />;
};

const FlightTable: React.FC<FlightTableProps> = ({ flights, isLoading, userProgram = 'MR', userPointsBalance }) => {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const [cabinFilter, setCabinFilter] = useState<CabinFilter>('All');

  // Extract unique airlines from the dataset for the filter list
  const availableAirlines = useMemo(() => {
    const airlines = new Set(flights.map(f => f.airline));
    return Array.from(airlines).sort();
  }, [flights]);

  // Extract unique airports from the dataset for the bottom filter list
  const availableAirports = useMemo(() => {
    const airports = new Set<string>();
    flights.forEach(f => {
      airports.add(f.origin);
      airports.add(f.destination);
    });
    return Array.from(airports).sort();
  }, [flights]);

  const toggleAirline = (airline: string) => {
    setSelectedAirlines(prev => 
      prev.includes(airline)
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    );
  };

  const toggleAirport = (airport: string) => {
    setSelectedAirports(prev => 
      prev.includes(airport)
        ? prev.filter(a => a !== airport)
        : [...prev, airport]
    );
  };

  const clearFilters = () => {
    setSelectedAirlines([]);
    setCabinFilter('All');
  };
  const clearAirportFilters = () => setSelectedAirports([]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedFlights = useMemo(() => {
    let result = [...flights];

    // 1. Filter by Airline
    if (selectedAirlines.length > 0) {
      result = result.filter(f => selectedAirlines.includes(f.airline));
    }

    // 2. Filter by Airport
    if (selectedAirports.length > 0) {
      result = result.filter(f => 
        selectedAirports.includes(f.origin) || selectedAirports.includes(f.destination)
      );
    }

    // 3. Filter by Cabin
    if (cabinFilter !== 'All') {
      result = result.filter(f => f.cabin === cabinFilter);
    }

    // 4. Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'date') {
        // Primary sort by date
        comparison = a.date.localeCompare(b.date);
        // Secondary sort by price when dates are same
        if (comparison === 0) {
          comparison = a.price - b.price;
        }
      } else if (sortKey === 'price') {
        comparison = a.price - b.price;
      } else if (sortKey === 'cpp') {
        const aAnalysis = analyzeFlightRedemption(a, userProgram, userPointsBalance);
        const bAnalysis = analyzeFlightRedemption(b, userProgram, userPointsBalance);
        comparison = (aAnalysis.bestRedemption?.cpp || 0) - (bAnalysis.bestRedemption?.cpp || 0);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [flights, sortKey, sortDirection, selectedAirlines, selectedAirports, cabinFilter, userProgram, userPointsBalance]);

  const getFlightAnalysis = (flight: FlightOffer) => {
    return analyzeFlightRedemption(flight, userProgram, userPointsBalance);
  };

  const getAnalysisLabel = (flight: FlightOffer) => {
    const analysis = getFlightAnalysis(flight);
    if (analysis.bestOption === 'CASH' && flight.price < 150) return 'CASH DEAL';
    if (analysis.bestOption === 'POINTS' && analysis.bestRedemption?.isSweetSpot) return 'SWEET SPOT';
    if (analysis.bestRedemption?.recommendation === 'EXCELLENT') return 'EXCELLENT';
    if (analysis.bestRedemption?.recommendation === 'GOOD') return 'GOOD VALUE';
    if (analysis.bestOption === 'POINTS') return 'USE POINTS';
    return flight.status;
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">Scanning Amadeus Data...</p>
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">No flights found for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Top Filter Toolbar (Airline & Cabin) */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center gap-6">
        
        {/* Airline Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 min-w-fit">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Airlines:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAirlines([])}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                selectedAirlines.length === 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {availableAirlines.map(airline => (
              <button
                key={airline}
                onClick={() => toggleAirline(airline)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                  selectedAirlines.includes(airline)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {airline}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden xl:block w-px h-8 bg-slate-200"></div>

        {/* Cabin Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 min-w-fit">
            <Armchair className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Cabin:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Economy', 'First'] as CabinFilter[]).map((cabin) => (
              <button
                key={cabin}
                onClick={() => setCabinFilter(cabin)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                  cabinFilter === cabin
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cabin}
              </button>
            ))}
          </div>
        </div>

        {/* Clear All Button */}
        {(selectedAirlines.length > 0 || cabinFilter !== 'All') && (
           <button 
             onClick={clearFilters}
             className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline whitespace-nowrap"
           >
             Reset Top Filters
           </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  <SortIcon column="date" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Route</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Airline / Flight</th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">
                  Price (USD)
                  <SortIcon column="price" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cash Ref</th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('cpp')}
              >
                <div className="flex items-center">
                  CPP
                  <SortIcon column="cpp" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Analysis</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredAndSortedFlights.length > 0 ? (
              filteredAndSortedFlights.map((flight) => {
                const analysis = getFlightAnalysis(flight);
                const analysisLabel = getAnalysisLabel(flight);
                const cpp = analysis.bestRedemption?.cpp || 0;
                const partnerName = analysis.bestRedemption?.partner.name || 'N/A';
                const sourcePoints = analysis.bestRedemption?.sourcePoints || 0;
                const isSweetSpot = analysis.bestRedemption?.isSweetSpot || false;
                // Updated to include airline, flightNumber, and cabin for better specificity
                const googleFlightsUrl = getGoogleFlightsUrl(
                  flight.origin, 
                  flight.destination, 
                  flight.date,
                  flight.airline,
                  flight.flightNumber,
                  flight.cabin
                );
                const pointsSearchUrl = getPointsSearchUrl(flight.origin, flight.destination, flight.date);
                
                // Determine row styling based on value status
                let rowClass = "transition-colors border-l-4 ";
                let priceClass = "text-slate-900";

                if (isSweetSpot) {
                  rowClass += "border-purple-500 bg-purple-50/40 hover:bg-purple-50/80";
                  priceClass = "text-purple-700";
                } else if (analysisLabel === 'CASH DEAL' || analysisLabel === ValueStatus.CASH_DEAL || analysisLabel === 'GOOD VALUE') {
                  rowClass += "border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80";
                  priceClass = "text-emerald-700";
                } else if (analysisLabel === 'EXCELLENT' || analysisLabel === 'USE POINTS') {
                  rowClass += "border-blue-500 bg-blue-50/40 hover:bg-blue-50/80";
                  priceClass = "text-blue-700";
                } else if (analysisLabel === ValueStatus.CHECK_POINTS || analysisLabel === 'POOR VALUE') {
                  rowClass += "border-amber-500 bg-amber-50/40 hover:bg-amber-50/80";
                  priceClass = "text-amber-700";
                } else {
                  rowClass += "border-transparent hover:bg-slate-50";
                }
                
                return (
                  <tr key={flight.id} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {flight.date} <span className="text-slate-400 ml-1 font-normal">({new Date(flight.date).toLocaleDateString('en-US', { weekday: 'short' })})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{flight.origin}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-bold">{flight.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{flight.airline}</span>
                          {flight.cabin === 'First' && (
                             <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                               First
                             </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">#{flight.flightNumber} • {flight.departureTime}</span>
                          {flight.stops === 0 ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                              Non-stop
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-100">
                              {flight.stops} stop
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${priceClass}`}>
                      <div className="flex items-center gap-1.5">
                        ${flight.price}
                        {(analysisLabel === ValueStatus.CASH_DEAL || analysisLabel === 'GOOD VALUE') && (
                          <Banknote className="w-4 h-4 text-emerald-600" />
                        )}
                        {(analysisLabel === ValueStatus.CHECK_POINTS || analysisLabel === 'POOR VALUE') && (
                          <Coins className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {(analysisLabel === ValueStatus.CHECK_POINTS || analysisLabel === 'POOR VALUE') ? (
                        <a 
                          href={googleFlightsUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1 text-amber-700 font-bold hover:underline"
                          title="View on Google Flights"
                        >
                          ${flight.price}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className={`font-bold ${cpp >= 2.0 ? 'text-emerald-600' : cpp >= 1.5 ? 'text-blue-600' : 'text-slate-600'}`}>
                            {cpp.toFixed(2)}¢
                          </span>
                          {isSweetSpot && <Zap className="w-3 h-3 text-purple-500 fill-purple-500" />}
                        </div>
                        <span className="text-xs text-slate-400" title={`${sourcePoints.toLocaleString()} ${userProgram} points via ${partnerName}`}>
                          {sourcePoints.toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={partnerName}>
                          via {partnerName.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        isSweetSpot ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        analysisLabel === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        analysisLabel === 'USE POINTS' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        getStatusColor(analysisLabel)
                      }`}>
                        {isSweetSpot && <Zap className="w-3 h-3 mr-1 fill-current" />}
                        {!isSweetSpot && (analysisLabel === 'CASH DEAL' || analysisLabel === ValueStatus.CASH_DEAL || analysisLabel === 'GOOD VALUE') && <CheckCircle className="w-3 h-3 mr-1" />}
                        {!isSweetSpot && (analysisLabel === ValueStatus.CHECK_POINTS || analysisLabel === 'POOR VALUE') && <AlertCircle className="w-3 h-3 mr-1" />}
                        {isSweetSpot ? 'SWEET SPOT' : analysisLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        {/* Primary Book Button - Airline Direct */}
                        <a
                          href={getAirlineDirectUrl(flight.origin, flight.destination, flight.date, flight.airline, flight.cabin)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-500 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          title={`Book ${flight.cabin} on ${flight.airline} - ${flight.date}`}
                        >
                          <Plane className="w-3 h-3" />
                          Book
                        </a>

                        {/* Booking Options Dropdown */}
                        <div className="relative group">
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                            title="More booking options"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              <a
                                href={getKayakUrl(flight.origin, flight.destination, flight.date, flight.cabin)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Kayak
                              </a>
                              <a
                                href={getSkyscannerUrl(flight.origin, flight.destination, flight.date, flight.cabin)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Skyscanner
                              </a>
                              <a
                                href={googleFlightsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Google Flights
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Awards Button */}
                        <a
                          href={pointsSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-purple-200 rounded-md text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                          title="Search Award Availability"
                        >
                          Awards
                          <Gift className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8 text-slate-300" />
                    <p>No flights found for the selected airlines, airports, or cabin class.</p>
                    <button 
                      onClick={() => { clearFilters(); clearAirportFilters(); }}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Airport Filter Toolbar (Bottom) */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500">
          <MapPin className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filter Airports:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearAirportFilters}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
              selectedAirports.length === 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {availableAirports.map(code => (
            <button
              key={code}
              onClick={() => toggleAirport(code)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                selectedAirports.includes(code)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {code}
            </button>
          ))}
          {selectedAirports.length > 0 && (
             <button 
               onClick={clearAirportFilters}
               className="ml-2 text-xs text-slate-400 hover:text-slate-600 underline"
             >
               Clear
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightTable;