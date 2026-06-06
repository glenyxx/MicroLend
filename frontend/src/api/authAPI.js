import api from './axios';

export const register = (data) => api.post('/api/users/register', data);
export const login    = (data) => api.post('/api/users/login', data);
export const getProfile = ()   => api.get('/api/users/profile');