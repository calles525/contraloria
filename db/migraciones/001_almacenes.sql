-- Migración 001: tabla de almacenes (warehouses)
-- Fecha: 2026-09-05
-- Crea el módulo de almacenes y permite asignar un encargado (persona) a cada almacén.

CREATE TABLE IF NOT EXISTS warehouses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  address VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  phone VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  manager_person_id BIGINT UNSIGNED DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warehouses_company_code (company_id, code),
  KEY idx_warehouses_company (company_id),
  KEY idx_warehouses_manager (manager_person_id),
  CONSTRAINT fk_warehouses_company FOREIGN KEY (company_id) REFERENCES companies (id),
  CONSTRAINT fk_warehouses_manager FOREIGN KEY (manager_person_id) REFERENCES persons (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;