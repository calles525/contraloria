-- Migración 005: ubicación del empleado (usuario) en el organigrama
-- Fecha: 2026-09-06
-- Asocia a cada persona/usuario con su empresa, sede (centro de costo) y
-- departamento. Se usa para precargar automáticamente los datos del registro
-- al crear una solicitud.

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  cost_center_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_person (person_id),
  KEY idx_employees_company (company_id),
  KEY idx_employees_cost_center (cost_center_id),
  KEY idx_employees_department (department_id),
  CONSTRAINT fk_employees_person FOREIGN KEY (person_id) REFERENCES persons (id),
  CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies (id),
  CONSTRAINT fk_employees_cost_center FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos iniciales: Jesus Mejias (persona 1) en GRUPO BOTALON,
-- Sede Central Caracas, departamento ADMINISTRACION DE VENTAS.
INSERT INTO employees (person_id, company_id, cost_center_id, department_id)
SELECT 1, c.id, cc.id, d.id
FROM companies c
JOIN cost_centers cc ON cc.company_id = c.id AND cc.name = 'Sede Central Caracas'
JOIN departments d ON d.cost_center_id = cc.id AND d.name = 'ADMINISTRACION DE VENTAS'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE person_id = 1)
LIMIT 1;