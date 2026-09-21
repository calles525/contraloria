-- Migración 009: reenvío de solicitudes devueltas
-- Fecha: 2026-09-18
-- Extiende el catálogo de tipos de nota: el solicitante puede reenviar una
-- solicitud que recibió en estado DEVUELTA, volviendo a quedar PENDIENTE.

ALTER TABLE solicitud_notas
  MODIFY COLUMN tipo_nota ENUM('NOTA', 'REGRESAR', 'RECHAZAR', 'VALIDAR', 'PROCESAR', 'REENVIAR')
  NOT NULL DEFAULT 'NOTA';