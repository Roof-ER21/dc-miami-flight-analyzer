// Settings Panel Component - User preferences modal
import React, { useState } from 'react';
import { Settings, X, CreditCard, Wallet, Sun, Moon, RotateCcw } from 'lucide-react';
import type { UserPreferences, PointsProgram } from '../types';

interface SettingsPanelProps {
  preferences: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  onReset: () => void;
}

const PROGRAM_OPTIONS: { value: PointsProgram; label: string; color: string }[] = [
  { value: 'MR', label: 'Amex Membership Rewards', color: 'bg-blue-600' },
  { value: 'UR', label: 'Chase Ultimate Rewards', color: 'bg-blue-800' },
  { value: 'TYP', label: 'Citi ThankYou Points', color: 'bg-blue-700' },
  { value: 'C1', label: 'Capital One Miles', color: 'bg-red-600' },
  { value: 'BILT', label: 'Bilt Rewards', color: 'bg-gray-800' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  preferences,
  onUpdate,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        title="Settings"
      >
        <Settings className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700 hidden sm:inline">Settings</span>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Points Program */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                  <CreditCard className="w-4 h-4" />
                  Points Program
                </label>
                <div className="space-y-2">
                  {PROGRAM_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onUpdate('pointsProgram', option.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        preferences.pointsProgram === option.value
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${option.color}`} />
                      <span className="text-sm font-medium text-slate-700">{option.label}</span>
                      {preferences.pointsProgram === option.value && (
                        <span className="ml-auto text-xs text-blue-600 font-medium">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points Balance */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Wallet className="w-4 h-4" />
                  Your Points Balance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={preferences.pointsBalance || ''}
                    onChange={(e) => onUpdate('pointsBalance', parseInt(e.target.value) || 0)}
                    placeholder="Enter your points balance"
                    className="w-full p-3 pr-16 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  We'll show which redemptions you can afford
                </p>
              </div>

              {/* Cash Deal Thresholds */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Cash Deal Thresholds
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Economy</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={preferences.cashDealThreshold.economy}
                        onChange={(e) => onUpdate('cashDealThreshold', {
                          ...preferences.cashDealThreshold,
                          economy: parseInt(e.target.value) || 150,
                        })}
                        className="w-full p-2 pl-7 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">First Class</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={preferences.cashDealThreshold.first}
                        onChange={(e) => onUpdate('cashDealThreshold', {
                          ...preferences.cashDealThreshold,
                          first: parseInt(e.target.value) || 400,
                        })}
                        className="w-full p-2 pl-7 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Flights below these prices are marked as "Cash Deals"
                </p>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {preferences.darkMode ? (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-sm font-medium text-slate-700">Dark Mode</span>
                </div>
                <button
                  onClick={() => onUpdate('darkMode', !preferences.darkMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.darkMode ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      preferences.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;
