import api from './api';

export const getSetups    = ()          => api.get('/setups');
export const createSetup  = (data)      => api.post('/setups', data);
export const updateSetup  = (id, data)  => api.put(`/setups/${id}`, data);
export const deleteSetup  = (id)        => api.delete(`/setups/${id}`);