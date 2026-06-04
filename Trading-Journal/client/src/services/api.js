import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sathwiktrades-backend.onrender.com',
});

export default api;