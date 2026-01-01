import React, { useState, useEffect } from 'react';
import { AirportCode, ValueStatus } from './types';
import { origins as allOrigins, destinations as allDestinations } from './utils/flightLogic';
// Points calculator functions used by child components
import { getFlightStats } from './utils/valueAnalyzer';
import { checkPricesAgainstWatched } from './utils/priceChecker';
import { useUserPreferences, useDarkMode } from './hooks/useUserPreferences';
import { useFlightSearch } from './hooks/useFlightSearch';
import { usePriceAlerts } from './hooks/usePriceAlerts';
import FlightTable from './components/FlightTable';
import StatsChart from './components/StatsChart';
import TravelToolkit from './components/TravelToolkit';
import SmartAlerts from './components/SmartAlerts';
import SweetSpotFinder from './components/SweetSpotFinder';
import SettingsPanel from './components/SettingsPanel';
import PriceAlerts from './components/PriceAlerts';
import { Plane, Download, RefreshCw, Filter, Zap, Wallet, Radio, Database } from 'lucide-react';

const App: React.FC = () => {
  const [selectedOrigins, setSelectedOrigins] = useState<AirportCode[]>([...allOrigins]);
  const [selectedDestinations, setSelectedDestinations] = useState<AirportCode[]>([...allDestinations]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Flight search hook (real API with mock fallback + caching)
  const { flights, isLoading, error, dataSource, searchFlights, hasRealApiKey, cacheAge, clearCache } = useFlightSearch();

  // User preferences hook
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();
  useDarkMode(preferences.darkMode);

  // Price alerts hook
  const {
    watchedRoutes,
    alerts,
    unreadAlertCount,
    notificationPermission,
    addWatch,
    removeWatch,
    addAlert,
    dismissAlert,
    clearAllAlerts,
    requestNotificationPermission,
    sendNotification,
    updateRoutePrice,
  } = usePriceAlerts();

  // Get enhanced stats
  const stats = flights.length > 0 ? getFlightStats(flights, preferences.pointsProgram) : null;

  const loadData = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      clearCache();
    }
    await searchFlights(selectedOrigins, selectedDestinations, forceRefresh);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  // Check prices against watched routes whenever flights update
  useEffect(() => {
    if (flights.length === 0 || watchedRoutes.length === 0) return;

    const { newAlerts, updatedRoutes } = checkPricesAgainstWatched(flights, watchedRoutes);

    // Update route prices
    updatedRoutes.forEach(({ routeId, price }) => {
      updateRoutePrice(routeId, price);
    });

    // Add new alerts and send notifications
    newAlerts.forEach((alertData) => {
      addAlert(alertData);

      // Send browser notification
      if (notificationPermission === 'granted') {
        sendNotification(
          `Price Drop Alert!`,
          `${alertData.origin} → ${alertData.destination}: $${alertData.currentPrice} (Save $${alertData.savedAmount})`,
          `https://www.google.com/travel/flights?q=${alertData.origin}%20to%20${alertData.destination}`
        );
      }
    });
  }, [flights, watchedRoutes, updateRoutePrice, addAlert, notificationPermission, sendNotification]);

  const toggleOrigin = (code: AirportCode) => {
    setSelectedOrigins(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleDestination = (code: AirportCode) => {
    setSelectedDestinations(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const exportCSV = () => {
    const headers = ['Date', 'Origin', 'Destination', 'Airline', 'FlightNum', 'Cabin', 'Time', 'Stops', 'Price', 'Status'];
    const rows = flights.map(f => [
      f.date,
      f.origin,
      f.destination,
      f.airline,
      f.flightNumber,
      f.cabin,
      f.departureTime,
      f.stops === 0 ? 'Direct' : `${f.stops} Stop`,
      f.price,
      f.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flight_deals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats for the header cards
  const dealCount = flights.filter(f => f.status === ValueStatus.CASH_DEAL).length;
  // Stats available in the stats object
  const avgPrice = flights.length > 0 
    ? Math.round(flights.reduce((acc, curr) => acc + curr.price, 0) / flights.length) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">DC-Miami Flight Analyzer</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">
                    Amex Value Tracker • {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Ready to scan'}
                  </p>
                  {/* Data Source Indicator */}
                  {dataSource !== 'none' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      dataSource === 'api'
                        ? 'bg-emerald-100 text-emerald-700'
                        : dataSource === 'cache'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {dataSource === 'api' ? (
                        <><Radio className="w-3 h-3" /> Live</>
                      ) : dataSource === 'cache' ? (
                        <><Database className="w-3 h-3" /> Cached {cacheAge && `(${cacheAge})`}</>
                      ) : (
                        <><Database className="w-3 h-3" /> Sample</>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Points Balance Quick View */}
              {preferences.pointsBalance > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                  <Wallet className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {preferences.pointsBalance.toLocaleString()} pts
                  </span>
                </div>
              )}
              <PriceAlerts
                watchedRoutes={watchedRoutes}
                alerts={alerts}
                unreadAlertCount={unreadAlertCount}
                notificationPermission={notificationPermission}
                onAddWatch={addWatch}
                onRemoveWatch={removeWatch}
                onDismissAlert={dismissAlert}
                onClearAlerts={clearAllAlerts}
                onRequestPermission={requestNotificationPermission}
              />
              <SettingsPanel
                preferences={preferences}
                onUpdate={updatePreference}
                onReset={resetPreferences}
              />
              <div className="flex items-center">
                <button
                  onClick={() => loadData(false)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-l-lg border-r border-blue-200 transition-colors disabled:opacity-50"
                  title="Use cached data if available (saves API calls)"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Scan Flights
                </button>
                <button
                  onClick={() => loadData(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-r-lg transition-colors disabled:opacity-50"
                  title="Force refresh - fetch new data from API"
                >
                  <Zap className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={exportCSV}
                disabled={flights.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* API Status Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">{error}</p>
              <p className="text-xs text-amber-600 mt-1">
                {hasRealApiKey
                  ? 'The app will continue with sample data for demonstration.'
                  : 'Add VITE_SERPAPI_KEY to .env.local to enable real flight data from Google Flights.'}
              </p>
            </div>
          </div>
        )}

        {/* Smart Alerts Section - Replaces Generic KPIs as primary focus */}
        <SmartAlerts flights={flights} />

        {/* Filters & KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-2 mb-4">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Route Configuration</h2>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-2">Origins (DC Area)</label>
                   <div className="flex flex-wrap gap-2">
                     {allOrigins.map(code => (
                       <button
                         key={code}
                         onClick={() => toggleOrigin(code)}
                         className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                           selectedOrigins.includes(code)
                             ? 'bg-blue-600 text-white shadow-sm'
                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                         }`}
                       >
                         {code}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-2">Destinations (Miami Area)</label>
                   <div className="flex flex-wrap gap-2">
                     {allDestinations.map(code => (
                       <button
                         key={code}
                         onClick={() => toggleDestination(code)}
                         className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                           selectedDestinations.includes(code)
                             ? 'bg-blue-600 text-white shadow-sm'
                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                         }`}
                       >
                         {code}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-100">
                   <p className="text-xs text-slate-400">
                     Scanning standard travel days (Mon, Wed, Fri) for the next 90 days.
                   </p>
                 </div>
               </div>
             </div>
          </div>

          {/* KPIs */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Zap className="w-16 h-16 text-purple-600" />
               </div>
               <p className="text-sm font-medium text-slate-500">Sweet Spots</p>
               <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.sweetSpotCount || 0}</p>
               <p className="text-xs text-purple-700 mt-1">Best point redemptions</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Plane className="w-16 h-16 text-emerald-600" />
               </div>
               <p className="text-sm font-medium text-slate-500">Cash Deals</p>
               <p className="text-3xl font-bold text-emerald-600 mt-2">{stats?.cashDealCount || dealCount}</p>
               <p className="text-xs text-emerald-700 mt-1">Flights under threshold</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <RefreshCw className="w-16 h-16 text-blue-600" />
               </div>
               <p className="text-sm font-medium text-slate-500">Best CPP</p>
               <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.highestCPP.toFixed(1) || '0'}¢</p>
               <p className="text-xs text-blue-700 mt-1">Highest point value</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Download className="w-16 h-16 text-slate-400" />
               </div>
               <p className="text-sm font-medium text-slate-500">Avg Price</p>
               <p className="text-3xl font-bold text-slate-700 mt-2">${stats?.averagePrice.toFixed(0) || avgPrice}</p>
               <p className="text-xs text-slate-500 mt-1">Across all cabins</p>
            </div>
          </div>
        </div>

        {/* Sweet Spot Finder */}
        {flights.length > 0 && (
          <div className="w-full">
            <SweetSpotFinder
              flights={flights}
              userProgram={preferences.pointsProgram}
              maxItems={5}
            />
          </div>
        )}

        {/* Toolkit Section */}
        <div className="w-full">
           <TravelToolkit />
        </div>

        {/* Charts */}
        <div className="w-full">
           <StatsChart data={flights} />
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Flight Opportunities</h2>
            <span className="text-sm text-slate-500">{flights.length} flights found</span>
          </div>
          <FlightTable
            flights={flights}
            isLoading={isLoading}
            userProgram={preferences.pointsProgram}
            userPointsBalance={preferences.pointsBalance > 0 ? preferences.pointsBalance : undefined}
          />
        </div>

      </main>
    </div>
  );
};

export default App;