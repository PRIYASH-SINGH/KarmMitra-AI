import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAdminAnalytics } from '../api/adminClient';

const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminAnalytics();
    setAnalytics(data);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AnalyticsContext.Provider value={{ analytics, loading, lastUpdated, refresh: load }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within an AnalyticsProvider');
  return ctx;
}
