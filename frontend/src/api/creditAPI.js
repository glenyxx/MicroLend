import api from './axios';

export const scoreLoan = (data) => api.post('/api/credit/score', data);