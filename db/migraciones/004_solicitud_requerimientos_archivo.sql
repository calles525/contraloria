-- Migración 004: documentos adjuntos en los requerimientos de solicitudes
-- Fecha: 2026-09-05
-- Permite adjuntar un archivo por cada documento requerido de una solicitud.
-- El requerimiento pasa a marcarse como cumplido cuando tiene archivo adjunto.

ALTER TABLE solicitud_requerimientos
  ADD COLUMN archivo_nombre VARCHAR(255) DEFAULT NULL AFTER cumplido,
  ADD COLUMN archivo_ruta VARCHAR(500) DEFAULT NULL AFTER archivo_nombre;