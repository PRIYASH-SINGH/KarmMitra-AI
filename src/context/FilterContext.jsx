import React, { createContext, useContext, useMemo, useState } from 'react';

const FilterContext = createContext(null);

const DEFAULT_FILTERS = {
  state: 'All',
  division: 'All',
  competency: 'All',
  cycle: '2026 Q1 Cycle',
  status: 'All',
  search: '',
};

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const value = useMemo(() => ({ filters, setFilter, resetFilters }), [filters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}

// Shared helpers so every page filters state/division/status data the same way.
export function applyStateFilters(rows, filters) {
  return rows.filter((row) => {
    if (filters.state !== 'All' && row.state !== filters.state) return false;
    if (filters.status !== 'All' && row.status !== filters.status) return false;
    if (filters.search && !row.state.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

export function applyDivisionFilters(rows, filters) {
  return rows.filter((row) => {
    if (filters.division !== 'All' && row.code !== filters.division) return false;
    return true;
  });
}

export function applyCompetencyFilters(rows, filters) {
  return rows.filter((row) => {
    if (filters.competency !== 'All' && row.subject !== filters.competency) return false;
    return true;
  });
}
