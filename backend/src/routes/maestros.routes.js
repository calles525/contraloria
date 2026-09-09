import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { protegerRuta } from '../middlewares/auth.middleware.js';
import { crearError } from '../middlewares/error.middleware.js';
import { crearControllerCrud } from '../controllers/crud.controller.js';
import { registrarBitacora } from '../services/bitacora.service.js';
import { pool, query } from '../config/db.js';

const router = Router();

// Todas las rutas de configuración requieren autenticación.
router.use(protegerRuta);

// ---------------------------------------------------------------------------
// Empresas
// ---------------------------------------------------------------------------
const empresas = crearControllerCrud({
  tabla: 'companies',
  alias: 'c',
  selectListado: `c.id, c.ruc, c.legal_name, c.trade_name, c.address, c.phone, c.email, c.created_at, c.updated_at`,
  orden: 'c.legal_name ASC',
  columnas: ['ruc', 'legal_name', 'trade_name', 'address', 'phone', 'email'],
  requeridos: ['ruc', 'legal_name'],
});

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------
const estados = crearControllerCrud({
  tabla: 'states',
  alias: 's',
  selectListado: `s.id, s.code, s.name, s.iso`,
  orden: 's.name ASC',
  columnas: ['code', 'name', 'iso'],
  requeridos: ['code', 'name'],
});

// ---------------------------------------------------------------------------
// Municipios (sociados a estados)
// ---------------------------------------------------------------------------
const municipios = crearControllerCrud({
  tabla: 'municipalities',
  alias: 'm',
  selectListado: `m.id, m.state_id, m.code, m.name, s.name AS state_name`,
  joins: `JOIN states s ON s.id = m.state_id`,
  filtros: { state_id: 'm.state_id' },
  orden: 'm.name ASC',
  columnas: ['state_id', 'code', 'name'],
  requeridos: ['state_id', 'name'],
});

// ---------------------------------------------------------------------------
// Ciudades (sociadas a municipios, que a su vez pertenecen a estados)
// ---------------------------------------------------------------------------
const ciudades = crearControllerCrud({
  tabla: 'cities',
  alias: 'ci',
  selectListado: `ci.id, ci.municipality_id, ci.code, ci.name,
                  m.name AS municipality_name, s.name AS state_name`,
  joins: `JOIN municipalities m ON m.id = ci.municipality_id
          JOIN states s ON s.id = m.state_id`,
  filtros: { municipality_id: 'ci.municipality_id', state_id: 'm.state_id' },
  orden: 'ci.name ASC',
  columnas: ['municipality_id', 'code', 'name'],
  requeridos: ['municipality_id', 'name'],
});

// ---------------------------------------------------------------------------
// Centros de costo (sociados a empresa y ubicación)
// ---------------------------------------------------------------------------
const centrosCosto = crearControllerCrud({
  tabla: 'cost_centers',
  alias: 'cc',
  selectListado: `cc.id, cc.company_id, cc.code, cc.name, cc.address, cc.phone, cc.email,
                  cc.state_id, cc.municipality_id, cc.city_id, cc.is_active,
                  e.legal_name AS company_name,
                  s.name AS state_name, m.name AS municipality_name, c.name AS city_name`,
  joins: `JOIN companies e ON e.id = cc.company_id
          LEFT JOIN states s ON s.id = cc.state_id
          LEFT JOIN municipalities m ON m.id = cc.municipality_id
          LEFT JOIN cities c ON c.id = cc.city_id`,
  filtros: { company_id: 'cc.company_id', state_id: 'cc.state_id' },
  orden: 'cc.name ASC',
  columnas: ['company_id', 'code', 'name', 'address', 'phone', 'email', 'state_id', 'municipality_id', 'city_id', 'is_active'],
  requeridos: ['company_id', 'name'],
  estadoActivo: true,
});

// ---------------------------------------------------------------------------
// Departamentos (sociados a empresa, centro de costo y persona encargada)
// ---------------------------------------------------------------------------
const departamentos = crearControllerCrud({
  tabla: 'departments',
  alias: 'd',
  selectListado: `d.id, d.company_id, d.cost_center_id, d.name, d.manager_person_id,
                  d.description, d.is_active,
                  e.legal_name AS company_name,
                  cc.name AS cost_center_name,
                  CONCAT(p.first_name, ' ', p.last_name) AS manager_name`,
  joins: `JOIN companies e ON e.id = d.company_id
          LEFT JOIN cost_centers cc ON cc.id = d.cost_center_id
          LEFT JOIN persons p ON p.id = d.manager_person_id`,
  filtros: { company_id: 'd.company_id', cost_center_id: 'd.cost_center_id' },
  orden: 'd.name ASC',
  columnas: ['company_id', 'cost_center_id', 'name', 'manager_person_id', 'description', 'is_active'],
  requeridos: ['company_id', 'name'],
  estadoActivo: true,
});

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------
const personas = crearControllerCrud({
  tabla: 'persons',
  alias: 'p',
  selectListado: `p.id, p.first_name, p.last_name, p.birth_date, p.phone, p.id_number, p.created_at`,
  orden: 'p.last_name ASC, p.first_name ASC',
  columnas: ['first_name', 'last_name', 'birth_date', 'phone', 'id_number'],
  requeridos: ['first_name', 'last_name', 'birth_date', 'id_number'],
});

// ---------------------------------------------------------------------------
// Usuarios (sociados a personas; la contraseña nunca se expone)
// ---------------------------------------------------------------------------
const usuarios = crearControllerCrud({
  tabla: 'users',
  alias: 'u',
  selectListado: `u.id, u.person_id, u.username, u.email, u.is_active, u.last_login_at, u.created_at,
                  CONCAT(p.first_name, ' ', p.last_name) AS person_name, p.id_number,
                  e.company_id, c.legal_name AS company_name,
                  e.cost_center_id, cc.name AS cost_center_name,
                  e.department_id, d.name AS department_name`,
  joins: `JOIN persons p ON p.id = u.person_id
          LEFT JOIN employees e ON e.person_id = p.id
          LEFT JOIN companies c ON c.id = e.company_id
          LEFT JOIN cost_centers cc ON cc.id = e.cost_center_id
          LEFT JOIN departments d ON d.id = e.department_id`,
  orden: 'u.username ASC',
  columnas: ['person_id', 'username', 'email', 'is_active'],
  requeridos: ['person_id', 'username', 'password'],
  estadoActivo: true,
  transformarCrear: async (datos, cuerpo) => {
    const hash = await hashearContrasena(cuerpo.password);
    return { ...datos, password_hash: hash };
  },
  transformarActualizar: async (datos, cuerpo) => {
    if (cuerpo.password) {
      return { ...datos, password_hash: await hashearContrasena(cuerpo.password) };
    }
    return datos;
  },
});

async function hashearContrasena(password) {
  if (!password || password.length < 6) {
    throw crearError(400, 'La contraseña debe tener al menos 6 caracteres.');
  }
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  return bcrypt.hash(password, saltRounds);
}

// ---------------------------------------------------------------------------
// Almacenes (asociados a empresa y persona encargada)
// ---------------------------------------------------------------------------
const almacenes = crearControllerCrud({
  tabla: 'warehouses',
  alias: 'w',
  selectListado: `w.id, w.company_id, w.code, w.name, w.address, w.phone,
                  w.manager_person_id, w.is_active, w.created_at, w.updated_at,
                  e.legal_name AS company_name,
                  CONCAT(p.first_name, ' ', p.last_name) AS manager_name`,
  joins: `JOIN companies e ON e.id = w.company_id
          LEFT JOIN persons p ON p.id = w.manager_person_id`,
  filtros: { company_id: 'w.company_id' },
  orden: 'w.name ASC',
  columnas: ['company_id', 'code', 'name', 'address', 'phone', 'manager_person_id', 'is_active'],
  requeridos: ['company_id', 'name'],
  estadoActivo: true,
});

// ---------------------------------------------------------------------------
// Permisos (catálogo de permisos del sistema)
// ---------------------------------------------------------------------------
const permisos = crearControllerCrud({
  tabla: 'permissions',
  alias: 'p',
  selectListado: `p.id, p.code, p.name, p.description, p.is_active, p.created_at`,
  orden: 'p.name ASC',
  columnas: ['code', 'name', 'description', 'is_active'],
  requeridos: ['code', 'name'],
  estadoActivo: true,
});

// ---------------------------------------------------------------------------
// Definición de rutas
// ---------------------------------------------------------------------------
function definirRutas(recurso, nombre) {
  router.get(`/${nombre}`, recurso.listar);
  router.get(`/${nombre}/:id`, recurso.obtener);
  router.post(`/${nombre}`, recurso.crear);
  router.put(`/${nombre}/:id`, recurso.actualizar);
  router.delete(`/${nombre}/:id`, recurso.eliminar);
  router.patch(`/${nombre}/:id/estado`, recurso.cambiarEstado);
}

definirRutas(empresas, 'companies');
definirRutas(estados, 'states');
definirRutas(municipios, 'municipalities');
definirRutas(ciudades, 'cities');
definirRutas(centrosCosto, 'cost-centers');
definirRutas(departamentos, 'departments');
definirRutas(personas, 'persons');
definirRutas(usuarios, 'users');
definirRutas(almacenes, 'warehouses');
definirRutas(permisos, 'permissions');

// ---------------------------------------------------------------------------
// Permisos de usuario (asignación de permisos a un usuario)
// ---------------------------------------------------------------------------

// GET /users/:id/permissions -> permisos otorgados al usuario
router.get('/users/:id/permissions', obtenerPermisosDeUsuario);

// PUT /users/:id/permissions -> reemplaza los permisos del usuario
router.put('/users/:id/permissions', reemplazarPermisosDeUsuario);

// GET /users/:id/ubicacion -> empresa, sede (centro de costo) y departamento del usuario
router.get('/users/:id/ubicacion', obtenerUbicacionDeUsuario);

// PUT /users/:id/ubicacion -> asigna/actualiza la ubicación del usuario en el organigrama
router.put('/users/:id/ubicacion', guardarUbicacionDeUsuario);

async function obtenerUbicacionDeUsuario(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      throw crearError(400, 'Id de usuario inválido.');
    }

    const filas = await query(
      `SELECT u.id, e.company_id, c.legal_name AS company,
              e.cost_center_id, cc.name AS cost_center,
              e.department_id, d.name AS department
       FROM users u
       JOIN persons p ON p.id = u.person_id
       LEFT JOIN employees e ON e.person_id = p.id
       LEFT JOIN companies c ON c.id = e.company_id
       LEFT JOIN cost_centers cc ON cc.id = e.cost_center_id
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE u.id = ?`,
      [userId]
    );

    if (filas.length === 0) {
      throw crearError(404, 'Usuario no encontrado.');
    }

    const f = filas[0];
    res.json({
      data: f.company_id
        ? {
            company_id: f.company_id,
            company: f.company,
            cost_center_id: f.cost_center_id,
            cost_center: f.cost_center,
            department_id: f.department_id,
            department: f.department,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

async function guardarUbicacionDeUsuario(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      throw crearError(400, 'Id de usuario inválido.');
    }

    const { company_id, cost_center_id, department_id } = req.body ?? {};

    // Sin valores: se retira la ubicación del usuario.
    if (!company_id && !cost_center_id && !department_id) {
      const usuario = await query('SELECT person_id FROM users WHERE id = ?', [userId]);
      if (usuario.length === 0) {
        throw crearError(404, 'Usuario no encontrado.');
      }
      await query('DELETE FROM employees WHERE person_id = ?', [usuario[0].person_id]);
      res.json({ data: null });
      return;
    }

    if (!Number.isInteger(Number(company_id)) || !Number.isInteger(Number(cost_center_id)) || !Number.isInteger(Number(department_id))) {
      throw crearError(400, 'Empresa, sede y departamento son obligatorios.');
    }

    const usuario = await query(
      `SELECT u.id, u.person_id FROM users u WHERE u.id = ?`,
      [userId]
    );
    if (usuario.length === 0) {
      throw crearError(404, 'Usuario no encontrado.');
    }
    const personId = usuario[0].person_id;

    // La sede debe pertenecer a la empresa seleccionada.
    const sede = await query(
      'SELECT id FROM cost_centers WHERE id = ? AND company_id = ?',
      [Number(cost_center_id), Number(company_id)]
    );
    if (sede.length === 0) {
      throw crearError(400, 'La sede seleccionada no pertenece a la empresa indicada.');
    }

    // El departamento debe pertenecer a la sede seleccionada.
    const departamento = await query(
      'SELECT id FROM departments WHERE id = ? AND cost_center_id = ?',
      [Number(department_id), Number(cost_center_id)]
    );
    if (departamento.length === 0) {
      throw crearError(400, 'El departamento seleccionado no pertenece a la sede indicada.');
    }

    await query(
      `INSERT INTO employees (person_id, company_id, cost_center_id, department_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         company_id = VALUES(company_id),
         cost_center_id = VALUES(cost_center_id),
         department_id = VALUES(department_id)`,
      [personId, Number(company_id), Number(cost_center_id), Number(department_id)]
    );

    // Auditoría del cambio de ubicación del empleado.
    registrarBitacora({
      usuarioId: userId,
      modulo: 'usuarios',
      accion: 'asignar_ubicacion',
      descripcion: `Asignó ubicación (empresa/sede/departamento) al usuario.`,
      ip: req.ip,
    });

    res.json({
      data: {
        company_id: Number(company_id),
        cost_center_id: Number(cost_center_id),
        department_id: Number(department_id),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerPermisosDeUsuario(req, res, next) {
  try {
    const filas = await query(
      `SELECT p.id, p.code, p.name
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = ?
       ORDER BY p.name ASC`,
      [req.params.id]
    );
    res.json({ data: filas });
  } catch (error) {
    next(error);
  }
}

async function reemplazarPermisosDeUsuario(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      throw crearError(400, 'Id de usuario inválido.');
    }

    const usuario = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (usuario.length === 0) {
      throw crearError(404, 'Usuario no encontrado.');
    }

    const idsEntrada = Array.isArray(req.body?.permission_ids)
      ? req.body.permission_ids.map(Number)
      : [];
    const ids = [...new Set(idsEntrada)].filter((id) => Number.isInteger(id));

    if (ids.length > 0) {
      const marcadores = ids.map(() => '?').join(', ');
      const permisosExistentes = await query(
        `SELECT id FROM permissions WHERE id IN (${marcadores})`,
        ids
      );
      const validos = new Set(permisosExistentes.map((p) => p.id));
      const invalidos = ids.filter((id) => !validos.has(id));
      if (invalidos.length > 0) {
        throw crearError(400, `Permisos no válidos: ${invalidos.join(', ')}`);
      }
    }

    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      await conexion.execute('DELETE FROM user_permissions WHERE user_id = ?', [userId]);
      if (ids.length > 0) {
        await conexion.query(
          'INSERT INTO user_permissions (user_id, permission_id) VALUES ?',
          [ids.map((id) => [userId, id])]
        );
      }
      await conexion.commit();
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }

    res.json({ data: { user_id: userId, permission_ids: ids } });
  } catch (error) {
    next(error);
  }
}

export default router;