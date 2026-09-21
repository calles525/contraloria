/**
 * Configuracion centralizada de CORS para la API REST y Socket.IO.
 *
 * La variable CORS_ORIGIN admite:
 *  - Origenes exactos separados por coma: "https://app.dominio.com,https://admin.dominio.com"
 *  - Comodin total "*": acepta cualquier origen (solo recomendado en desarrollo).
 *  - Comodines de subdominio: "https://*.dominio.com" acepta cualquier subdominio,
 *    util en produccion para covers deploy previews (ej: https://*.netlify.app).
 */

const ORIGENES_DEFECTO = 'http://localhost:5173';

/** Devuelve la lista de origenes permitidos configurados en CORS_ORIGIN. */
export function parsearOrigenesPermitidos() {
  return (process.env.CORS_ORIGIN || ORIGENES_DEFECTO)
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

/** Convierte un patron con comodines ("https://*.dominio.com") en expresion regular. */
function convertirPatronARegex(patron) {
  const escapado = patron.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escapado}$`);
}

/**
 * Indica si el origen de la peticion esta permitido.
 * Las peticiones sin origen (curl, Postman, misma aplicacion) siempre se permiten.
 */
export function origenPermitido(origin) {
  if (!origin) return true;

  const origenes = parsearOrigenesPermitidos();
  if (origenes.includes('*')) return true;

  return origenes.some((permitido) => {
    if (permitido === origin) return true;
    if (permitido.includes('*')) return convertirPatronARegex(permitido).test(origin);
    return false;
  });
}

/** Opciones de CORS para el middleware de Express. */
export function opcionesCors() {
  return {
    origin: origenPermitido,
    credentials: true,
    // Expone los encabezados que el frontend necesita leer (nombre del archivo descargado).
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  };
}

/** Opciones de CORS para Socket.IO (misma politica que la API REST). */
export function opcionesCorsSocket() {
  return {
    origin(origin, callback) {
      if (origenPermitido(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS.'));
    },
    credentials: true,
  };
}