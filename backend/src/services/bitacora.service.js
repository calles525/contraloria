import { pool } from '../config/db.js';

/**
 * Registra una acción del usuario en la bitácora de auditoría.
 * Si el registro falla se registra en consola, sin interrumpir la operación principal.
 *
 * @param {object} datos { usuarioId, modulo, accion, descripcion, detalle, ip }
 */
export async function registrarBitacora({
  usuarioId,
  modulo,
  accion,
  descripcion,
  detalle = null,
  ip = null,
}) {
  try {
    await pool.execute(
      `INSERT INTO bitacora (user_id, modulo, accion, descripcion, detalle, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        modulo,
        accion,
        descripcion,
        detalle !== null && detalle !== undefined ? JSON.stringify(detalle) : null,
        ip || null,
      ]
    );
  } catch (error) {
    console.error('No se pudo registrar en la bitácora:', error.message);
  }
}

/**
 * Lista la bitácora con filtros y paginación.
 *
 * @param {object} filtros { usuario_id, modulo, desde, hasta, q, pagina, limite }
 */
export async function listarBitacora(filtros = {}) {
  const condiciones = [];
  const params = [];

  if (filtros.usuario_id) {
    condiciones.push('b.user_id = ?');
    params.push(filtros.usuario_id);
  }
  if (filtros.modulo) {
    condiciones.push('b.modulo = ?');
    params.push(filtros.modulo);
  }
  if (filtros.desde) {
    condiciones.push('DATE(b.created_at) >= ?');
    params.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('DATE(b.created_at) <= ?');
    params.push(filtros.hasta);
  }
  if (filtros.q) {
    condiciones.push('(b.descripcion LIKE ? OR b.accion LIKE ?)');
    params.push(`%${filtros.q}%`, `%${filtros.q}%`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const pagina = Math.max(1, Number(filtros.pagina) || 1);
  const limite = Math.min(100, Math.max(1, Number(filtros.limite) || 25));
  const offset = (pagina - 1) * limite;

  const [filas] = await pool.execute(
    `SELECT b.id, b.modulo, b.accion, b.descripcion, b.detalle, b.ip, b.created_at,
            u.username,
            CONCAT(p.first_name, ' ', p.last_name) AS usuario_nombre
     FROM bitacora b
     JOIN users u ON u.id = b.user_id
     JOIN persons p ON p.id = u.person_id
     ${where}
     ORDER BY b.created_at DESC, b.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  const [contador] = await pool.execute(
    `SELECT COUNT(*) AS total FROM bitacora b ${where}`,
    params
  );

  const data = filas.map((fila) => {
    let detalle = null;
    if (fila.detalle) {
      try {
        detalle = typeof fila.detalle === 'string' ? JSON.parse(fila.detalle) : fila.detalle;
      } catch {
        detalle = null;
      }
    }
    return { ...fila, detalle };
  });

  return {
    data,
    total: Number(contador[0].total) || 0,
    pagina,
    limite,
  };
}

/** Devuelve los usuarios con actividad y los módulos existentes para los filtros. */
export async function obtenerOpcionesBitacora() {
  const [usuarios] = await pool.execute(
    `SELECT DISTINCT b.user_id AS id,
            CONCAT(p.first_name, ' ', p.last_name) AS nombre
     FROM bitacora b
     JOIN users u ON u.id = b.user_id
     JOIN persons p ON p.id = u.person_id
     ORDER BY nombre ASC`
  );

  const [modulos] = await pool.execute(
    `SELECT DISTINCT modulo FROM bitacora ORDER BY modulo ASC`
  );

  return {
    usuarios: usuarios.map((u) => ({ id: u.id, nombre: u.nombre })),
    modulos: modulos.map((m) => m.modulo),
  };
}