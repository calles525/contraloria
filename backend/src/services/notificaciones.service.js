import { pool } from '../config/db.js';

/**
 * Crea una notificación para cada usuario activo con permiso de solicitudes.
 * Si la generación falla se registra en consola, sin interrumpir la operación principal.
 *
 * @param {object} datos { tipo, titulo, mensaje, origenUserId }
 */
export async function notificarActividadSolicitudes({
  tipo,
  titulo,
  mensaje,
  origenUserId = null,
}) {
  try {
    const [destinatarios] = await pool.execute(
      `SELECT DISTINCT u.id
       FROM users u
       JOIN user_permissions up ON up.user_id = u.id
       JOIN permissions p ON p.id = up.permission_id
       WHERE u.is_active = 1 AND p.code = 'solicitudes'`
    );

    if (destinatarios.length === 0) return;

    const valores = destinatarios.map((destinatario) => [
      destinatario.id,
      tipo,
      titulo,
      mensaje,
      origenUserId,
    ]);

    await pool.query(
      'INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, origen_user_id) VALUES ?',
      [valores]
    );
  } catch (error) {
    console.error('No se pudo crear la notificación:', error.message);
  }
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