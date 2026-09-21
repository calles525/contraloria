// En desarrollo usa localhost; en producción usa la variable de entorno
// VITE_API_URL. Si no está definida (p. ej. build en Netlify sin variables
// configuradas) se usa la URL de la API de producción como respaldo.
export const API_URL = import.meta.env.VITE_API_URL || 'https://storego.website/api-contraloria/api';
export const TOKEN_KEY = 'token';