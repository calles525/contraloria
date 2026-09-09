import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { firmarToken } from '../utils/jwt.js';
import { crearError } from '../middlewares/error.middleware.js';
import { registrarBitacora } from '../services/bitacora.service.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw crearError(400, 'Usuario y contraseña son obligatorios.');
    }

    const usuarios = await query(
      `SELECT u.id, u.username, u.password_hash, u.email, u.is_active,
              p.id AS person_id, p.first_name, p.last_name, p.id_number, p.birth_date, p.phone
       FROM users u
       JOIN persons p ON p.id = u.person_id
       WHERE u.username = ?`,
      [username]
    );

    if (usuarios.length === 0) {
      throw crearError(401, 'Credenciales invalidas.');
    }

    const usuario = usuarios[0];

    if (!usuario.is_active) {
      throw crearError(403, 'El usuario está desactivado.');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      throw crearError(401, 'Credenciales invalidas.');
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [usuario.id]);

    const permisos = await obtenerPermisosDeUsuario(usuario.id);
    const token = firmarToken({ id: usuario.id, username: usuario.username, person_id: usuario.person_id });

    // Auditoría: se registra el inicio de sesión exitoso.
    registrarBitacora({
      usuarioId: usuario.id,
      modulo: 'auth',
      accion: 'login',
      descripcion: `Inició sesión en el sistema (${usuario.username}).`,
      ip: req.ip,
    });

    res.json({
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        permisos,
        person: {
          id: usuario.person_id,
          first_name: usuario.first_name,
          last_name: usuario.last_name,
          id_number: usuario.id_number,
          birth_date: usuario.birth_date,
          phone: usuario.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function usuarioActual(req, res, next) {
  try {
    const usuarios = await query(
      `SELECT u.id, u.username, u.email, u.is_active,
              p.id AS person_id, p.first_name, p.last_name, p.id_number, p.birth_date, p.phone
       FROM users u
       JOIN persons p ON p.id = u.person_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (usuarios.length === 0) {
      throw crearError(404, 'Usuario no encontrado.');
    }

    const u = usuarios[0];
    const permisos = await obtenerPermisosDeUsuario(u.id);

    res.json({
      user: {
        id: u.id,
        username: u.username,
        email: u.email,
        permisos,
        person: {
          id: u.person_id,
          first_name: u.first_name,
          last_name: u.last_name,
          id_number: u.id_number,
          birth_date: u.birth_date,
          phone: u.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/** Devuelve la ubicación (empresa, sede, departamento) asociada al usuario logueado. */
export async function ubicacionUsuario(req, res, next) {
  try {
    const filas = await query(
      `SELECT e.company_id, c.trade_name AS company, e.cost_center_id, cc.name AS cost_center,
              e.department_id, d.name AS department,
              CONCAT(p.first_name, ' ', p.last_name) AS solicitante
       FROM users u
       JOIN persons p ON p.id = u.person_id
       LEFT JOIN employees e ON e.person_id = p.id
       LEFT JOIN companies c ON c.id = e.company_id
       LEFT JOIN cost_centers cc ON cc.id = e.cost_center_id
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    const f = filas[0];
    if (!f || !f.company_id) {
      res.json({ ubicacion: null, solicitante: null });
      return;
    }

    res.json({
      ubicacion: {
        company_id: f.company_id,
        company: f.company,
        cost_center_id: f.cost_center_id,
        cost_center: f.cost_center,
        department_id: f.department_id,
        department: f.department,
      },
      solicitante: f.solicitante,
    });
  } catch (error) {
    next(error);
  }
}

/** Devuelve los códigos de los permisos otorgados a un usuario. */
async function obtenerPermisosDeUsuario(userId) {
  const filas = await query(
    `SELECT p.code
     FROM user_permissions up
     JOIN permissions p ON p.id = up.permission_id
     WHERE up.user_id = ?`,
    [userId]
  );
  return filas.map((f) => f.code);
}
