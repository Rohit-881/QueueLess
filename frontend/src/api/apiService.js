import axiosClient from './axiosClient';

export const apiService = {
  // Authentication
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  logout: () => axiosClient.post('/auth/logout'),
  getMe: () => axiosClient.get('/auth/me'),
  updateProfile: (data) => axiosClient.put('/auth/profile', data),

  // Services
  getServices: () => axiosClient.get('/services'),
  getServiceById: (id) => axiosClient.get(`/services/${id}`),
  createService: (data) => axiosClient.post('/services', data),
  updateService: (id, data) => axiosClient.put(`/services/${id}`, data),
  deleteService: (id) => axiosClient.delete(`/services/${id}`),

  // Queue Sessions
  getQueueSummary: (sessionId) => axiosClient.get(`/queues/${sessionId}/summary`),
  getQueueSessions: (params) => axiosClient.get('/queues/sessions', { params }),
  updateQueueStatus: (sessionId, status) =>
    axiosClient.patch(`/queues/${sessionId}/status`, { status }),

  // Tokens (Customer Operations)
  joinQueue: (serviceId) => axiosClient.post('/tokens/join', { serviceId }),
  getMyActiveToken: () => axiosClient.get('/tokens/my-active'),
  getMyHistory: () => axiosClient.get('/tokens/my-history'),
  getTokenById: (id) => axiosClient.get(`/tokens/${id}`),
  cancelToken: (id, reason) => axiosClient.post(`/tokens/${id}/cancel`, { reason }),

  // Staff Queue Controls
  getStaffDashboard: () => axiosClient.get('/staff/dashboard'),
  callNextToken: (sessionId) => axiosClient.post(`/staff/queues/${sessionId}/call-next`),
  startService: (tokenId) => axiosClient.post(`/staff/tokens/${tokenId}/start`),
  completeService: (tokenId, resolutionReason) =>
    axiosClient.post(`/staff/tokens/${tokenId}/complete`, { resolutionReason }),
  skipToken: (tokenId, reason) =>
    axiosClient.post(`/staff/tokens/${tokenId}/skip`, { reason }),
  markNoShow: (tokenId, reason) =>
    axiosClient.post(`/staff/tokens/${tokenId}/no-show`, { reason }),

  // Analytics & Admin Management
  getAnalytics: (serviceId) =>
    axiosClient.get('/analytics', { params: serviceId ? { serviceId } : {} }),
  getStaffList: () => axiosClient.get('/analytics/staff'),
  getAllUsers: (params) => axiosClient.get('/analytics/users', { params }),
  updateUser: (id, data) => axiosClient.patch(`/analytics/users/${id}`, data),
  createUser: (userData) => axiosClient.post('/analytics/users', userData),
  reseedDemoData: () => axiosClient.post('/analytics/reseed'),

  // Walk-in / Direct Token Generation
  issueWalkInToken: (data) => axiosClient.post('/tokens/walk-in', data),
};

export default apiService;
