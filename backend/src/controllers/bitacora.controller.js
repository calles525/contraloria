import { listarBitacora, obtenerOpcionesBitacora } from '../services/bitacora.service.js';

/** GET /bitacora -> listado paginado y filtrado de la bitácora. */
export async function listar(req, res, next) {
  try {
    const resultado = await listarBitacora({
      usuario_id: req.query.usuario_id,
      modulo: req.query.modulo,
      desde: req.query.desde,
      hasta: req.query.hasta,
      q: req.query.q,
      pagina: req.query.pagina,
      limite: req.query.limite,
    });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

/** GET /bitacora/opciones -> usuarios con actividad y módulos para los filtros. */
export async function opciones(req, res, next) {
  try {
    const opciones = await obtenerOpcionesBitacora();
    res.json(opciones);
  } catch (error) {
    next(error);
  }
}

export const bitacoraController = { listar, opciones };