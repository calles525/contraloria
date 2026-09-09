export interface Empresa {
  id: number;
  ruc: string;
  legal_name: string;
  trade_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Estado {
  id: number;
  code: string;
  name: string;
  iso: string | null;
}

export interface Municipio {
  id: number;
  state_id: number;
  code: string | null;
  name: string;
  state_name?: string;
}

export interface Ciudad {
  id: number;
  municipality_id: number;
  code: string | null;
  name: string;
  municipality_name?: string;
  state_name?: string;
}

export interface CentroCosto {
  id: number;
  company_id: number;
  code: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  state_id: number | null;
  municipality_id: number | null;
  city_id: number | null;
  is_active: number;
  company_name?: string;
  state_name?: string | null;
  municipality_name?: string | null;
  city_name?: string | null;
}

export interface Departamento {
  id: number;
  company_id: number;
  cost_center_id: number | null;
  name: string;
  manager_person_id: number | null;
  description: string | null;
  is_active: number;
  company_name?: string;
  cost_center_name?: string | null;
  manager_name?: string | null;
}

export interface Persona {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string | null;
  id_number: string;
  created_at: string;
}

export interface Usuario {
  id: number;
  person_id: number;
  username: string;
  email: string | null;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  person_name?: string;
  id_number?: string;
  company_id?: number | null;
  company_name?: string | null;
  cost_center_id?: number | null;
  cost_center_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
}

/** Ubicación de un usuario en el organigrama (empresa, sede, departamento). */
export interface UbicacionUsuario {
  company_id: number;
  company: string;
  cost_center_id: number;
  cost_center: string;
  department_id: number;
  department: string;
}

export interface Almacen {
  id: number;
  company_id: number;
  code: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  manager_person_id: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  company_name?: string;
  manager_name?: string | null;
}

export interface Permiso {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: number;
  created_at?: string;
}

export interface OpcionSelect {
  value: string;
  label: string;
}