import axios from 'axios';

const BASE = 'http://localhost:5000/api/setups';

export const getSetups    = ()          => axios.get(BASE);
export const createSetup  = (data)      => axios.post(BASE, data);
export const updateSetup  = (id, data)  => axios.put(`${BASE}/${id}`, data);
export const deleteSetup  = (id)        => axios.delete(`${BASE}/${id}`);