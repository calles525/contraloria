import { query } from '../config/db.js';
import { crearError } from './error.middleware.js';

/**
 * Middleware que exige que el usuario autenticado tenga al menos uno de los
 * permisos indicados. Debe ubicarse después de `protegerRuta`.
 *
 * @param {...string} codigosPermitidos Códigos de permiso aceptados.
 */
export function requierePermiso(...codigosPermitidos) {
  return async (req, res, next) => {
    try {
      if (codigosPermitidos.length === 0) {
        return next();
      }

      const marcadores = codigosPermitidos.map(() => '?').join(', ');
      const filas = await query(
        `SELECT p.code
         FROM user_permissions up
         JOIN permissions p ON p.id = up.permission_id
         WHERE up.user_id = ? AND p.code IN (${marcadores}) AND p.is_active = 1`,
        [req.user.id, ...codigosPermitidos]
      );

      if (filas.length === 0) {
        return next(crearError(403, 'No tiene permisos para realizar esta acción.'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}