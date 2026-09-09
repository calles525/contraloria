-- Migración 003: módulo de solicitudes
-- Fecha: 2026-09-05
-- Crea el módulo de solicitudes (solicitudes, requerimientos y notas) y el permiso
-- asociado para gestionar el menú "Solicitud > Gestionar Solicitudes".

CREATE TABLE IF NOT EXISTS solicitudes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero VARCHAR(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  tipo_solicitud ENUM('CREAR', 'ACTUALIZAR', 'ACTIVAR', 'DESACTIVAR') NOT NULL,
  categoria VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  empresa_id BIGINT UNSIGNED NOT NULL,
  cost_center_id BIGINT UNSIGNED DEFAULT NULL,
  department_id BIGINT UNSIGNED DEFAULT NULL,
  solicitante_user_id BIGINT UNSIGNED NOT NULL,
  supervisor_person_id BIGINT UNSIGNED DEFAULT NULL,
  estado ENUM('PENDIENTE', 'EN PROCESO', 'DEVUELTA', 'RECHAZADA', 'VALIDADA') NOT NULL DEFAULT 'PENDIENTE',
  datos JSON DEFAULT NULL,
  observaciones TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  fecha_solicitud TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_gestion TIMESTAMP NULL DEFAULT NULL,
  fecha_validacion TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitudes_numero (numero),
  KEY idx_solicitudes_estado (estado),
  KEY idx_solicitudes_categoria (categoria),
  KEY idx_solicitudes_tipo (tipo_solicitud),
  KEY idx_solicitudes_empresa (empresa_id),
  KEY idx_solicitudes_centro_costo (cost_center_id),
  KEY idx_solicitudes_departamento (department_id),
  KEY idx_solicitudes_solicitante (solicitante_user_id),
  KEY idx_solicitudes_supervisor (supervisor_person_id),
  CONSTRAINT fk_solicitudes_empresa FOREIGN KEY (empresa_id) REFERENCES companies (id),
  CONSTRAINT fk_solicitudes_centro_costo FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id),
  CONSTRAINT fk_solicitudes_departamento FOREIGN KEY (department_id) REFERENCES departments (id),
  CONSTRAINT fk_solicitudes_solicitante FOREIGN KEY (solicitante_user_id) REFERENCES users (id),
  CONSTRAINT fk_solicitudes_supervisor FOREIGN KEY (supervisor_person_id) REFERENCES persons (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Checklist de documentos/requerimientos asociados a cada solicitud.
CREATE TABLE IF NOT EXISTS solicitud_requerimientos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  solicitud_id BIGINT UNSIGNED NOT NULL,
  nombre VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  cumplido TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitud_requerimiento (solicitud_id, nombre),
  CONSTRAINT fk_solreq_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de notas y acciones de gestión de cada solicitud (timeline).
CREATE TABLE IF NOT EXISTS solicitud_notas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  solicitud_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  tipo_nota ENUM('NOTA', 'REGRESAR', 'RECHAZAR', 'VALIDAR', 'PROCESAR') NOT NULL DEFAULT 'NOTA',
  nota TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_solnotas_solicitud (solicitud_id),
  KEY idx_solnotas_usuario (user_id),
  CONSTRAINT fk_solnotas_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes (id) ON DELETE CASCADE,
  CONSTRAINT fk_solnotas_usuario FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permiso para el menú "Solicitud > Gestionar Solicitudes".
INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('solicitudes', 'Solicitudes', 'Gestión de solicitudes del sistema');

-- Se asigna el permiso al usuario administrador inicial (jesus) si existe.
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.code = 'solicitudes'
WHERE u.username = 'jesus';