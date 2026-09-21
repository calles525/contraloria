-- Migración 008: notificaciones por WhatsApp (Evolution API)
-- Fecha: 2026-09-18
-- 1) Configuración de la API de Evolution (una sola fila).
-- 2) Destinatarios de WhatsApp asignados por departamento.
-- 3) Permiso para administrar las notificaciones.

-- Configuración de la API de Evolution (link y instancia de WhatsApp).
CREATE TABLE IF NOT EXISTS evolution_configuraciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  url_api VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  instancia VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  api_key VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios de un departamento que reciben mensajes de WhatsApp cuando llega
-- una solicitud dirigida a su departamento.
CREATE TABLE IF NOT EXISTS notificacion_departamento_usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notif_departamento_usuario (department_id, user_id),
  KEY idx_notif_departamento_usuarios_usuario (user_id),
  CONSTRAINT fk_notif_departamento FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_departamento_usuarios_usuario FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permiso para administrar esta configuración.
INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('gestionar_notificaciones', 'Gestionar notificaciones', 'Configuración de notificaciones por WhatsApp: destinatarios por departamento y API de Evolution');