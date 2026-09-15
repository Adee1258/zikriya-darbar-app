import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import { Alert } from 'react-native';

// Callback to trigger logout from outside React tree (set by AuthContext)
let _onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  _onUnauthorized = handler;
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Better error handling for the frontend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      if (error.response.status === 401) {
        // Auto-logout: clear token and redirect to login
        AsyncStorage.removeItem('token');
        if (_onUnauthorized) _onUnauthorized();
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error No Response (Check IP / Network):', API_BASE_URL);
      Alert.alert(
        'Network Error',
        'Could not connect to the server. Please check your internet connection or backend IP.'
      );
    } else {
      console.error('API Error Request Setup:', error.message);
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  registerAdmin: (name: string, username: string, password: string) =>
    api.post('/auth/register', { name, username, password }),
  updateProfile: (name: string, username: string) =>
    api.put('/auth/profile', { name, username }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// ─── Shops ─────────────────────────────────────────────────────────────────
export const shopsAPI = {
  getAll: (search?: string, marketId?: string) =>
    api.get('/shops', {
      params: {
        ...(search ? { search } : {}),
        ...(marketId !== undefined ? { marketId } : {}),
      },
    }),
  getById: (id: string) => api.get(`/shops/${id}`),
  create: (data: {
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    username: string;
    password: string;
    openingBalance?: number;
    marketId?: string;
  }) => api.post('/shops', data),
  update: (id: string, data: Partial<{ name: string; ownerName: string; phone: string; address: string; marketId: string | null }>) =>
    api.put(`/shops/${id}`, data),
  updatePassword: (shopId: string, newPassword: string) =>
    api.put(`/shops/${shopId}/password`, { newPassword }),
  delete: (shopId: string) => api.delete(`/shops/${shopId}`),
  getBalance: (shopId: string) => api.get(`/shops/${shopId}/balance`),
  getAllBalances: () => api.get('/balances'),
};

// ─── Products ──────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (status?: 'active' | 'inactive') =>
    api.get('/products', { params: status ? { status } : {} }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: { name: string; unit: string; defaultRate: number; status?: string }) =>
    api.post('/products', data),
  update: (id: string, data: Partial<{ name: string; unit: string; defaultRate: number; status: string }>) =>
    api.put(`/products/${id}`, data),
};

// ─── Orders ────────────────────────────────────────────────────────────────
export const ordersAPI = {
  // Admin: all orders across all shops
  getAll: (params?: {
    search?: string;
    filter?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  // Orders for a specific shop
  getByShop: (shopId: string) => api.get(`/shops/${shopId}/orders`),
  create: (data: {
    shopId: string;
    items: Array<{ productId: string; quantity: number; rate?: number }>;
  }) => api.post('/orders', data),
};

// ─── Payments ──────────────────────────────────────────────────────────────
export const paymentsAPI = {
  // Admin: all payments across all shops
  getAll: (params?: {
    search?: string;
    filter?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  // Payments for a specific shop
  getByShop: (shopId: string) => api.get(`/shops/${shopId}/payments`),
  create: (data: {
    shopId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
  }) => api.post('/payments', data),
};

// ─── Ledger ────────────────────────────────────────────────────────────────
export const ledgerAPI = {
  getByShop: (shopId: string) => api.get(`/shops/${shopId}/ledger`),
};

// ─── Expenses ──────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll: (params?: {
    filter?: string;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => api.get('/expenses', { params }),
  getSummary: (params?: { filter?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/expenses/summary', { params }),
  create: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
  }) => api.post('/expenses', data),
  update: (
    id: string,
    data: Partial<{ title: string; amount: number; category: string; date: string; notes: string }>
  ) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// ─── Markets ───────────────────────────────────────────────────────────────────
export const marketsAPI = {
  getAll: () => api.get('/markets'),
  getById: (id: string) => api.get(`/markets/${id}`),
  create: (data: { name: string; visitDay: string; description?: string }) =>
    api.post('/markets', data),
  update: (
    id: string,
    data: Partial<{ name: string; visitDay: string; description: string; isActive: boolean }>
  ) => api.put(`/markets/${id}`, data),
  delete: (id: string) => api.delete(`/markets/${id}`),
  getReport: (id: string, days = 7) => api.get(`/markets/${id}/report?days=${days}`),
  getAllReport: (days = 7) => api.get(`/markets/report/all?days=${days}`),
};

// ─── Admin ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  resetAllData: () => api.delete('/admin/reset'),
};

export default api;
