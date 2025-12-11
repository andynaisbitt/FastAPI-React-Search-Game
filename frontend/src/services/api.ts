/**
 * API Client for JFGI Backend
 * Handles all HTTP requests to FastAPI backend
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:8002'; // Hardcoded for now - env var not loading

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor (for adding auth tokens later)
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = localStorage.getItem('jfgi-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('No response from server'));
    } else {
      // Error setting up request
      return Promise.reject(error);
    }
  }
);

// API Methods
export const api = {
  // Health check
  health: () => apiClient.get('/health'),

  // URL Endpoints
  urls: {
    create: (data: {
      long_url: string;
      difficulty?: string;
      challenge_text?: string;
      hints?: string[];
      time_limit_seconds?: number;
    }) => apiClient.post('/api/v1/urls/', data),

    get: (shortCode: string) => apiClient.get(`/api/v1/urls/${shortCode}`),

    expand: (shortCode: string) => apiClient.get(`/api/v1/urls/${shortCode}/expand`),

    getMyUrls: (limit = 50) => apiClient.get(`/api/v1/urls/my-urls?limit=${limit}`),
  },

  // Game Endpoints
  game: {
    initialize: (shortCode: string) => apiClient.get(`/api/v1/game/${shortCode}/initialize`),
    search: (shortCode: string, query: string) =>
      apiClient.post(`/api/v1/game/${shortCode}/search`, { query }),
    checkAnswer: (shortCode: string, submitted_url: string) =>
      apiClient.post(`/api/v1/game/${shortCode}/check-answer`, { submitted_url }),
    getHint: (shortCode: string, hint_level: number) =>
      apiClient.post(`/api/v1/game/${shortCode}/hint`, { hint_level }),
    end: (shortCode: string, data: {
      outcome: string;
      score: number;
      time_remaining: number;
      submit_to_leaderboard?: boolean;
      nickname?: string;
    }) => apiClient.post(`/api/v1/game/${shortCode}/end`, data),
    getLeaderboard: (shortCode: string) => apiClient.get(`/api/v1/game/${shortCode}/leaderboard`),
  },

  // Leaderboard Endpoints
  leaderboard: {
    get: (shortCode: string) => apiClient.get(`/api/v1/game/${shortCode}/leaderboard`),
    getGlobal: (timeFilter: 'all' | 'week' | 'today' = 'all', limit = 100) =>
      apiClient.get(`/api/v1/game/global/leaderboard?time_filter=${timeFilter}&limit=${limit}`),
  },
};

export default apiClient;
