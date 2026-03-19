import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 for specific authentication-critical endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isCurrentUserProfile = error.config?.url === '/users/profile' && error.config?.method === 'get';
    const isTokenValidation = error.config?.url === '/auth/validate';
    const isFrozenAccountError = error.response?.status === 403 &&
      (error.response?.data?.error === 'ACCOUNT_FROZEN' || error.response?.data?.errorCode === 'ACCOUNT_FROZEN');

    if (error.response?.status === 401 && (isAuthEndpoint || isCurrentUserProfile || isTokenValidation)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (isFrozenAccountError) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login?frozen=1';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  verifySMS: (verificationData) => api.post('/auth/verify-sms', verificationData),
  login: (phoneNumber) => api.post('/auth/login', { phoneNumber }),
  verifyLogin: (verificationData) => api.post('/auth/verify-login', verificationData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const userAPI = {
  getAllUsers: () => api.get('/users/all'),
  getNearbyUsers: (lat, lng, radius) => api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  updateLocation: (lat, lng) => api.post('/users/update-location', { lat, lng }),
  getUserProfile: (userId) => api.get(`/users/profile/${userId}`),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getAvailabilityStatus: () => api.get('/users/status'),
  setAvailabilityStatus: (isAvailable) => api.post('/users/status', { isAvailable }),
  // Backward-compatible alias used in older code paths
  setOnlineStatus: (isAvailable) => api.post('/users/status', { isAvailable }),
  seedUsers: (lat, lng) => api.post('/users/seed', { lat, lng }),
};

export const matchingAPI = {
  sendMatchRequest: (targetUserId, meetingReason, urgency = '1h') =>
    api.post('/matching/request', { targetUserId, meetingReason, urgency }),
  respondToMatch: (matchId, response) =>
    api.post('/matching/respond', { matchId, response }),
  getPendingSummary: () => api.get('/matching/pending-summary'),
  getMatchHistory: (page = 1, limit = 10, status) =>
    api.get(`/matching/history?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),
  confirmMeeting: (meetingId) => api.post('/matching/confirm-meeting', { meetingId }),
};

export const adminAPI = {
  listUsers: ({ page = 1, limit = 20, search = '', filter = 'all' } = {}) =>
    api.get('/admin/users', { params: { page, limit, search, filter } }),
  setFreezeStatus: (userId, isFrozen) =>
    api.patch(`/admin/users/${userId}/freeze`, { isFrozen }),
  updateUserStatus: (userId, payload) =>
    api.patch(`/admin/users/${userId}/status`, payload),
};

export default api;
