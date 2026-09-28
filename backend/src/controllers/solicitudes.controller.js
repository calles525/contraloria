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
  obtenerDepartamentoOrigenSolicitud,
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
}

/** Pie común de los avisos de WhatsApp. */
const PIE_MENSAJE = 'Sistema de/Controloría';

/**
 * Saluda según la hora del día para que el aviso no diga "Buenos días" a las
 * nueve de la noche.
 */
function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Avisa por WhatsApp a los asignados del departamento DESTINO cuando entra una
 * solicitud nueva o reenviada. El mensaje menciona solo al departamento que
 * envía la solicitud, nunca a la persona.
 */
async function notificarWhatsAppDestino({ solicitud, esReenvio = false }) {
  try {
    if (!solicitud.department_id) return;

    const origen = await obtenerDepartamentoOrigenSolicitud(solicitud.solicitante_user_id);
    const nombre = origen?.nombre ?? 'Un departamento';
    const numero = solicitud.numero || `#${solicitud.id}`;
    const categoria = solicitud.categoria || 'sin categoría';

    const mensaje = esReenvio
      ? `${saludoSegunHora()}.

El departamento ${nombre} ha reenviado la solicitud ${numero} (${categoria}) y la envía nuevamente a su departamento para que sea procesada y gestionada.

Le agradecemos su atención y quedamos atentos a sus comentarios.

${PIE_MENSAJE}`
      : `${saludoSegunHora()}.

El departamento ${nombre} ha creado la solicitud ${numero} (${categoria}) y la envía a su departamento para que sea procesada y gestionada.

Le agradecemos su atención y quedamos atentos a sus comentarios.

${PIE_MENSAJE}`;

    enviarWhatsAppADestinatariosDepartamento({
      departmentId: solicitud.department_id,
      mensaje,
    });
  } catch (error) {
    console.error('WhatsApp: no se pudo avisar al departamento destino:', error.message);
  }
}

/**
 * Avisa por WhatsApp a los asignados del departamento de ORIGIN cuando su
 * solicitud queda lista o le es devuelta.
 */
async function notificarWhatsAppOrigen({ solicitud, accion }) {
  try {
    if (accion !== 'validar' && accion !== 'regresar') return;

    const origen = await obtenerDepartamentoOrigenSolicitud(solicitud.solicitante_user_id);
    if (!origen) return;

    const numero = solicitud.numero || `#${solicitud.id}`;

    const mensaje =
      accion === 'validar'
        ? `${saludoSegunHora()}.

La solicitud ${numero} ha sido validada y se encuentra lista.

Agradecemos su seguimiento. Para cualquier duda, puede comunicarse con este departamento.

${PIE_MENSAJE}`
        : `${saludoSegunHora()}.

La solicitud ${numero} ha sido devuelta para su corrección.

Le rogamos revisar las observaciones e ingresar los ajustes solicitados.

Agradecemos su atención.

${PIE_MENSAJE}`;

    enviarWhatsAppADestinatariosDepartamento({
      departmentId: origen.id,
      mensaje,
    });
  } catch (error) {
    console.error('WhatsApp: no se pudo avisar al departamento de origen:', error.message);
  }
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
    notificarWhatsAppDestino({ solicitud });

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

    // Se avisa por WhatsApp a los asignados del departamento de origen.
    notificarWhatsAppOrigen({ solicitud, accion: 'regresar' });

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
    notificarWhatsAppDestino({ solicitud, esReenvio: true });

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

    // Se avisa por WhatsApp a los asignados del departamento de origen.
    notificarWhatsAppOrigen({ solicitud, accion: 'validar' });

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