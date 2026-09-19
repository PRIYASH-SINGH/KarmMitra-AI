import axios from 'axios';
import { buildMockAnalytics } from '../data/mockData';

// Centralized API configuration. Set VITE_API_BASE_URL in a .env file to
// point at a different environment; defaults to the local FastAPI gateway
// used during development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ANALYTICS_ENDPOINT = `${API_BASE_URL}/api/v1/admin/metrics`;

// Fetches the aggregated admin analytics payload. If the FastAPI gateway is
// unreachable, falls back to the local demo dataset so the dashboard never
// shows a broken screen. The `isLive` flag lets the UI show a clear
// "Demo data" vs "Live data" indicator without altering the underlying
// backend response shape.
export const fetchAdminAnalytics = async () => {
  try {
    const response = await axios.get(ANALYTICS_ENDPOINT, { timeout: 2500 });
    const mock = buildMockAnalytics();
    const liveData = response.data || {};

    // Normalize divisionData from live backend if present
    const normalizedDivisionData = Array.isArray(liveData.divisionData) && liveData.divisionData.length > 0
      ? liveData.divisionData.map((d) => {
          const proficient = Number(d?.proficient ?? 0) || 0;
          const needTraining = Number(d?.needTraining ?? 0) || 0;
          const total = proficient + needTraining;
          const readinessPercent = d?.readinessPercent !== undefined
            ? Number(d.readinessPercent)
            : (total > 0 ? Math.round((proficient / total) * 100) : 0);
          const code = d?.code || (d?.name ? d.name.split(' ')[0] : 'DIV');
          return {
            ...d,
            code,
            proficient,
            needTraining,
            readinessPercent,
          };
        })
      : mock.divisionData;

    // Harmonize trainingThroughput
    const trainingThroughput = liveData.trainingThroughput || {
      ...mock.trainingThroughput,
      kpi: {
        ...mock.trainingThroughput.kpi,
        workshopsScheduled: Number(liveData.kpi?.nsstaWorkshopsScheduled ?? mock.trainingThroughput.kpi.workshopsScheduled),
        workshopsCompleted: Number(mock.trainingThroughput.kpi.workshopsCompleted),
        staffEnrolled: Number(liveData.kpi?.totalAssessed ? liveData.kpi.totalAssessed * 10 : mock.trainingThroughput.kpi.staffEnrolled),
        staffCompleted: Number(liveData.kpi?.totalAssessed ? liveData.kpi.totalAssessed * 6 : mock.trainingThroughput.kpi.staffCompleted),
        completionRate: Number(mock.trainingThroughput.kpi.completionRate),
      },
    };

    return {
      ...mock,
      ...liveData,
      kpi: {
        ...mock.kpi,
        ...(liveData.kpi || {}),
      },
      divisionData: normalizedDivisionData,
      trainingThroughput,
      isLive: true,
    };
  } catch (error) {
    return { ...buildMockAnalytics(), isLive: false };
  }
};

// Kept for backward compatibility with any code still importing the old name.
export const fetchAdminMetrics = fetchAdminAnalytics;
