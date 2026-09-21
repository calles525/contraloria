import axios from 'axios';
import { API_URL, TOKEN_KEY } from '../config';

const api = axios.create({
  baseURL: API_URL,
  // Evita que la app se quede "pensando" si el servidor no responde.
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default api;
