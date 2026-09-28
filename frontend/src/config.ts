// En desarrollo usa VITE_API_URL (archivo .env del frontend). Si no está
// definida (p. ej. build en Netlify sin variables configuradas) se usa la URL
// de la API de producción como respaldo.
export const API_URL = import.meta.env.VITE_API_URL || 'https://storego.website/api-contraloria/api';
export const TOKEN_KEY = 'token';
