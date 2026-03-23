// src/stores/apiStore.js
import { create } from 'zustand';
import useAuthStore from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const authHeader = useAuthStore.getState().getAuthHeader();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle unauthorized
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

const useApiStore = create((set) => ({
  // Loading states
  loading: {
    localities: false,
    rates: false,
    pickups: false,
    payments: false,
    analytics: false,
  },

  // Data
  localities: [],
  scrapRates: [],
  pickupRequests: [],
  kabadiwalaPickups: [],
  payments: [],
  analytics: null,
  garbageSchedule: [],

  // Errors
  error: null,

  // Set loading state for specific key
  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  // Set error
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),

  // ============================================
  // LOCALITIES
  // ============================================
  fetchLocalities: async () => {
    set({ loading: { localities: true }, error: null });
    try {
      const data = await apiCall('/localities');
      set({ localities: data.localities, loading: { localities: false } });
      return data.localities;
    } catch (error) {
      set({ error: error.message, loading: { localities: false } });
      throw error;
    }
  },

  fetchLocalityByPincode: async (pincode) => {
    set({ loading: { localities: true }, error: null });
    try {
      const data = await apiCall(`/localities/pincode/${pincode}`);
      set({ loading: { localities: false } });
      return data.localities;
    } catch (error) {
      set({ error: error.message, loading: { localities: false } });
      throw error;
    }
  },

  // ============================================
  // SCRAP RATES
  // ============================================
  fetchScrapRates: async (localityId) => {
    set({ loading: { rates: true }, error: null });
    try {
      const data = await apiCall(`/scrap-rates/${localityId}`);
      set({ scrapRates: data.rates, loading: { rates: false } });
      return data.rates;
    } catch (error) {
      set({ error: error.message, loading: { rates: false } });
      throw error;
    }
  },

  updateScrapRate: async (rateData) => {
    set({ loading: { rates: true }, error: null });
    try {
      const data = await apiCall('/scrap-rates', {
        method: 'POST',
        body: JSON.stringify(rateData),
      });
      set({ loading: { rates: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { rates: false } });
      throw error;
    }
  },

  // ============================================
  // CITIZEN - PICKUP REQUESTS
  // ============================================
  createPickupRequest: async (requestData) => {
    set({ loading: { pickups: true }, error: null });
    try {
      const data = await apiCall('/pickups/request', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      set({ loading: { pickups: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { pickups: false } });
      throw error;
    }
  },

  fetchMyPickupRequests: async () => {
    set({ loading: { pickups: true }, error: null });
    try {
      const data = await apiCall('/pickups/my-requests');
      set({ pickupRequests: data.requests, loading: { pickups: false } });
      return data.requests;
    } catch (error) {
      set({ error: error.message, loading: { pickups: false } });
      throw error;
    }
  },

  // ============================================
  // CITIZEN - PROFILE
  // ============================================
  fetchCitizenProfile: async () => {
    set({ loading: { profile: true }, error: null });
    try {
      const data = await apiCall('/citizen/profile');
      set({ loading: { profile: false } });
      return data.profile;
    } catch (error) {
      set({ error: error.message, loading: { profile: false } });
      throw error;
    }
  },

  updateCitizenProfile: async (profileData) => {
    set({ loading: { profile: true }, error: null });
    try {
      const data = await apiCall('/citizen/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      set({ loading: { profile: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { profile: false } });
      throw error;
    }
  },

  // ============================================
  // KABADIWALA - PICKUPS
  // ============================================
  fetchKabadiwalaPickups: async (date) => {
    set({ loading: { pickups: true }, error: null });
    try {
      const queryString = date ? `?date=${date}` : '';
      const data = await apiCall(`/kabadiwala/pickups${queryString}`);
      set({ kabadiwalaPickups: data.pickups, loading: { pickups: false } });
      return data.pickups;
    } catch (error) {
      set({ error: error.message, loading: { pickups: false } });
      throw error;
    }
  },

  completePickup: async (assignmentId, actualWeight) => {
    set({ loading: { pickups: true }, error: null });
    try {
      const data = await apiCall('/kabadiwala/complete-pickup', {
        method: 'POST',
        body: JSON.stringify({ assignmentId, actualWeight }),
      });
      set({ loading: { pickups: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { pickups: false } });
      throw error;
    }
  },

  fetchKabadiwalaEarnings: async (startDate, endDate) => {
    set({ loading: { earnings: true }, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const data = await apiCall(`/kabadiwala/earnings?${params.toString()}`);
      set({ loading: { earnings: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { earnings: false } });
      throw error;
    }
  },

  // ============================================
  // ADMIN - PICKUP MANAGEMENT
  // ============================================
  fetchPendingPickups: async () => {
    set({ loading: { pickups: true }, error: null });
    try {
      const data = await apiCall('/admin/pickups/pending');
      set({ loading: { pickups: false } });
      return data.requests;
    } catch (error) {
      set({ error: error.message, loading: { pickups: false } });
      throw error;
    }
  },

  fetchKabadiwalas: async (localityId) => {
    set({ loading: { kabadiwalas: true }, error: null });
    try {
      const queryString = localityId ? `?localityId=${localityId}` : '';
      const data = await apiCall(`/admin/kabadiwalas${queryString}`);
      set({ loading: { kabadiwalas: false } });
      return data.kabadiwalas;
    } catch (error) {
      set({ error: error.message, loading: { kabadiwalas: false } });
      throw error;
    }
  },

  assignPickup: async (assignmentData) => {
    set({ loading: { pickups: true }, error: null });
    try {
      const data = await apiCall('/admin/assign-pickup', {
        method: 'POST',
        body: JSON.stringify(assignmentData),
      });
      set({ loading: { pickups: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { pickups: false } });
      throw error;
    }
  },

  // ============================================
  // ADMIN - ANALYTICS
  // ============================================
  fetchAnalytics: async () => {
    set({ loading: { analytics: true }, error: null });
    try {
      const data = await apiCall('/admin/analytics');
      set({ analytics: data, loading: { analytics: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { analytics: false } });
      throw error;
    }
  },

  // ============================================
  // GARBAGE SCHEDULE
  // ============================================
  fetchGarbageSchedule: async (localityId) => {
    set({ loading: { schedule: true }, error: null });
    try {
      const data = await apiCall(`/garbage-schedule/${localityId}`);
      set({ garbageSchedule: data.schedules, loading: { schedule: false } });
      return data.schedules;
    } catch (error) {
      set({ error: error.message, loading: { schedule: false } });
      throw error;
    }
  },

  reportMissedGarbage: async (reportData) => {
    set({ loading: { schedule: true }, error: null });
    try {
      const data = await apiCall('/garbage-schedule/missed', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
      set({ loading: { schedule: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { schedule: false } });
      throw error;
    }
  },

  // ============================================
  // PAYMENTS
  // ============================================
  fetchPaymentHistory: async () => {
    set({ loading: { payments: true }, error: null });
    try {
      const data = await apiCall('/payments/citizen');
      set({ payments: data.payments, loading: { payments: false } });
      return data.payments;
    } catch (error) {
      set({ error: error.message, loading: { payments: false } });
      throw error;
    }
  },

  updatePaymentStatus: async (paymentId, statusData) => {
    set({ loading: { payments: true }, error: null });
    try {
      const data = await apiCall(`/payments/${paymentId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
      });
      set({ loading: { payments: false } });
      return data;
    } catch (error) {
      set({ error: error.message, loading: { payments: false } });
      throw error;
    }
  },
}));

export default useApiStore;