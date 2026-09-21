import { pool } from '../config/db.js';

/**
 * Servicio de mensajes de WhatsApp a través de la API de Evolution.
 * Todos los envíos son no bloqueantes: si la configuración no existe, el
 * número no es válido o la API falla, se registra en consola y la operación
 * principal (solicitud, notificación, etc.) continúa sin errores.
 */

const PREFIJO_PAIS = '58'; // Venezuela

/** Devuelve la configuración activa de Evolution (null si no existe). */
export async function obtenerConfiguracionEvolution() {
  const [filas] = await pool.execute(
    'SELECT id, url_api, instancia, api_key, activo, updated_at FROM evolution_configuraciones LIMIT 1'
  );
  if (filas.length === 0) return null;
  const configuracion = filas[0];
  return {
    id: configuracion.id,
    url_api: configuracion.url_api,
    instancia: configuracion.instancia,
    api_key: configuracion.api_key,
    activo: Boolean(configuracion.activo),
    updated_at: configuracion.updated_at,
  };
}

/**
 * Normaliza un teléfono a formato internacional E.164.
 * Ejemplos: "04245283266" -> "584245283266", "+58 424-5283266" -> "584245283266".
 * Devuelve null si el número no es válido.
 */
export function normalizarTelefono(telefono) {
  if (!telefono) return null;

  let numero = String(telefono)
    .replace(/[^\d+]/g, '')
    .trim();

  if (numero.startsWith('+')) numero = numero.slice(1);
  if (numero.startsWith('00')) numero = numero.slice(2);

  // Si empieza con 0 (formato local venezolano 0412...) se quita el 0.
  if (numero.startsWith('0')) numero = numero.slice(1);

  // Si aún no tiene código de país, se agrega el de Venezuela.
  if (!numero.startsWith(PREFIJO_PAIS)) numero = `${PREFIJO_PAIS}${numero}`;

  // Teléfono internacional válido: 10 a 15 dígitos.
  if (!/^\d{10,15}$/.test(numero)) return null;

  return numero;
}

/**
 * Envía un mensaje de texto por WhatsApp usando la instancia configurada.
 * Nunca lanza excepciones hacia la operación que la invoca.
 *
 * @param {object} datos { telefono, texto }
 */
export async function enviarMensajeWhatsApp({ telefono, texto }) {
  try {
    const configuracion = await obtenerConfiguracionEvolution();
    if (!configuracion || !configuracion.activo) {
      console.warn('WhatsApp: no hay configuración de Evolution activa, se omite el envío.');
      return false;
    }

    const numero = normalizarTelefono(telefono);
    if (!numero) {
      console.warn(`WhatsApp: número de teléfono no válido (${telefono}), se omite el envío.`);
      return false;
    }

    const urlBase = configuracion.url_api.trim().replace(/\/+$/, '');
    const encabezados = { 'Content-Type': 'application/json' };
    if (configuracion.api_key) {
      encabezados.apikey = configuracion.api_key;
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 15000);

    const respuesta = await fetch(
      `${urlBase}/message/sendText/${encodeURIComponent(configuracion.instancia)}`,
      {
        method: 'POST',
        headers: encabezados,
        body: JSON.stringify({ number: numero, text: String(texto).slice(0, 4000) }),
        signal: controlador.signal,
      }
    );
    clearTimeout(temporizador);

    if (!respuesta.ok) {
      const cuerpo = await respuesta.text().catch(() => '');
      console.error(
        `WhatsApp: la API de Evolution respondió ${respuesta.status} para ${numero}: ${cuerpo.slice(0, 300)}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('WhatsApp: no se pudo enviar el mensaje:', error.message);
    return false;
  }
}

/**
 * Envía un mensaje a los usuarios asignados como destinatarios de WhatsApp
 * del departamento indicado. Por defecto no incluye al usuario que origina la
 * acción, salvo que este sea el único destinatario activo del departamento
 * (si se excluyera, nadie recibiría el aviso).
 *
 * @param {object} datos { departmentId, mensaje, origenUserId }
 */
export async function enviarWhatsAppADestinatariosDepartamento({
  departmentId,
  mensaje,
  origenUserId = null,
}) {
  try {
    if (!departmentId) return 0;

    const [filas] = await pool.execute(
      `SELECT u.id, u.username, p.phone
       FROM notificacion_departamento_usuarios ndu
       JOIN users u ON u.id = ndu.user_id
       JOIN persons p ON p.id = u.person_id
       WHERE ndu.department_id = ? AND ndu.is_active = 1 AND u.is_active = 1`,
      [departmentId]
    );

    if (filas.length === 0) return 0;

    const origenId = origenUserId ? Number(origenUserId) : null;
    const esUnicoDestinatario =
      origenId && filas.length === 1 && Number(filas[0].id) === origenId;
    const destinatarios = esUnicoDestinatario
      ? filas
      : filas.filter((usuario) => !origenId || Number(usuario.id) !== origenId);

    if (destinatarios.length === 0) return 0;

    const resultados = await Promise.allSettled(
      destinatarios.map((usuario) => enviarMensajeWhatsApp({ telefono: usuario.phone, texto: mensaje }))
    );

    return resultados.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  } catch (error) {
    console.error('WhatsApp: no se pudieron notificar los destinatarios del departamento:', error.message);
    return 0;
  }
}

/**
 * Envía un mensaje de WhatsApp a la persona que realizó una solicitud,
 * usando el teléfono registrado en su ficha (persons.phone).
 *
 * @param {object} datos { userId, mensaje }
 */
export async function enviarWhatsAppASolicitante({ userId, mensaje }) {
  try {
    if (!userId) return false;

    const [filas] = await pool.execute(
      `SELECT p.phone
       FROM users u
       JOIN persons p ON p.id = u.person_id
       WHERE u.id = ?`,
      [userId]
    );

    if (filas.length === 0 || !filas[0].phone) {
      console.warn(`WhatsApp: el usuario ${userId} no tiene teléfono registrado.`);
      return false;
    }

    return enviarMensajeWhatsApp({ telefono: filas[0].phone, texto: mensaje });
  } catch (error) {
    console.error('WhatsApp: no se pudo notificar al solicitante:', error.message);
    return false;
  }
}