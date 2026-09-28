/**
 * Configuracion de CORS para la API REST y Socket.IO.
 *
 * La variable de entorno CORS_ORIGIN admite:
 *  - Comodin total "*": acepta cualquier origen (lo que usa el sistema ahora).
 *  - Origenes exactos separados por coma: "https://app.dominio.com,https://admin.dominio.com"
 *  - Comodines de subdominio: "https://*.dominio.com" acepta cualquier subdominio,
 *    util para deploys con vistas previas (ej: https://*.netlify.app).
 *
 * Si CORS_ORIGIN no esta definida o esta vacia, se comporta como comodin total.
 *
 * Nota tecnica: el paquete "cors" invoca la opcion "origin" con la firma
 * (origin, callback), por lo que hay que llamar a callback. Si se devolviera un
 * booleano, el middleware nunca continuaria y la peticion quedaria colgada.
 */

/** Lista de origenes configurados. Un asterisco significa "cualquiera". */
export function parsearOrigenesPermitidos() {
  const configurado = (process.env.CORS_ORIGIN ?? '').trim();

  if (!configurado || configurado === '*') return ['*'];

  const lista = configurado
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  return lista.length > 0 ? lista : ['*'];
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
    origin: (origin, callback) => {
      if (origenPermitido(origin)) return callback(null, true);

      const error = new Error('Origen no permitido por la politica CORS.');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
    // Expone los encabezados que el frontend necesita leer (nombre del archivo descargado).
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  };
}

/** Opciones de CORS para Socket.IO (misma politica que la API REST). */
export function opcionesCorsSocket() {
  return {
    origin: (origin, callback) => {
      if (origenPermitido(origin)) return callback(null, true);

      const error = new Error('Origen no permitido por la politica CORS.');
      error.statusCode = 403;
      return callback(error);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  };
}
