-- Migración 007: permisos separados para solicitantes y gestores
-- Fecha: 2026-09-08
-- Reemplaza el permiso genérico 'solicitudes' por dos permisos específicos:
--   - 'crear_solicitudes': creación y edición de solicitudes.
--   - 'gestionar_solicitudes': gestión, aprobación y documentos de solicitudes.
-- Los usuarios que tenían 'solicitudes' reciben ambos permisos nuevos.

-- Permisos nuevos del módulo de solicitudes.
INSERT IGNORE INTO permissions (code, name, description) VALUES
  ('crear_solicitudes', 'Crear solicitudes', 'Creación y edición de solicitudes'),
  ('gestionar_solicitudes', 'Gestionar solicitudes', 'Gestión, aprobación y documentos de solicitudes');

-- Se otorgan ambos permisos a quienes tenían el permiso genérico 'solicitudes'.
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT up.user_id, np.id
FROM user_permissions up
JOIN permissions p ON p.id = up.permission_id
JOIN permissions np ON np.code IN ('crear_solicitudes', 'gestionar_solicitudes')
WHERE p.code = 'solicitudes';

-- Se retira el permiso antiguo a los usuarios.
DELETE up
FROM user_permissions up
JOIN permissions p ON p.id = up.permission_id
WHERE p.code = 'solicitudes';

-- Se elimina el permiso antiguo del catálogo (los registros de user_permissions
-- asociados ya fueron retirados en el paso anterior).
DELETE FROM permissions WHERE code = 'solicitudes';