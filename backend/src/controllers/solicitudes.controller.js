import {
  listarSolicitudes,
  obtenerSolicitud,
  crearSolicitud,
  actualizarSolicitud,
  eliminarSolicitud,
  procesarSolicitud,
  regresarSolicitud,
  reenviarSolicitud,
  validarSolicitud,
  agregarNotaSolicitud,
  adjuntarArchivoRequerimiento,
  obtenerArchivoRequerimiento,
  quitarArchivoRequerimiento,
  obtenerResumenDashboard,
} from '../services/solicitudes.service.js';
import { registrarBitacora } from '../services/bitacora.service.js';
import { notificarActividadSolicitudes } from '../services/notificaciones.service.js';
import {
  enviarWhatsAppADestinatariosDepartamento,
  enviarWhatsAppASolicitante,
} from '../services/whatsapp.service.js';

/**
 * Desempaqueta la petición de crear/actualizar una solicitud.
 * Admite dos formatos:
 *  - JSON puro (sin archivos): el cuerpo ES el objeto de la solicitud.
 *  - multipart (con archivos): el JSON viaja en el campo "datos", la lista de
 *    nombres de requerimientos con archivo en "nombres_archivos" y los
 *    archivos en el campo "archivos" (en el mismo orden).
 */
function extraerSolicitudYArchivos(req) {
  const cuerpo = req.body || {};

  if (typeof cuerpo.datos === 'string') {
    const nombres = JSON.parse(cuerpo.nombres_archivos || '[]');
    const archivos = (Array.isArray(nombres) ? nombres : [])
      .map((nombre, indice) => ({ nombre, archivo: req.files?.[indice] }))
      .filter((item) => item.archivo);
    return { datos: JSON.parse(cuerpo.datos || '{}'), archivos };
  }

  return { datos: cuerpo, archivos: [] };
}

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
    departmentId: solicitud.department_id ?? null,
  });

  // Aviso por WhatsApp a la persona que realizó la solicitud.
  notificarWhatsAppSolicitante({ req, solicitud, accion });
}

const MENSAJES_WHATSAPP_POR_ACCION = {
  procesar: 'está EN PROCESO y será atendida por el departamento correspondiente.',
  regresar: 'fue DEVUELTA. Revise las observaciones y realice los ajustes necesarios.',
  validar: 'fue VALIDADA correctamente.',
};

/** Avisa por WhatsApp a quien realizó la solicitud cuando cambia su estado. */
function notificarWhatsAppSolicitante({ req, solicitud, accion }) {
  const texto = MENSAJES_WHATSAPP_POR_ACCION[accion];
  if (!texto || !solicitud.solicitante_user_id) return;
  const numero = solicitud.numero || `#${solicitud.id}`;
  enviarWhatsAppASolicitante({
    userId: solicitud.solicitante_user_id,
    mensaje: `Hola ${solicitud.solicitante_nombre}. Su solicitud ${numero} (${solicitud.categoria}) ${texto}`,
  });
}

/** Avisa por WhatsApp a los destinatarios configurados del departamento destino. */
function notificarWhatsAppDepartamento({ req, solicitud, mensaje }) {
  if (!solicitud.department_id) return;
  const numero = solicitud.numero || `#${solicitud.id}`;
  enviarWhatsAppADestinatariosDepartamento({
    departmentId: solicitud.department_id,
    origenUserId: req.user.id,
    mensaje:
      mensaje ||
      `Nueva solicitud ${numero} (${solicitud.categoria}) creada por ${req.user.username}. Queda pendiente de gestión en su departamento.`,
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

async function resumen(req, res, next) {
  try {
    const resumen = await obtenerResumenDashboard(req.query);
    res.json({ data: resumen });
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
    const { datos, archivos } = extraerSolicitudYArchivos(req);
    const solicitud = await crearSolicitud(datos, req.user.id, archivos);

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
      departmentId: solicitud.department_id ?? null,
    });

    // Aviso por WhatsApp a los destinatarios del departamento destino.
    notificarWhatsAppDepartamento({ req, solicitud });

    res.status(201).json({ data: solicitud });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { datos, archivos } = extraerSolicitudYArchivos(req);
    const solicitud = await actualizarSolicitud(Number(req.params.id), datos, req.user.id, archivos);

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

    // Se avisa por WhatsApp a los destinatarios del departamento destino:
    // la solicitud quedó en proceso y será gestionada.
    notificarWhatsAppDepartamento({
      req,
      solicitud,
      mensaje: `La solicitud ${solicitud.numero || `#${solicitud.id}`} (${solicitud.categoria}) fue puesta EN PROCESO por ${req.user.username}. Queda para gestión en su departamento.`,
    });

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

async function reenviar(req, res, next) {
  try {
    const solicitud = await reenviarSolicitud(
      Number(req.params.id),
      req.user.id,
      req.body?.nota
    );
    await registrarEstadoSolicitud({ req, solicitud, accion: 'reenviar', verbo: 'Reenvió' });

    // Se avisa por WhatsApp al departamento destino: la solicitud volvió a quedar pendiente.
    notificarWhatsAppDepartamento({
      req,
      solicitud,
      mensaje: `La solicitud ${solicitud.numero || `#${solicitud.id}`} fue reenviada por ${req.user.username} y quedó PENDIENTE de gestión en su departamento.`,
    });

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
      departmentId: solicitud.department_id ?? null,
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
  resumen,
  crear,
  actualizar,
  eliminar,
  procesar,
  regresar,
  reenviar,
  validar,
  agregarNota,
  subirArchivo,
  descargarArchivo,
  quitarArchivo,
};