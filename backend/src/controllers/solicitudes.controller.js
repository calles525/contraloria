import {
  listarSolicitudes,
  obtenerSolicitud,
  crearSolicitud,
  actualizarSolicitud,
  eliminarSolicitud,
  procesarSolicitud,
  regresarSolicitud,
  rechazarSolicitud,
  validarSolicitud,
  agregarNotaSolicitud,
  adjuntarArchivoRequerimiento,
  obtenerArchivoRequerimiento,
  quitarArchivoRequerimiento,
} from '../services/solicitudes.service.js';
import { registrarBitacora } from '../services/bitacora.service.js';
import { notificarActividadSolicitudes } from '../services/notificaciones.service.js';

/** Registra en bitácora y notifica un cambio de estado de una solicitud. */
async function registrarEstadoSolicitud({ req, solicitud, accion, verbo }) {
  if (!solicitud) return;
  const numero = solicitud.numero || `#${solicitud.id}`;
  await registrarBitacora({
    usuarioId: req.user.id,
    modulo: 'solicitudes',
    accion,
    descripcion: `${verbo} la solicitud ${numero}.`,
    detalle: { solicitud_id: solicitud.id, numero: solicitud.numero, estado: solicitud.estado },
    ip: req.ip,
  });
  await notificarActividadSolicitudes({
    tipo: 'solicitud_estado',
    titulo: `Solicitud ${numero}`,
    mensaje: `La solicitud ${numero} quedó en estado "${solicitud.estado}" por ${req.user.username}.`,
    origenUserId: req.user.id,
  });
}

async function listar(req, res, next) {
  try {
    const solicitudes = await listarSolicitudes(req.query, req.user.id);
    res.json({ data: solicitudes });
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const solicitud = await obtenerSolicitud(Number(req.params.id), {
      soloDepartamento: req.query.solo_departamento === '1',
      userId: req.user.id,
    });
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }
    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const solicitud = await crearSolicitud(req.body || {}, req.user.id);

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'crear',
      descripcion: `Creó la solicitud ${solicitud.numero}.`,
      detalle: { solicitud_id: solicitud.id, numero: solicitud.numero, categoria: solicitud.categoria },
      ip: req.ip,
    });

    notificarActividadSolicitudes({
      tipo: 'solicitud_creada',
      titulo: `Solicitud ${solicitud.numero}`,
      mensaje: `Se creó la solicitud ${solicitud.numero} (${solicitud.categoria}) por ${req.user.username}.`,
      origenUserId: req.user.id,
    });

    res.status(201).json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const solicitud = await actualizarSolicitud(Number(req.params.id), req.body || {}, req.user.id);

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'actualizar',
      descripcion: `Actualizó la solicitud ${solicitud.numero}.`,
      detalle: { solicitud_id: solicitud.id, numero: solicitud.numero },
      ip: req.ip,
    });

    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const solicitud = await obtenerSolicitud(Number(req.params.id));
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    await eliminarSolicitud(Number(req.params.id));

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'eliminar',
      descripcion: `Eliminó la solicitud ${solicitud.numero}.`,
      detalle: { solicitud_id: solicitud.id, numero: solicitud.numero },
      ip: req.ip,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function procesar(req, res, next) {
  try {
    const solicitud = await procesarSolicitud(
      Number(req.params.id),
      req.user.id,
      req.body?.nota
    );
    await registrarEstadoSolicitud({ req, solicitud, accion: 'procesar', verbo: 'Procesó' });
    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function regresar(req, res, next) {
  try {
    const solicitud = await regresarSolicitud(
      Number(req.params.id),
      req.user.id,
      req.body?.nota
    );
    await registrarEstadoSolicitud({ req, solicitud, accion: 'regresar', verbo: 'Devolvió' });
    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function rechazar(req, res, next) {
  try {
    const solicitud = await rechazarSolicitud(
      Number(req.params.id),
      req.user.id,
      req.body?.nota
    );
    await registrarEstadoSolicitud({ req, solicitud, accion: 'rechazar', verbo: 'Rechazó' });
    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function validar(req, res, next) {
  try {
    const solicitud = await validarSolicitud(
      Number(req.params.id),
      req.user.id,
      req.body?.nota
    );
    await registrarEstadoSolicitud({ req, solicitud, accion: 'validar', verbo: 'Validó' });
    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function agregarNota(req, res, next) {
  try {
    const solicitud = await agregarNotaSolicitud(
      Number(req.params.id),
      req.user.id,
      req.body?.nota
    );

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'nota',
      descripcion: `Agregó una nota a la solicitud ${solicitud.numero}.`,
      detalle: { solicitud_id: solicitud.id, numero: solicitud.numero },
      ip: req.ip,
    });

    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function subirArchivo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debe adjuntar un archivo.' });
    }
    const solicitud = await adjuntarArchivoRequerimiento(
      Number(req.params.id),
      Number(req.params.requerimientoId),
      req.file
    );

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'adjuntar',
      descripcion: `Adjuntó el documento "${req.file.originalname}" a la solicitud ${solicitud.numero}.`,
      detalle: {
        solicitud_id: solicitud.id,
        numero: solicitud.numero,
        archivo: req.file.originalname,
      },
      ip: req.ip,
    });

    notificarActividadSolicitudes({
      tipo: 'solicitud_archivo',
      titulo: `Documento adjuntado`,
      mensaje: `Se adjuntó "${req.file.originalname}" a la solicitud ${solicitud.numero} por ${req.user.username}.`,
      origenUserId: req.user.id,
    });

    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function descargarArchivo(req, res, next) {
  try {
    const archivo = await obtenerArchivoRequerimiento(
      Number(req.params.id),
      Number(req.params.requerimientoId)
    );
    if (!archivo) {
      return res.status(404).json({ message: 'La solicitud no tiene archivo adjunto.' });
    }

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'descargar',
      descripcion: `Descargó el documento "${archivo.nombre}" de la solicitud #${req.params.id}.`,
      detalle: { solicitud_id: Number(req.params.id), archivo: archivo.nombre },
      ip: req.ip,
    });

    res.download(archivo.ruta, archivo.nombre);
  } catch (error) {
    next(error);
  }
}

async function quitarArchivo(req, res, next) {
  try {
    const solicitud = await quitarArchivoRequerimiento(
      Number(req.params.id),
      Number(req.params.requerimientoId)
    );

    registrarBitacora({
      usuarioId: req.user.id,
      modulo: 'solicitudes',
      accion: 'quitar',
      descripcion: `Quitó un documento adjunto de la solicitud ${solicitud.numero}.`,
      detalle: { solicitud_id: solicitud.id, numero: solicitud.numero },
      ip: req.ip,
    });

    res.json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

export const solicitudesController = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  procesar,
  regresar,
  rechazar,
  validar,
  agregarNota,
  subirArchivo,
  descargarArchivo,
  quitarArchivo,
};