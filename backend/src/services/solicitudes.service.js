import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { crearError } from '../middlewares/error.middleware.js';

// ---------------------------------------------------------------------------
// Catálogos del módulo de solicitudes
// ---------------------------------------------------------------------------

export const TIPOS_SOLICITUD = ['CREAR', 'ACTUALIZAR', 'ACTIVAR', 'DESACTIVAR'];
export const ESTADOS_SOLICITUD = ['PENDIENTE', 'EN PROCESO', 'DEVUELTA', 'RECHAZADA', 'VALIDADA'];
export const CATEGORIAS_SOLICITUD = [
  'ALMACEN',
  'BANCOS',
  'CLIENTE',
  'PALETAS O BIG BAG',
  'PRODUCTOR',
  'PRODUCTOS & ATRIBUTOS',
  'PROVEEDOR-AUTORIZADO',
  'REGION DE VENTAS',
  'TRANSPORTISTA - CHOFER',
];

const ESTADOS_TERMINALES = new Set(['RECHAZADA', 'VALIDADA']);
const TIPOS_NOTA = new Set(['NOTA', 'REGRESAR', 'RECHAZAR', 'VALIDAR', 'PROCESAR']);

// ---------------------------------------------------------------------------
// Consultas comunes
// ---------------------------------------------------------------------------

const SELECT_SOLICITUD = `
  SELECT s.id, s.numero, s.tipo_solicitud, s.categoria, s.estado,
         s.empresa_id, e.legal_name AS empresa_nombre,
         s.cost_center_id, cc.name AS sede_nombre,
         s.department_id, d.name AS departamento_nombre,
         s.solicitante_user_id, CONCAT(p.first_name, ' ', p.last_name) AS solicitante_nombre,
         s.supervisor_person_id, CONCAT(sp.first_name, ' ', sp.last_name) AS supervisor_nombre,
         s.datos, s.observaciones,
         s.fecha_solicitud, s.fecha_gestion, s.fecha_validacion,
         s.created_at, s.updated_at
  FROM solicitudes s
  JOIN companies e ON e.id = s.empresa_id
  LEFT JOIN cost_centers cc ON cc.id = s.cost_center_id
  LEFT JOIN departments d ON d.id = s.department_id
  JOIN users u ON u.id = s.solicitante_user_id
  JOIN persons p ON p.id = u.person_id
  LEFT JOIN persons sp ON sp.id = s.supervisor_person_id`;

const JOINS_SOLICITUD = `
  JOIN companies e ON e.id = s.empresa_id
  LEFT JOIN cost_centers cc ON cc.id = s.cost_center_id
  LEFT JOIN departments d ON d.id = s.department_id
  JOIN users u ON u.id = s.solicitante_user_id
  JOIN persons p ON p.id = u.person_id
  LEFT JOIN persons sp ON sp.id = s.supervisor_person_id`;

/** Convierte la fila de MySQL (datos JSON como texto) al formato de la API. */
function formatearSolicitud(fila) {
  if (!fila) return null;
  let datos = null;
  if (fila.datos) {
    try {
      datos = typeof fila.datos === 'string' ? JSON.parse(fila.datos) : fila.datos;
    } catch {
      datos = null;
    }
  }
  return { ...fila, datos };
}

// ---------------------------------------------------------------------------
// Listado y detalle
// ---------------------------------------------------------------------------

export async function listarSolicitudes(filtros = {}, userId) {
  const condiciones = [];
  const params = [];

  if (filtros.estado) {
    condiciones.push('s.estado = ?');
    params.push(filtros.estado);
  }
  if (filtros.categoria) {
    condiciones.push('s.categoria = ?');
    params.push(filtros.categoria);
  }
  if (filtros.tipo_solicitud) {
    condiciones.push('s.tipo_solicitud = ?');
    params.push(filtros.tipo_solicitud);
  }
  if (filtros.empresa_id) {
    condiciones.push('s.empresa_id = ?');
    params.push(filtros.empresa_id);
  }
  if (filtros.q) {
    condiciones.push('(s.numero LIKE ? OR s.categoria LIKE ?)');
    params.push(`%${filtros.q}%`, `%${filtros.q}%`);
  }
  // Alcance por departamento: el usuario solo ve solicitudes del departamento
  // al que pertenece en el organigrama (employees).
  if (filtros.solo_departamento) {
    condiciones.push(
      's.department_id = (SELECT e.department_id FROM employees e JOIN users u ON u.person_id = e.person_id WHERE u.id = ?)'
    );
    params.push(userId);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const sql = `${SELECT_SOLICITUD} ${where} ORDER BY s.fecha_solicitud DESC, s.id DESC`;

  const [filas] = await pool.execute(sql, params);
  return filas.map(formatearSolicitud);
}

export async function obtenerSolicitud(id, opciones = {}) {
  const [filas] = await pool.execute(`${SELECT_SOLICITUD} WHERE s.id = ?`, [id]);
  const solicitud = formatearSolicitud(filas[0]);
  if (!solicitud) return null;

  // Con alcance por departamento, la solicitud debe pertenecer al departamento
  // del usuario en el organigrama; de lo contrario se trata como inexistente.
  if (opciones.soloDepartamento && opciones.userId) {
    const [depto] = await pool.execute(
      `SELECT e.department_id
       FROM employees e
       JOIN users u ON u.person_id = e.person_id
       WHERE u.id = ?`,
      [opciones.userId]
    );
    if (solicitud.department_id !== (depto[0]?.department_id ?? null)) {
      return null;
    }
  }

  const [requerimientos] = await pool.execute(
    `SELECT id, nombre, cumplido, archivo_nombre, archivo_ruta
     FROM solicitud_requerimientos
     WHERE solicitud_id = ? ORDER BY id ASC`,
    [id]
  );

  const [notas] = await pool.execute(
    `SELECT n.id, n.tipo_nota, n.nota, n.created_at,
            CONCAT(p.first_name, ' ', p.last_name) AS autor_nombre
     FROM solicitud_notas n
     JOIN users u ON u.id = n.user_id
     JOIN persons p ON p.id = u.person_id
     WHERE n.solicitud_id = ?
     ORDER BY n.created_at ASC, n.id ASC`,
    [id]
  );

  return { ...solicitud, requerimientos, notas };
}

// ---------------------------------------------------------------------------
// Creación y actualización
// ---------------------------------------------------------------------------

export async function crearSolicitud(datosEntrada, userId) {
  const { tipo_solicitud, categoria, empresa_id, cost_center_id, department_id,
          supervisor_person_id, datos, observaciones, requerimientos } = datosEntrada;

  if (!TIPOS_SOLICITUD.includes(tipo_solicitud)) {
    throw crearError(400, 'Tipo de solicitud no válido.');
  }
  if (!CATEGORIAS_SOLICITUD.includes(categoria)) {
    throw crearError(400, 'Categoría de solicitud no válida.');
  }
  if (!Number.isInteger(empresa_id)) {
    throw crearError(400, 'Debe seleccionar una empresa.');
  }

  const numero = await generarNumeroSolicitud();

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [resultado] = await conexion.execute(
      `INSERT INTO solicitudes
         (numero, tipo_solicitud, categoria, empresa_id, cost_center_id,
          department_id, solicitante_user_id, supervisor_person_id, datos, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero,
        tipo_solicitud,
        categoria,
        empresa_id,
        cost_center_id || null,
        department_id || null,
        userId,
        supervisor_person_id || null,
        datos !== undefined ? JSON.stringify(datos) : null,
        observaciones || null,
      ]
    );

    const solicitudId = resultado.insertId;
    await insertarRequerimientos(conexion, solicitudId, requerimientos);
    await insertarNota(conexion, solicitudId, userId, 'NOTA', 'Solicitud creada.');

    await conexion.commit();

    const [nuevas] = await conexion.execute(`${SELECT_SOLICITUD} WHERE s.id = ?`, [solicitudId]);
    return formatearSolicitud(nuevas[0]);
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function actualizarSolicitud(id, datosEntrada, userId) {
  const solicitud = await obtenerSolicitud(id);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }
  if (ESTADOS_TERMINALES.has(solicitud.estado)) {
    throw crearError(
      400,
      'La solicitud está cerrada (rechazada o validada) y no se puede editar.'
    );
  }

  const { tipo_solicitud, categoria, supervisor_person_id, datos, observaciones, requerimientos } =
    datosEntrada;

  if (tipo_solicitud !== undefined && !TIPOS_SOLICITUD.includes(tipo_solicitud)) {
    throw crearError(400, 'Tipo de solicitud no válido.');
  }
  if (categoria !== undefined && !CATEGORIAS_SOLICITUD.includes(categoria)) {
    throw crearError(400, 'Categoría de solicitud no válida.');
  }
  if (
    supervisor_person_id !== undefined &&
    supervisor_person_id !== null &&
    !Number.isInteger(supervisor_person_id)
  ) {
    throw crearError(400, 'Supervisor no válido.');
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    await conexion.execute(
      `UPDATE solicitudes
       SET tipo_solicitud = ?, categoria = ?, supervisor_person_id = ?, datos = ?, observaciones = ?
       WHERE id = ?`,
      [
        tipo_solicitud !== undefined ? tipo_solicitud : solicitud.tipo_solicitud,
        categoria !== undefined ? categoria : solicitud.categoria,
        supervisor_person_id !== undefined ? supervisor_person_id : solicitud.supervisor_person_id,
        datos !== undefined ? JSON.stringify(datos) : solicitud.datos,
        observaciones !== undefined ? observaciones : solicitud.observaciones,
        id,
      ]
    );

    if (requerimientos !== undefined) {
      await sincronizarRequerimientos(conexion, id, requerimientos);
    }

    await insertarNota(conexion, id, userId, 'NOTA', 'Solicitud actualizada.');

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return obtenerSolicitud(id);
}

export async function eliminarSolicitud(id) {
  const solicitud = await obtenerSolicitud(id);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }
  if (solicitud.estado === 'VALIDADA') {
    throw crearError(400, 'No se puede eliminar una solicitud validada.');
  }

  await pool.execute('DELETE FROM solicitudes WHERE id = ?', [id]);

  // Se elimina también la carpeta con los archivos adjuntos de la solicitud.
  const carpeta = path.resolve(RAIZ_BACKEND, `uploads/solicitudes/${id}`);
  fs.rm(carpeta, { recursive: true, force: true }, () => {});
}

// ---------------------------------------------------------------------------
// Acciones de gestión
// ---------------------------------------------------------------------------

export async function procesarSolicitud(id, userId, nota = '') {
  return cambiarEstadoConNota(id, userId, 'EN PROCESO', 'PROCESAR',
    nota || 'Solicitud en proceso.', true);
}

export async function regresarSolicitud(id, userId, nota) {
  if (!nota || !nota.trim()) {
    throw crearError(400, 'Debe indicar el motivo de la devolución.');
  }
  return cambiarEstadoConNota(id, userId, 'DEVUELTA', 'REGRESAR', nota.trim());
}

export async function rechazarSolicitud(id, userId, motivo) {
  if (!motivo || !motivo.trim()) {
    throw crearError(400, 'Debe indicar el motivo del rechazo.');
  }
  return cambiarEstadoConNota(id, userId, 'RECHAZADA', 'RECHAZAR', motivo.trim());
}

export async function validarSolicitud(id, userId, nota = '') {
  return cambiarEstadoConNota(id, userId, 'VALIDADA', 'VALIDAR',
    nota || 'Solicitud validada.', true);
}

export async function agregarNotaSolicitud(id, userId, nota) {
  if (!nota || !nota.trim()) {
    throw crearError(400, 'La nota no puede estar vacía.');
  }

  const solicitud = await obtenerSolicitudBase(id);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await insertarNota(conexion, id, userId, 'NOTA', nota.trim());
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return obtenerSolicitud(id);
}

// ---------------------------------------------------------------------------
// Archivos adjuntos de los requerimientos (documentos requeridos)
// ---------------------------------------------------------------------------

const RAIZ_BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Convierte una ruta absoluta de un archivo subido en una ruta relativa a conservar en BD. */
function rutaRelativa(rutaAbsoluta) {
  return path.relative(RAIZ_BACKEND, rutaAbsoluta).split(path.sep).join('/');
}

export async function adjuntarArchivoRequerimiento(solicitudId, requerimientoId, archivo) {
  const solicitud = await obtenerSolicitudBase(solicitudId);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }
  if (ESTADOS_TERMINALES.has(solicitud.estado)) {
    throw crearError(400, 'La solicitud está cerrada y no admite cambios.');
  }

  const [requerimientos] = await pool.execute(
    `SELECT id, archivo_ruta FROM solicitud_requerimientos
     WHERE id = ? AND solicitud_id = ?`,
    [requerimientoId, solicitudId]
  );
  const requerimiento = requerimientos[0];
  if (!requerimiento) {
    throw crearError(404, 'Requerimiento no encontrado en la solicitud.');
  }

  // Si ya existía un archivo, se reemplaza (se elimina el anterior).
  if (requerimiento.archivo_ruta) {
    const previo = path.resolve(RAIZ_BACKEND, requerimiento.archivo_ruta);
    fs.unlink(previo, () => {});
  }

  await pool.execute(
    `UPDATE solicitud_requerimientos
     SET cumplido = 1, archivo_nombre = ?, archivo_ruta = ?
     WHERE id = ?`,
    [archivo.originalname, rutaRelativa(archivo.path), requerimientoId]
  );

  return obtenerSolicitud(solicitudId);
}

export async function obtenerArchivoRequerimiento(solicitudId, requerimientoId) {
  const solicitud = await obtenerSolicitudBase(solicitudId);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }

  const [requerimientos] = await pool.execute(
    `SELECT id, archivo_nombre, archivo_ruta FROM solicitud_requerimientos
     WHERE id = ? AND solicitud_id = ?`,
    [requerimientoId, solicitudId]
  );
  const requerimiento = requerimientos[0];
  if (!requerimiento) {
    throw crearError(404, 'Requerimiento no encontrado en la solicitud.');
  }
  if (!requerimiento.archivo_ruta) {
    return null;
  }

  return {
    ruta: path.resolve(RAIZ_BACKEND, requerimiento.archivo_ruta),
    nombre: requerimiento.archivo_nombre || 'documento',
  };
}

export async function quitarArchivoRequerimiento(solicitudId, requerimientoId) {
  const solicitud = await obtenerSolicitudBase(solicitudId);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }
  if (ESTADOS_TERMINALES.has(solicitud.estado)) {
    throw crearError(400, 'La solicitud está cerrada y no admite cambios.');
  }

  const [requerimientos] = await pool.execute(
    `SELECT id, archivo_ruta FROM solicitud_requerimientos
     WHERE id = ? AND solicitud_id = ?`,
    [requerimientoId, solicitudId]
  );
  const requerimiento = requerimientos[0];
  if (!requerimiento) {
    throw crearError(404, 'Requerimiento no encontrado en la solicitud.');
  }

  if (requerimiento.archivo_ruta) {
    const ruta = path.resolve(RAIZ_BACKEND, requerimiento.archivo_ruta);
    fs.unlink(ruta, () => {});
  }

  await pool.execute(
    `UPDATE solicitud_requerimientos
     SET cumplido = 0, archivo_nombre = NULL, archivo_ruta = NULL
     WHERE id = ?`,
    [requerimientoId]
  );

  return obtenerSolicitud(solicitudId);
}

async function cambiarEstadoConNota(id, userId, nuevoEstado, tipoNota, nota, permitirMismoEstado = false) {
  const solicitud = await obtenerSolicitudBase(id);
  if (!solicitud) {
    throw crearError(404, 'Solicitud no encontrada.');
  }

  if (ESTADOS_TERMINALES.has(solicitud.estado)) {
    throw crearError(400, 'La solicitud ya está cerrada y no admite más cambios de estado.');
  }
  if (!permitirMismoEstado && solicitud.estado === nuevoEstado) {
    throw crearError(400, `La solicitud ya está en estado "${nuevoEstado}".`);
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const extra = nuevoEstado === 'VALIDADA'
      ? ', fecha_validacion = NOW()'
      : nuevoEstado === 'EN PROCESO'
        ? ', fecha_gestion = NOW()'
        : '';

    await conexion.execute(
      `UPDATE solicitudes SET estado = ?${extra} WHERE id = ?`,
      [nuevoEstado, id]
    );
    await insertarNota(conexion, id, userId, tipoNota, nota);

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return obtenerSolicitud(id);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function obtenerSolicitudBase(id) {
  const [filas] = await pool.execute(
    'SELECT id, estado FROM solicitudes WHERE id = ?',
    [id]
  );
  return filas[0] || null;
}

async function generarNumeroSolicitud() {
  const anio = new Date().getFullYear();
  const [[fila]] = await pool.query(
    `SELECT COUNT(*) AS total FROM solicitudes WHERE YEAR(fecha_solicitud) = ?`,
    [anio]
  );
  const correlativo = String(Number(fila.total) + 1).padStart(4, '0');
  return `SOL-${anio}-${correlativo}`;
}

/** Inserta el checklist de requerimientos dentro de una transacción activa. */
async function insertarRequerimientos(conexion, solicitudId, requerimientos) {
  if (!Array.isArray(requerimientos) || requerimientos.length === 0) return;

  const valores = requerimientos.map((r) => [
    solicitudId,
    String(r.nombre || '').trim(),
    r.cumplido === true || r.cumplido === 1 ? 1 : 0,
  ]).filter((v) => v[1]);

  if (valores.length === 0) return;
  await conexion.query(
    'INSERT INTO solicitud_requerimientos (solicitud_id, nombre, cumplido) VALUES ?',
    [valores]
  );
}

/**
 * Sincroniza el checklist de documentos de una solicitud al editarla,
 * conservando los archivos ya adjuntados de los requerimientos que se mantienen.
 */
async function sincronizarRequerimientos(conexion, solicitudId, requerimientos) {
  const [actuales] = await conexion.execute(
    'SELECT id, nombre, cumplido, archivo_ruta FROM solicitud_requerimientos WHERE solicitud_id = ?',
    [solicitudId]
  );
  const nombresNuevos = new Set(
    (Array.isArray(requerimientos) ? requerimientos : [])
      .map((r) => String(r?.nombre || '').trim())
      .filter(Boolean)
  );

  // Elimina los requerimientos que ya no estén en la lista y libera su archivo del disco.
  for (const actual of actuales) {
    if (!nombresNuevos.has(actual.nombre)) {
      await conexion.execute('DELETE FROM solicitud_requerimientos WHERE id = ?', [actual.id]);
      if (actual.archivo_ruta) {
        fs.unlink(path.resolve(RAIZ_BACKEND, actual.archivo_ruta), () => {});
      }
    }
  }

  // Inserta los que no existen; los existentes se conservan con su archivo adjunto.
  for (const nombre of nombresNuevos) {
    await conexion.execute(
      'INSERT INTO solicitud_requerimientos (solicitud_id, nombre, cumplido) VALUES (?, ?, 0)',
      [solicitudId, nombre]
    );
  }
}

/** Inserta una nota dentro de una transacción activa. */
async function insertarNota(conexion, solicitudId, userId, tipoNota, nota) {
  const tipo = TIPOS_NOTA.has(tipoNota) ? tipoNota : 'NOTA';
  await conexion.execute(
    'INSERT INTO solicitud_notas (solicitud_id, user_id, tipo_nota, nota) VALUES (?, ?, ?, ?)',
    [solicitudId, userId, tipo, nota]
  );
}