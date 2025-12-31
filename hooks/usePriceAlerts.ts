// Price Alerts Hook - Track routes and notify on price drops
import { useState, useEffect, useCallback } from 'react';
import type { AirportCode } from '../types';

export interface WatchedRoute {
  id: string;
  origin: AirportCode;
  destination: AirportCode;
  dateFrom: string;
  dateTo: string;
  targetPrice: number;
  createdAt: string;
  lastChecked: string | null;
  lastPrice: number | null;
  lowestPrice: number | null;
  notified: boolean;
}

export interface PriceAlert {
  id: string;
  routeId: string;
  origin: AirportCode;
  destination: AirportCode;
  date: string;
  previousPrice: number;
  currentPrice: number;
  savedAmount: number;
  airline: string;
  createdAt: string;
  dismissed: boolean;
}

interface UsePriceAlertsResult {
  watchedRoutes: WatchedRoute[];
  alerts: PriceAlert[];
  unreadAlertCount: number;
  notificationPermission: NotificationPermission | 'unsupported';
  addWatch: (route: Omit<WatchedRoute, 'id' | 'createdAt' | 'lastChecked' | 'lastPrice' | 'lowestPrice' | 'notified'>) => void;
  removeWatch: (id: string) => void;
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string, url?: string) => void;
  updateRoutePrice: (routeId: string, price: number) => void;
}

const WATCHED_ROUTES_KEY = 'dc-miami-watched-routes';
const PRICE_ALERTS_KEY = 'dc-miami-price-alerts';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const usePriceAlerts = (): UsePriceAlertsResult => {
  const [watchedRoutes, setWatchedRoutes] = useState<WatchedRoute[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHED_ROUTES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem(PRICE_ALERTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  // Persist watched routes
  useEffect(() => {
    localStorage.setItem(WATCHED_ROUTES_KEY, JSON.stringify(watchedRoutes));
  }, [watchedRoutes]);

  // Persist alerts
  useEffect(() => {
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const unreadAlertCount = alerts.filter(a => !a.dismissed).length;

  const addWatch = useCallback((route: Omit<WatchedRoute, 'id' | 'createdAt' | 'lastChecked' | 'lastPrice' | 'lowestPrice' | 'notified'>) => {
    const newRoute: WatchedRoute = {
      ...route,
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastChecked: null,
      lastPrice: null,
      lowestPrice: null,
      notified: false,
    };
    setWatchedRoutes(prev => [...prev, newRoute]);
  }, []);

  const removeWatch = useCallback((id: string) => {
    setWatchedRoutes(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRoutePrice = useCallback((routeId: string, price: number) => {
    setWatchedRoutes(prev => prev.map(route => {
      if (route.id !== routeId) return route;

      const lowestPrice = route.lowestPrice === null
        ? price
        : Math.min(route.lowestPrice, price);

      return {
        ...route,
        lastChecked: new Date().toISOString(),
        lastPrice: price,
        lowestPrice,
      };
    }));
  }, []);

  const addAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'createdAt' | 'dismissed'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: generateId(),
      createdAt: new Date().toISOString(),
      dismissed: false,
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, dismissed: true } : a
    ));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendNotification = useCallback((title: string, body: string, url?: string) => {
    if (notificationPermission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/plane-icon.png', // We can add this later
      badge: '/plane-icon.png',
      tag: 'price-alert',
      requireInteraction: true,
    });

    if (url) {
      notification.onclick = () => {
        window.focus();
        window.open(url, '_blank');
        notification.close();
      };
    }
  }, [notificationPermission]);

  return {
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
  };
};
