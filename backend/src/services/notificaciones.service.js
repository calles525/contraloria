import { pool } from '../config/db.js';
import { emitirNotificaciones } from '../sockets/index.js';

/**
 * Crea una notificación para los usuarios con permiso de solicitudes y para
 * los usuarios que trabajan en el departamento destino de la solicitud.
 * Si la generación falla se registra en consola, sin interrumpir la operación principal.
 *
 * @param {object} datos { tipo, titulo, mensaje, origenUserId, departmentId }
 */
export async function notificarActividadSolicitudes({
  tipo,
  titulo,
  mensaje,
  origenUserId = null,
  departmentId = null,
}) {
  try {
    const destinatarios = await obtenerDestinatariosSolicitud(departmentId);

    if (destinatarios.length === 0) return;

    const valores = destinatarios.map((destinatario) => [
      destinatario,
      tipo,
      titulo,
      mensaje,
      origenUserId,
    ]);

    const resultado = await pool.query(
      'INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, origen_user_id) VALUES ?',
      [valores]
    );

    // Los ids asignados por MySQL son consecutivos en un INSERT múltiple.
    const insertId = Number(resultado[0]?.insertId) || 0;
    const creadas = destinatarios.map((userId, indice) => ({
      id: insertId + indice,
      tipo,
      titulo,
      mensaje,
      leida: false,
      created_at: new Date().toISOString(),
    }));

    emitirNotificaciones(
      creadas.map((notificacion, indice) => ({
        userId: destinatarios[indice],
        notificacion,
      }))
    );
  } catch (error) {
    console.error('No se pudo crear la notificación:', error.message);
  }
}

/** Devuelve los ids de usuarios a notificar: con permiso de solicitudes y/o del departamento destino. */
async function obtenerDestinatariosSolicitud(departmentId) {
  let ids = new Set();

  // Usuarios activos con permisos del módulo de solicitudes (solicitantes y gestores del proceso).
  const [gestores] = await pool.execute(
    `SELECT DISTINCT u.id
     FROM users u
     JOIN user_permissions up ON up.user_id = u.id
     JOIN permissions p ON p.id = up.permission_id
     WHERE u.is_active = 1 AND p.code IN ('solicitudes', 'crear_solicitudes', 'gestionar_solicitudes')`
  );
  for (const gestor of gestores) ids.add(gestor.id);

  // Usuarios activos que trabajan en el departamento destino de la solicitud.
  if (departmentId) {
    const [delDepartamento] = await pool.execute(
      `SELECT DISTINCT u.id
       FROM users u
       JOIN employees e ON e.person_id = u.person_id
       WHERE u.is_active = 1 AND e.department_id = ?`,
      [departmentId]
    );
    for (const usuario of delDepartamento) ids.add(usuario.id);
  }

  return [...ids];
}

/** Devuelve las notificaciones recientes de un usuario y el total de no leídas. */
export async function listarNotificaciones({ userId, limite = 10 } = {}) {
  const limiteValido = Math.min(50, Math.max(1, Number(limite) || 10));

  const [filas] = await pool.execute(
    `SELECT id, tipo, titulo, mensaje, leida, created_at
     FROM notificaciones
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [userId, limiteValido]
  );

  const [contador] = await pool.execute(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) AS no_leidas
     FROM notificaciones
     WHERE user_id = ?`,
    [userId]
  );

  return {
    data: filas.map((fila) => ({ ...fila, leida: Boolean(fila.leida) })),
    total: Number(contador[0].total) || 0,
    noLeidas: Number(contador[0].no_leidas) || 0,
  };
}

/** Cuenta las notificaciones no leídas de un usuario. */
export async function contarNoLeidas(userId) {
  const [filas] = await pool.execute(
    `SELECT COUNT(*) AS no_leidas
     FROM notificaciones
     WHERE user_id = ? AND leida = 0`,
    [userId]
  );
  return Number(filas[0].no_leidas) || 0;
}

/** Marca una notificación como leída (solo si pertenece al usuario). */
export async function marcarLeida({ userId, id }) {
  const [resultado] = await pool.execute(
    'UPDATE notificaciones SET leida = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return resultado.affectedRows > 0;
}

/** Marca todas las notificaciones de un usuario como leídas. */
export async function marcarTodasLeidas(userId) {
  await pool.execute(
    'UPDATE notificaciones SET leida = 1 WHERE user_id = ? AND leida = 0',
    [userId]
  );
}