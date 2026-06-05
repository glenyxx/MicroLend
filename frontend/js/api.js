// Base API Configuration
const API_BASE_URL = 'http://localhost';
const TIMEOUT_MS = 15000;

/**
 * Core wrapper mimic for Axios request/response interceptor mechanism
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Setup headers object
  options.headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  }

  // Request Interceptor: Attach JWT Token if present
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  options.signal = controller.signal;

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    // Response Interceptor: Handle 401 Global Errors
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return Promise.reject(new Error('Unauthorized'));
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return Promise.reject({ response: { status: response.status, data: errorData } });
    }

    // Return JSON body directly to align with Axios data output
    return { data: await response.json() };

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return Promise.reject(new Error('Request Timeout'));
    }
    return Promise.reject(error);
  }
}

// Global API Services Export Object
window.MicroLendAPI = {
  // Authentication Endpoints
  auth: {
    register: (data) => apiFetch('/api/users/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiFetch('/api/users/login', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: () => apiFetch('/api/users/profile', { method: 'GET' })
  },

  // Loan Endpoints
  loans: {
    applyLoan: (data) => apiFetch('/api/loans/apply', { method: 'POST', body: JSON.stringify(data) }),
    getLoans: (params) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/loans${query}`, { method: 'GET' });
    },
    getLoanById: (id) => apiFetch(`/api/loans/${id}`, { method: 'GET' }),
    updateStatus: (id, data) => apiFetch(`/api/loans/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  // Credit Scoring
  credit: {
    scoreLoan: (data) => apiFetch('/api/credit/score', { method: 'POST', body: JSON.stringify(data) })
  },

  // Repayment Endpoints
  repayments: {
    getSchedule: (loanId) => apiFetch(`/api/repayments/loan/${loanId}`, { method: 'GET' }),
    recordPayment: (data) => apiFetch('/api/repayments/pay', { method: 'POST', body: JSON.stringify(data) }),
    getOverdue: () => apiFetch('/api/repayments/overdue', { method: 'GET' }),
    getAllSchedules: (params) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/repayments${query}`, { method: 'GET' });
    }
  }
};