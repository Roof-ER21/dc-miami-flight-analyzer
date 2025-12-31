import React, { useMemo, useState } from 'react';
import { FlightOffer, AirportCode } from '../types';
import { Sparkles, Trophy, Armchair, Plane, ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import { getGoogleFlightsUrl } from '../utils/flightLogic';

interface SmartAlertsProps {
  flights: FlightOffer[];
}

type TimeFilter = 'All' | 'Month' | 'Week';

interface AlertCardProps {
  title: string;
  flight?: FlightOffer;
  icon: React.ReactNode;
  colorClass: string;
  badgeText: string;
  timeFilter: TimeFilter;
}

const AlertCard = ({ 
  title, 
  flight, 
  icon, 
  colorClass,
  badgeText,
  timeFilter
}: AlertCardProps) => {
  if (!flight) return (
      <div className={`h-full min-h-[140px] p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center gap-2`}>
          <div className="p-2 rounded-full bg-slate-200 text-slate-400">
              <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 font-medium">No {badgeText.toLowerCase()} found <br/> in the next {timeFilter === 'Week' ? '7 days' : timeFilter === 'Month' ? '30 days' : '90 days'}</p>
      </div>
  );
  
  const url = getGoogleFlightsUrl(
    flight.origin, 
    flight.destination, 
    flight.date, 
    flight.airline, 
    flight.flightNumber, 
    flight.cabin
  );

  return (
    <div className={`relative p-4 rounded-xl border ${colorClass} bg-white shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${colorClass.replace('border-', 'bg-').replace('-200', '-50')} text-slate-700`}>
                  {icon}
              </div>
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
                  <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900 text-lg">${flight.price}</span>
                      <span className={`text-[10px] px-1.5 rounded-full font-medium ${colorClass.replace('border-', 'bg-').replace('-200', '-100')}`}>
                           {badgeText}
                      </span>
                  </div>
              </div>
          </div>
      </div>
      
      <div className="space-y-1 mb-3">
          <div className="flex items-center text-sm text-slate-700 font-medium">
              {flight.origin} <ArrowRight className="w-3 h-3 mx-1" /> {flight.destination}
          </div>
          <div className="text-xs text-slate-500">
              {new Date(flight.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {flight.airline}
          </div>
      </div>

      <a 
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        View Deal <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

const SmartAlerts: React.FC<SmartAlertsProps> = ({ flights }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');

  const filteredFlights = useMemo(() => {
    if (timeFilter === 'All') return flights;

    const today = new Date();
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);

    return flights.filter(f => {
        // Parse the YYYY-MM-DD string as UTC midnight to avoid timezone shifting issues on simple dates
        const flightDate = new Date(f.date + 'T00:00:00');
        const diffTime = flightDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeFilter === 'Week') return diffDays <= 7;
        if (timeFilter === 'Month') return diffDays <= 30;
        return true;
    });
  }, [flights, timeFilter]);

  const alerts = useMemo(() => {
    if (filteredFlights.length === 0) return null;

    // 1. Absolute Best Economy Deal to MIA
    const ecoMIA = filteredFlights
      .filter(f => f.destination === AirportCode.MIA && f.cabin === 'Economy')
      .sort((a, b) => a.price - b.price)[0];

    // 2. Absolute Best Economy Deal to FLL
    const ecoFLL = filteredFlights
      .filter(f => f.destination === AirportCode.FLL && f.cabin === 'Economy')
      .sort((a, b) => a.price - b.price)[0];

    // 3. Best First Class Deal (Any destination)
    const bestFirst = filteredFlights
      .filter(f => f.cabin === 'First')
      .sort((a, b) => a.price - b.price)[0];

    // 4. "Points Opportunity" - Highest price flight (best value for flat-rate points)
    const pointsOpp = filteredFlights
        .sort((a, b) => b.price - a.price)[0];

    return { ecoMIA, ecoFLL, bestFirst, pointsOpp };
  }, [filteredFlights]);

  if (flights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Top Automated Alerts</h2>
        </div>
        
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <button
                onClick={() => setTimeFilter('Week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeFilter === 'Week' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                Next 7 Days
            </button>
            <button
                onClick={() => setTimeFilter('Month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeFilter === 'Month' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                Next 30 Days
            </button>
            <button
                onClick={() => setTimeFilter('All')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeFilter === 'All' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                All Upcoming
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AlertCard 
            title="Best Economy (MIA)" 
            flight={alerts?.ecoMIA} 
            icon={<Plane className="w-5 h-5" />}
            colorClass="border-emerald-200"
            badgeText="Low Fare"
            timeFilter={timeFilter}
        />
        <AlertCard 
            title="Best Economy (FLL)" 
            flight={alerts?.ecoFLL} 
            icon={<Plane className="w-5 h-5" />}
            colorClass="border-emerald-200"
            badgeText="Low Fare"
            timeFilter={timeFilter}
        />
        <AlertCard 
            title="Premium Pick" 
            flight={alerts?.bestFirst} 
            icon={<Armchair className="w-5 h-5" />}
            colorClass="border-purple-200"
            badgeText="First Class"
            timeFilter={timeFilter}
        />
        <AlertCard 
            title="Max Point Value" 
            flight={alerts?.pointsOpp} 
            icon={<Trophy className="w-5 h-5" />}
            colorClass="border-amber-200"
            badgeText="Use Points"
            timeFilter={timeFilter}
        />
      </div>
    </div>
  );
};

export default SmartAlerts;