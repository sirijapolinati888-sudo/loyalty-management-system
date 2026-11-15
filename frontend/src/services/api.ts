import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yottaflex_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('yottaflex_access_token');
        localStorage.removeItem('yottaflex_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Persistent Tab Session Cache Helper
export const TabCache = {
  get: (key: string) => {
    try {
      const item = sessionStorage.getItem(`yottaflex_cache_${key}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      // Optional 5-minute expiration
      if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem(`yottaflex_cache_${key}`);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  },
  set: (key: string, data: any) => {
    try {
      sessionStorage.setItem(`yottaflex_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn('TabCache quota exceeded or error:', e);
    }
  },
  invalidate: (key?: string) => {
    if (key) {
      sessionStorage.removeItem(`yottaflex_cache_${key}`);
    } else {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('yottaflex_cache_'))
        .forEach(k => sessionStorage.removeItem(k));
    }
  }
};

export const LoyaltyAPI = {
  // Auth
  login: (data: { email: string; password: string }) => api.post('/auth/login', data).then(r => r.data),
  logout: () => {
    TabCache.invalidate();
    return api.post('/auth/logout').then(r => r.data);
  },
  getMe: () => api.get('/auth/me').then(r => r.data),

  // Analytics
  getSummary: (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = TabCache.get('summary');
      if (cached) return Promise.resolve(cached);
    }
    return api.get('/analytics/summary').then(r => {
      TabCache.set('summary', r.data);
      return r.data;
    });
  },
  
  // Customers
  getCustomers: (params?: { skip?: number; limit?: number; search?: string }) => 
    api.get('/customers', { params }).then(r => r.data),
  getCustomer: (id: string) => api.get(`/customers/${id}`).then(r => r.data),
  getCustomerAccount: (id: string) => api.get(`/customers/${id}/account`).then(r => r.data),
  getCustomerOrders: (id: string) => api.get(`/customers/${id}/orders`).then(r => r.data),
  getCustomerTransactions: (id: string) => api.get(`/customers/${id}/transactions`).then(r => r.data),

  // Orders
  getOrders: (params?: { skip?: number; limit?: number; customer_id?: string; status?: string }) =>
    api.get('/orders', { params }).then(r => r.data),
  getOrder: (id: string) => api.get(`/orders/${id}`).then(r => r.data),
  getOrderLines: (id: string) => api.get(`/orders/${id}/lines`).then(r => r.data),
  processReturn: (data: { order_id: string; reason?: string }) =>
    api.post('/orders/returns', data).then(r => r.data),

  // Points Ledger
  getTransactions: (params?: { skip?: number; limit?: number; customer_id?: string; txn_type?: string }) =>
    api.get('/transactions', { params }).then(r => r.data),

  // Redemptions & Rewards
  getRewards: () => api.get('/redemptions/rewards').then(r => r.data),
  getRedemptions: () => api.get('/redemptions').then(r => r.data),
  createRedemption: (data: { customer_id: string; reward_id: string }) =>
    api.post('/redemptions', data).then(r => r.data),

  // Expiration
  getExpiryBatches: () => api.get('/expiration/batches').then(r => r.data),
  getPointsLots: () => api.get('/expiration/lots').then(r => r.data),
  runExpiration: (data: { cutoff_date?: string }) => api.post('/expiration/run', data).then(r => r.data),

  // Tiers
  getTiers: () => api.get('/tiers').then(r => r.data),
  getTierHistory: () => api.get('/tiers/history').then(r => r.data),

  // Anomalies
  getAnomalies: (params?: { severity?: string; issue_type?: string }) =>
    api.get('/anomalies', { params }).then(r => r.data),

  // Validation
  getValidationReport: () => api.get('/validation/report').then(r => r.data),

  // Generator
  triggerGeneration: (mode: string, injectAnomalies = true) =>
    api.post('/generator/run', null, { params: { mode, inject_anomalies: injectAnomalies } }).then(r => r.data),
  getGenerationStatus: () => api.get('/generator/status').then(r => r.data),
};
