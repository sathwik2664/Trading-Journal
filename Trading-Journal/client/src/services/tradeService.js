import api from './api';

export const getTrades = () => api.get('/trades');
export const getTradeById = (id) => api.get(`/trades/${id}`);
export const createTrade = (data) => api.post('/trades', data);
export const updateTrade = (id, data) => api.put(`/trades/${id}`, data);
export const deleteTrade = (id) => api.delete(`/trades/${id}`);