// User Preferences Hook with localStorage Persistence
import { useState, useEffect, useCallback } from 'react';
import type { UserPreferences, PointsProgram } from '../types';

const STORAGE_KEY = 'dc-miami-flight-preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  pointsProgram: 'MR',
  pointsBalance: 0,
  preferredAirlines: [],
  cashDealThreshold: { economy: 150, first: 400 },
  pointsThreshold: { economy: 350, first: 900 },
  darkMode: false,
};

export interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  isLoaded: boolean;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  setPointsProgram: (program: PointsProgram) => void;
  setPointsBalance: (balance: number) => void;
  toggleDarkMode: () => void;
  resetPreferences: () => void;
}

// Load initial preferences from localStorage
const loadInitialPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load preferences:', e);
  }
  return DEFAULT_PREFERENCES;
};

export const useUserPreferences = (): UseUserPreferencesReturn => {
  // Use lazy initialization to load from localStorage
  const [preferences, setPreferences] = useState<UserPreferences>(loadInitialPreferences);
  const isLoaded = true; // Always loaded since we use lazy initialization

  // Save to localStorage whenever preferences change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (e) {
        console.error('Failed to save preferences:', e);
      }
    }
  }, [preferences, isLoaded]);

  // Generic preference updater
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  // Convenience setters
  const setPointsProgram = useCallback((program: PointsProgram) => {
    updatePreference('pointsProgram', program);
  }, [updatePreference]);

  const setPointsBalance = useCallback((balance: number) => {
    updatePreference('pointsBalance', Math.max(0, balance));
  }, [updatePreference]);

  const toggleDarkMode = useCallback(() => {
    setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    preferences,
    isLoaded,
    updatePreference,
    setPointsProgram,
    setPointsBalance,
    toggleDarkMode,
    resetPreferences,
  };
};

// Helper hook to apply dark mode to document
export const useDarkMode = (isDark: boolean) => {
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
};
