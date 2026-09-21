import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { crearError } from './error.middleware.js';

// Directorio raíz de archivos subidos: backend/uploads/solicitudes
const DIR_UPLOADS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/solicitudes');

const EXTENSIONES_PERMITIDAS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'doc',
  'docx',
  'xls',
  'xlsx',
]);

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB

/**
 * Middleware Multer para subir un único archivo (campo "archivo").
 * Guarda el archivo en uploads/solicitudes/{solicitudId}/ con un nombre seguro.
 * Los errores de Multer se traducen a crearError(400) para el manejador global.
 */
const subida = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      const directorio = path.join(DIR_UPLOADS, String(req.params.id));
      fs.mkdirSync(directorio, { recursive: true });
      callback(null, directorio);
    },
    filename(req, file, callback) {
      const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '') || 'bin';
      const nombre = `archivo-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      callback(null, nombre);
    },
  }),
  fileFilter(req, file, callback) {
    const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
    if (!EXTENSIONES_PERMITIDAS.has(ext)) {
      return callback(crearError(400, `Tipo de archivo no permitido (${ext || 'desconocido'}).`));
    }
    callback(null, true);
  },
  limits: { fileSize: TAMANO_MAXIMO },
});

/** Envuelve multer.single para traducir los errores de Multer al formato de la API. */
export function subirArchivoRequerimiento(req, res, next) {
  subida.single('archivo')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(crearError(400, 'El archivo supera el tamaño máximo de 10 MB.'));
    }
    return next(error);
  });
}

// ---------------------------------------------------------------------------
// Subida de archivos al crear o actualizar una solicitud (multipart atómico)
// ---------------------------------------------------------------------------

const subidaMemoria = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
    if (!EXTENSIONES_PERMITIDAS.has(ext)) {
      return callback(crearError(400, `Tipo de archivo no permitido (${ext || 'desconocido'}).`));
    }
    callback(null, true);
  },
  limits: { fileSize: TAMANO_MAXIMO, files: 12 },
});

/**
 * Middleware Multer para crear/actualizar solicitudes.
 * Acepta el JSON de la solicitud en el campo "datos", los nombres de los
 * requerimientos con archivo en "nombres_archivos" y los archivos en "archivos".
 * Usa memoria porque el id de la solicitud aún no existe al recibir el request.
 */
export function subirArchivosSolicitud(req, res, next) {
  subidaMemoria.array('archivos', 12)(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(crearError(400, 'Un archivo supera el tamaño máximo de 10 MB.'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(crearError(400, 'Se superó el máximo de 12 archivos adjuntos.'));
    }
    return next(error);
  });
}