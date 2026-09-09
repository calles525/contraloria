import {
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} from '../services/notificaciones.service.js';

/** GET /notificaciones -> notificaciones recientes y conteo de no leídas. */
export async function listar(req, res, next) {
  try {
    const resultado = await listarNotificaciones({
      userId: req.user.id,
      limite: req.query.limite,
    });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

/** GET /notificaciones/no-leidas -> solo el total de no leídas (para el badge). */
export async function noLeidas(req, res, next) {
  try {
    const total = await contarNoLeidas(req.user.id);
    res.json({ noLeidas: total });
  } catch (error) {
    next(error);
  }
}

/** POST /notificaciones/leer-todas -> marca todas las notificaciones como leídas. */
export async function leerTodas(req, res, next) {
  try {
    await marcarTodasLeidas(req.user.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

/** POST /notificaciones/:id/leida -> marca una notificación como leída. */
export async function marcarUnaLeida(req, res, next) {
  try {
    const marcada = await marcarLeida({ userId: req.user.id, id: Number(req.params.id) });
    if (!marcada) {
      return res.status(404).json({ message: 'Notificación no encontrada.' });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export const notificacionesController = { listar, noLeidas, leerTodas, marcarUnaLeida };