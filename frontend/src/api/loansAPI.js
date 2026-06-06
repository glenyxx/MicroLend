import api from './axios';

export const applyLoan     = (data)   => api.post('/api/loans/apply', data);
export const getLoans      = (params) => api.get('/api/loans', { params });
export const getLoanById   = (id)     => api.get(`/api/loans/${id}`);
export const updateStatus  = (id, data) => api.patch(`/api/loans/${id}/status`, data);