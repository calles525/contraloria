import { pool, query } from '../config/db.js';
import { crearError } from '../middlewares/error.middleware.js';
import { obtenerConfiguracionEvolution } from '../services/whatsapp.service.js';
import { registrarBitacora } from '../services/bitacora.service.js';

async function obtenerConfiguracion(req, res, next) {
  try {
    const configuracion = await obtenerConfiguracionEvolution();
    res.json({ data: configuracion });
  } catch (error) {
    next(error);
  }
}

async function guardarConfiguracion(req, res, next) {
  try {
    const configuracion = req.body ?? {};

    const urlApi = String(configuracion.url_api || '').trim();
    const instancia = String(configuracion.instancia || '').trim();

    if (!urlApi) {
      throw crearError(400, 'La URL de la API de Evolution es obligatoria.');
    }
    if (!/^https?:\/\/.+/.test(urlApi)) {
      throw crearError(400, 'La URL de la API debe empezar por http:// o https://.');
    }
    if (!instancia) {
      throw crearError(400, 'El nombre de la instancia es obligatorio.');
    }

    let apiKey = null;
    if (configuracion.api_key !== undefined && configuracion.api_key !== null) {
      apiKey = String(configuracion.api_key).trim() || null;
    }

    const activo = configuracion.activo === undefined ? true : Boolean(configuracion.activo);

    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      // Solo existe una fila: se reemplaza la configuración actual.
      await conexion.execute('DELETE FROM evolution_configuraciones');
      const [resultado] = await conexion.execute(
        `INSERT INTO evolution_configuraciones (url_api, instancia, api_key, activo)
         VALUES (?, ?, ?, ?)`,
        [urlApi, instancia, apiKey, activo ? 1 : 0]
      );
      await conexion.commit();

      registrarBitacora({
        usuarioId: req.user.id,
        modulo: 'notificaciones',
        accion: 'configurar_evolution',
        descripcion: `Configuró la API de Evolution (instancia "${instancia}", activa: ${activo}).`,
        ip: req.ip,
      });

      res.json({
        data: {
          id: Number(resultado.insertId),
          url_api: urlApi,
          instancia,
          api_key: apiKey,
          activo,
        },
      });
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  } catch (error) {
    next(error);
  }
}

/** Lista los departamentos activos y los usuarios de cada uno con su estado de destinatario. */
async function listarDepartamentos(req, res, next) {
  try {
    const departamentos = await query(
      `SELECT id, name, company_id FROM departments WHERE is_active = 1 ORDER BY name ASC`
    );

    const usuarios = await query(
      `SELECT e.department_id, u.id AS user_id, u.username, p.phone,
              CONCAT(p.first_name, ' ', p.last_name) AS user_name,
              EXISTS (
                SELECT 1 FROM notificacion_departamento_usuarios ndu
                WHERE ndu.department_id = e.department_id
                  AND ndu.user_id = u.id AND ndu.is_active = 1
              ) AS asignado
       FROM employees e
       JOIN users u ON u.person_id = e.person_id
       JOIN persons p ON p.id = u.person_id
       WHERE u.is_active = 1
       ORDER BY p.last_name ASC, p.first_name ASC`
    );

    const grupoUsuarios = new Map();
    for (const usuario of usuarios) {
      const lista = grupoUsuarios.get(usuario.department_id) ?? [];
      lista.push({
        user_id: Number(usuario.user_id),
        username: usuario.username,
        user_name: usuario.user_name,
        phone: usuario.phone,
        asignado: Boolean(usuario.asignado),
      });
      grupoUsuarios.set(usuario.department_id, lista);
    }

    const data = departamentos.map((departamento) => ({
      id: Number(departamento.id),
      name: departamento.name,
      company_id: departamento.company_id,
      usuarios: grupoUsuarios.get(departamento.id) ?? [],
    }));

    res.json({ data });
  } catch (error) {
    next(error);
  }
}

/** Reemplaza los destinatarios de WhatsApp del departamento indicado. */
async function guardarUsuariosDepartamento(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    if (!Number.isInteger(departmentId)) {
      throw crearError(400, 'Id de departamento inválido.');
    }

    const departamento = await query(
      'SELECT id, name FROM departments WHERE id = ? AND is_active = 1',
      [departmentId]
    );
    if (departamento.length === 0) {
      throw crearError(404, 'Departamento no encontrado.');
    }

    const entrada = Array.isArray(req.body?.user_ids) ? req.body.user_ids : [];
    const idsEntrada = [...new Set(entrada.map(Number))].filter(Number.isInteger);

    // Cada destinatario debe ser un usuario activo que trabaje en el departamento.
    if (idsEntrada.length > 0) {
      const marcadores = idsEntrada.map(() => '?').join(', ');
      const validos = await query(
        `SELECT u.id
         FROM users u
         JOIN employees e ON e.person_id = u.person_id
         WHERE u.is_active = 1 AND e.department_id = ? AND u.id IN (${marcadores})`,
        [departmentId, ...idsEntrada]
      );
      const idsValidos = new Set(validos.map((v) => Number(v.id)));
      const invalidos = idsEntrada.filter((id) => !idsValidos.has(id));
      if (invalidos.length > 0) {
        throw crearError(
          400,
          `Algunos usuarios no pertenecen al departamento o no están activos: ${invalidos.join(', ')}`
        );
      }
    }

    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      await conexion.execute(
        'DELETE FROM notificacion_departamento_usuarios WHERE department_id = ?',
        [departmentId]
      );
      if (idsEntrada.length > 0) {
        await conexion.query(
          `INSERT INTO notificacion_departamento_usuarios (department_id, user_id, created_by)
           VALUES ?`,
          [idsEntrada.map((userId) => [departmentId, userId, req.user.id])]
        );
      }
      await conexion.commit();

      registrarBitacora({
        usuarioId: req.user.id,
        modulo: 'notificaciones',
        accion: 'asignar_destinatarios',
        descripcion: `Asignó ${idsEntrada.length} destinatario(s) de WhatsApp al departamento "${departamento[0].name}".`,
        detalle: { department_id: departmentId, user_ids: idsEntrada },
        ip: req.ip,
      });

      res.json({ data: { department_id: departmentId, user_ids: idsEntrada } });
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  } catch (error) {
    next(error);
  }
}

export const notificacionesWhatsappController = {
  obtenerConfiguracion,
  guardarConfiguracion,
  listarDepartamentos,
  guardarUsuariosDepartamento,
};