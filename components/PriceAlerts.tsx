// Price Alerts Panel - Manage watched routes and view price drop alerts
import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  X,
  TrendingDown,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { AirportCode } from '../types';
import type { WatchedRoute, PriceAlert } from '../hooks/usePriceAlerts';
import { origins, destinations } from '../utils/flightLogic';

interface PriceAlertsProps {
  watchedRoutes: WatchedRoute[];
  alerts: PriceAlert[];
  unreadAlertCount: number;
  notificationPermission: NotificationPermission | 'unsupported';
  onAddWatch: (route: Omit<WatchedRoute, 'id' | 'createdAt' | 'lastChecked' | 'lastPrice' | 'lowestPrice' | 'notified'>) => void;
  onRemoveWatch: (id: string) => void;
  onDismissAlert: (id: string) => void;
  onClearAlerts: () => void;
  onRequestPermission: () => Promise<boolean>;
}

const PriceAlerts: React.FC<PriceAlertsProps> = ({
  watchedRoutes,
  alerts,
  unreadAlertCount,
  notificationPermission,
  onAddWatch,
  onRemoveWatch,
  onDismissAlert,
  onClearAlerts,
  onRequestPermission,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'watching'>('alerts');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newOrigin, setNewOrigin] = useState<AirportCode>(origins[0]);
  const [newDest, setNewDest] = useState<AirportCode>(destinations[0]);
  const [newDateFrom, setNewDateFrom] = useState('');
  const [newDateTo, setNewDateTo] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState(200);

  const handleAddWatch = () => {
    if (!newDateFrom || !newDateTo) return;

    onAddWatch({
      origin: newOrigin,
      destination: newDest,
      dateFrom: newDateFrom,
      dateTo: newDateTo,
      targetPrice: newTargetPrice,
    });

    // Reset form
    setShowAddForm(false);
    setNewDateFrom('');
    setNewDateTo('');
    setNewTargetPrice(200);
  };

  const handleEnableNotifications = async () => {
    await onRequestPermission();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
      >
        {unreadAlertCount > 0 ? (
          <BellRing className="w-4 h-4 text-amber-500" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Alerts</span>
        {unreadAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel Content */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Price Alerts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Permission Banner */}
            {notificationPermission === 'default' && (
              <div className="p-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      Enable notifications to get alerts when prices drop
                    </p>
                    <button
                      onClick={handleEnableNotifications}
                      className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900"
                    >
                      Enable Notifications →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {notificationPermission === 'denied' && (
              <div className="p-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Notifications blocked. Enable in browser settings to receive alerts.
                  </p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'alerts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Alerts {unreadAlertCount > 0 && `(${unreadAlertCount})`}
              </button>
              <button
                onClick={() => setActiveTab('watching')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'watching'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Watching ({watchedRoutes.length})
              </button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {activeTab === 'alerts' ? (
                <div className="p-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingDown className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No price alerts yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Watch routes to get notified when prices drop
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alerts.filter(a => !a.dismissed).length > 0 && (
                        <button
                          onClick={onClearAlerts}
                          className="text-xs text-slate-500 hover:text-slate-700 mb-2"
                        >
                          Clear all
                        </button>
                      )}
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border transition-all ${
                            alert.dismissed
                              ? 'bg-slate-50 border-slate-100 opacity-60'
                              : 'bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-slate-900">
                                  {alert.origin} → {alert.destination}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">
                                {alert.airline} • {formatDate(alert.date)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-slate-400 line-through text-sm">
                                  ${alert.previousPrice}
                                </span>
                                <span className="text-emerald-600 font-bold">
                                  ${alert.currentPrice}
                                </span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                  Save ${alert.savedAmount}
                                </span>
                              </div>
                            </div>
                            {!alert.dismissed && (
                              <button
                                onClick={() => onDismissAlert(alert.id)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatDateTime(alert.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3">
                  {/* Add Watch Button */}
                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors mb-3"
                    >
                      <Plus className="w-4 h-4" />
                      Watch a Route
                    </button>
                  )}

                  {/* Add Watch Form */}
                  {showAddForm && (
                    <div className="p-3 bg-slate-50 rounded-lg mb-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">From</label>
                          <select
                            value={newOrigin}
                            onChange={(e) => setNewOrigin(e.target.value as AirportCode)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                          >
                            {origins.map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">To</label>
                          <select
                            value={newDest}
                            onChange={(e) => setNewDest(e.target.value as AirportCode)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                          >
                            {destinations.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Date From</label>
                          <input
                            type="date"
                            value={newDateFrom}
                            min={minDate}
                            onChange={(e) => setNewDateFrom(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Date To</label>
                          <input
                            type="date"
                            value={newDateTo}
                            min={newDateFrom || minDate}
                            onChange={(e) => setNewDateTo(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Alert when price drops below ${newTargetPrice}
                        </label>
                        <input
                          type="range"
                          min={50}
                          max={500}
                          step={10}
                          value={newTargetPrice}
                          onChange={(e) => setNewTargetPrice(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>$50</span>
                          <span className="font-medium text-blue-600">${newTargetPrice}</span>
                          <span>$500</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddWatch}
                          disabled={!newDateFrom || !newDateTo}
                          className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          Watch Route
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Watched Routes List */}
                  {watchedRoutes.length === 0 && !showAddForm ? (
                    <div className="text-center py-8">
                      <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No routes being watched</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Add a route to track price changes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {watchedRoutes.map((route) => (
                        <div
                          key={route.id}
                          className="p-3 bg-white rounded-lg border border-slate-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-slate-900">
                                  {route.origin} → {route.destination}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDate(route.dateFrom)} - {formatDate(route.dateTo)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Alert below: <span className="font-medium">${route.targetPrice}</span>
                              </p>
                              {route.lowestPrice && (
                                <p className="text-xs text-emerald-600 mt-1">
                                  Lowest seen: ${route.lowestPrice}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => onRemoveWatch(route.id)}
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PriceAlerts;
