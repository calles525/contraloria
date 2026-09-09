-- Migración 002: permisos del sistema
-- Fecha: 2026-09-05
-- Crea el módulo de permisos (catálogo) y la asignación de permisos por usuario.

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  name VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  description VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  KEY idx_user_permissions_permission (permission_id),
  CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos iniciales: uno por módulo del sistema (sub-ítems de Configuración).
INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('empresas', 'Empresas', 'Gestión de empresas'),
  ('estados', 'Estados', 'Catálogo de estados'),
  ('municipios', 'Municipios', 'Catálogo de municipios'),
  ('ciudades', 'Ciudades', 'Catálogo de ciudades'),
  ('centros_costo', 'Centros de costo', 'Gestión de centros de costo'),
  ('departamentos', 'Departamentos', 'Gestión de departamentos'),
  ('almacenes', 'Almacenes', 'Gestión de almacenes y asignación de encargados'),
  ('personas', 'Personas', 'Registro de personas'),
  ('usuarios', 'Usuarios', 'Gestión de usuarios del sistema'),
  ('encargados_departamentos', 'Encargados de departamentos', 'Asignación de encargados de departamentos'),
  ('permisos', 'Permisos', 'Administración de permisos del sistema');