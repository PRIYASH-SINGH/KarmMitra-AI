import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import { NotificationProvider } from './context/NotificationContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import AppLayout from './layout/AppLayout';
import Overview from './pages/Overview';
import CompetencyIntelligence from './pages/CompetencyIntelligence';
import StateReadiness from './pages/StateReadiness';
import DivisionReadinessPage from './pages/DivisionReadinessPage';
import TrainingThroughput from './pages/TrainingThroughput';
import CompetencyMatrix from './pages/CompetencyMatrix';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <NotificationProvider>
      <FilterProvider>
        <AnalyticsProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Overview />} />
                <Route path="/competency-intelligence" element={<CompetencyIntelligence />} />
                <Route path="/state-readiness" element={<StateReadiness />} />
                <Route path="/division-readiness" element={<DivisionReadinessPage />} />
                <Route path="/training-throughput" element={<TrainingThroughput />} />
                <Route path="/competency-matrix" element={<CompetencyMatrix />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AnalyticsProvider>
      </FilterProvider>
    </NotificationProvider>
  );
}
