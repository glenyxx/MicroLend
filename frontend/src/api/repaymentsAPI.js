import api from './axios';

export const getSchedule   = (loanId) => api.get(`/api/repayments/loan/${loanId}`);
export const recordPayment = (data)   => api.post('/api/repayments/pay', data);
export const getOverdue    = ()       => api.get('/api/repayments/overdue');
export const getAllSchedules = (params) => api.get('/api/repayments', { params });