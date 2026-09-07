import axios from 'axios';
import { buildMockAnalytics } from '../data/mockData';

// Centralized API configuration. Set VITE_API_BASE_URL in a .env file to
// point at a different environment; defaults to the local FastAPI gateway
// used during development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ANALYTICS_ENDPOINT = `${API_BASE_URL}/api/v1/admin/analytics`;

// Fetches the aggregated admin analytics payload. If the FastAPI gateway is
// unreachable, falls back to the local demo dataset so the dashboard never
// shows a broken screen. The `isLive` flag lets the UI show a clear
// "Demo data" vs "Live data" indicator without altering the underlying
// backend response shape.
export const fetchAdminAnalytics = async () => {
  try {
    const response = await axios.get(ANALYTICS_ENDPOINT, { timeout: 2500 });
    return { ...response.data, isLive: true };
  } catch (error) {
    return { ...buildMockAnalytics(), isLive: false };
  }
};

// Kept for backward compatibility with any code still importing the old name.
export const fetchAdminMetrics = fetchAdminAnalytics;
