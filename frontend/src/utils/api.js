import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useAdminAuthStore } from '../store/adminAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ایجاد instance از axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor برای افزودن توکن به هر درخواست
api.interceptors.request.use(
  (config) => {
    const userToken = useAuthStore.getState().token;
    const adminToken = useAdminAuthStore.getState().token;
    const token = userToken || adminToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor برای مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hasUser = useAuthStore.getState().isAuthenticated;
      const hasAdmin = useAdminAuthStore.getState().isAuthenticated;

      if (hasUser) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (hasAdmin) {
        const logoutAdmin = useAdminAuthStore.getState().logout;
        logoutAdmin();
        if (window.location.pathname.startsWith('/widget/admin')) {
          window.location.reload();
        } else {
          window.location.href = '/widget/admin';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Site APIs
export const siteAPI = {
  getAll: () => api.get('/sites'),
  getById: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
  getScripts: (id) => api.get(`/sites/${id}/scripts`),
};

// Admin APIs
export const adminAPI = {
  getAll: (siteId) => api.get(`/sites/${siteId}/admins`),
  getById: (siteId, adminId) => api.get(`/sites/${siteId}/admins/${adminId}`),
  create: (siteId, data) => api.post(`/sites/${siteId}/admins`, data),
  update: (siteId, adminId, data) => api.put(`/sites/${siteId}/admins/${adminId}`, data),
  delete: (siteId, adminId) => api.delete(`/sites/${siteId}/admins/${adminId}`),
  login: (data) => api.post('/admin/login', data),
};

// Chat APIs
export const chatAPI = {
  getAll: (siteId, filters, options = {}) => {
    const isAdmin = options.asAdmin || useAdminAuthStore.getState().isAuthenticated;
    const endpoint = isAdmin ? `/admin/sites/${siteId}/chats` : `/sites/${siteId}/chats`;
    return api.get(endpoint, { params: filters });
  },
  getById: (chatId) => api.get(`/chats/${chatId}`),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId, data) => api.post(`/chats/${chatId}/messages`, data),
  transferChat: (chatId, data) => api.post(`/chats/${chatId}/transfer`, data),
  closeChat: (chatId) => api.post(`/chats/${chatId}/close`),
  rateChat: (chatId, data) => api.post(`/chats/${chatId}/rate`, data),
};

// Report APIs
export const reportAPI = {
  getOverview: (siteId) => api.get(`/sites/${siteId}/reports/overview`),
  getAdminPerformance: (siteId, adminId) => api.get(`/sites/${siteId}/reports/admin/${adminId}`),
  exportEmails: (siteId) => api.get(`/sites/${siteId}/reports/export/emails`),
  exportPhones: (siteId) => api.get(`/sites/${siteId}/reports/export/phones`),
};

export default api;
