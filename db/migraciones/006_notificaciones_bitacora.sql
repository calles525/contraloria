-- Migración 006: bitácora de auditoría y notificaciones del sistema
-- Fecha: 2026-09-08
-- Registra toda la actividad de los usuarios (bitácora) y permite generar
-- notificaciones dirigidas a los usuarios del sistema.

-- Historial de acciones de los usuarios en el sistema (auditoría).
CREATE TABLE IF NOT EXISTS bitacora (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  modulo VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  accion VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  descripcion VARCHAR(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  detalle JSON DEFAULT NULL,
  ip VARCHAR(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bitacora_usuario (user_id),
  KEY idx_bitacora_modulo (modulo),
  KEY idx_bitacora_fecha (created_at),
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notificaciones dirigidas a un usuario destinatario.
CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tipo VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  titulo VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  mensaje VARCHAR(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  origen_user_id BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificaciones_usuario_leida (user_id, leida),
  KEY idx_notificaciones_fecha (created_at),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_notificaciones_origen FOREIGN KEY (origen_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permiso para consultar la bitácora de auditoría.
INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('bitacora', 'Bitácora', 'Consulta de la bitácora de auditoría del sistema');

-- Se asigna el permiso al usuario administrador inicial (jesus) si existe.
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.code = 'bitacora'
WHERE u.username = 'jesus';