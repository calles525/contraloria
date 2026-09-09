import api from './api';
import {
  Empresa,
  Estado,
  Municipio,
  Ciudad,
  CentroCosto,
  Departamento,
  Persona,
  Usuario,
  Almacen,
  Permiso,
  OpcionSelect,
  UbicacionUsuario,
} from '../types/maestros';

// ---------------------------------------------------------------------------
// Helpers genéricos
// ---------------------------------------------------------------------------

interface RespuestaLista<T> {
  data: T[];
}

interface RespuestaItem<T> {
  data: T;
}

async function listar<T>(ruta: string, filtros?: Record<string, string | number>): Promise<T[]> {
  const { data } = await api.get<RespuestaLista<T>>(ruta, { params: filtros });
  return data.data;
}

async function crear<T>(ruta: string, cuerpo: Record<string, unknown>): Promise<T> {
  const { data } = await api.post<RespuestaItem<T>>(ruta, cuerpo);
  return data.data;
}

async function actualizar<T>(
  ruta: string,
  id: number,
  cuerpo: Record<string, unknown>
): Promise<T> {
  const { data } = await api.put<RespuestaItem<T>>(`${ruta}/${id}`, cuerpo);
  return data.data;
}

async function cambiarEstado(ruta: string, id: number, activo: boolean): Promise<void> {
  await api.patch(`${ruta}/${id}/estado`, { activo });
}

/** Convierte una lista de registros en opciones para los selects. */
function aOpciones(registros: { id: number; name: string }[]): OpcionSelect[] {
  return registros.map((registro) => ({ value: String(registro.id), label: registro.name }));
}

// ---------------------------------------------------------------------------
// Empresas
// ---------------------------------------------------------------------------

export const empresasApi = {
  listar: () => listar<Empresa>('/companies'),
  crear: (cuerpo: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>) =>
    crear<Empresa>('/companies', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Empresa>) =>
    actualizar<Empresa>('/companies', id, cuerpo as unknown as Record<string, unknown>),
  opciones: async (): Promise<OpcionSelect[]> =>
    aOpciones(
      (await listar<Empresa>('/companies')).map((e) => ({ id: e.id, name: e.legal_name }))
    ),
};

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

export const estadosApi = {
  listar: () => listar<Estado>('/states'),
  crear: (cuerpo: Omit<Estado, 'id'>) =>
    crear<Estado>('/states', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Estado>) =>
    actualizar<Estado>('/states', id, cuerpo as unknown as Record<string, unknown>),
  opciones: async (): Promise<OpcionSelect[]> =>
    aOpciones(await listar<Estado>('/states')),
};

// ---------------------------------------------------------------------------
// Municipios
// ---------------------------------------------------------------------------

export const municipiosApi = {
  listar: (stateId?: number | string) =>
    listar<Municipio>('/municipalities', stateId !== undefined && stateId !== '' ? { state_id: stateId } : undefined),
  crear: (cuerpo: Omit<Municipio, 'id'>) =>
    crear<Municipio>('/municipalities', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Municipio>) =>
    actualizar<Municipio>('/municipalities', id, cuerpo as unknown as Record<string, unknown>),
  opciones: async (stateId?: number | string): Promise<OpcionSelect[]> =>
    aOpciones(await listar<Municipio>('/municipalities', stateId !== undefined && stateId !== '' ? { state_id: stateId } : undefined)),
};

// ---------------------------------------------------------------------------
// Ciudades
// ---------------------------------------------------------------------------

export const ciudadesApi = {
  listar: (stateId?: number | string, municipalityId?: number | string) => {
    const filtros: Record<string, string | number> = {};
    if (stateId !== undefined && stateId !== '') filtros.state_id = stateId;
    if (municipalityId !== undefined && municipalityId !== '') filtros.municipality_id = municipalityId;
    return listar<Ciudad>('/cities', Object.keys(filtros).length > 0 ? filtros : undefined);
  },
  crear: (cuerpo: Omit<Ciudad, 'id'>) =>
    crear<Ciudad>('/cities', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Ciudad>) =>
    actualizar<Ciudad>('/cities', id, cuerpo as unknown as Record<string, unknown>),
  opciones: async (stateId?: number | string, municipalityId?: number | string): Promise<OpcionSelect[]> =>
    aOpciones(await ciudadesApi.listar(stateId, municipalityId)),
};

// ---------------------------------------------------------------------------
// Centros de costo
// ---------------------------------------------------------------------------

export const centrosCostoApi = {
  listar: (companyId?: number | string) =>
    listar<CentroCosto>('/cost-centers', companyId !== undefined && companyId !== '' ? { company_id: companyId } : undefined),
  crear: (cuerpo: Omit<CentroCosto, 'id'>) =>
    crear<CentroCosto>('/cost-centers', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<CentroCosto>) =>
    actualizar<CentroCosto>('/cost-centers', id, cuerpo as unknown as Record<string, unknown>),
  cambiarEstado: (id: number, activo: boolean) => cambiarEstado('/cost-centers', id, activo),
  opciones: async (companyId?: number | string): Promise<OpcionSelect[]> =>
    aOpciones(
      await listar<CentroCosto>('/cost-centers', companyId !== undefined && companyId !== '' ? { company_id: companyId } : undefined).then(
        (r) => r.map((c) => ({ id: c.id, name: c.name }))
      )
    ),
};

// ---------------------------------------------------------------------------
// Departamentos
// ---------------------------------------------------------------------------

export const departamentosApi = {
  listar: (filtros?: { company_id?: number | string; cost_center_id?: number | string }) =>
    listar<Departamento>('/departments', filtros as Record<string, string | number> | undefined),
  crear: (cuerpo: Omit<Departamento, 'id'>) =>
    crear<Departamento>('/departments', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Departamento>) =>
    actualizar<Departamento>('/departments', id, cuerpo as unknown as Record<string, unknown>),
  cambiarEstado: (id: number, activo: boolean) => cambiarEstado('/departments', id, activo),
  opciones: async (filtros?: { company_id?: number | string; cost_center_id?: number | string }): Promise<OpcionSelect[]> =>
    aOpciones(await listar<Departamento>('/departments', filtros as Record<string, string | number> | undefined)),
};

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export const personasApi = {
  listar: () => listar<Persona>('/persons'),
  crear: (cuerpo: Omit<Persona, 'id' | 'created_at'>) =>
    crear<Persona>('/persons', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Persona>) =>
    actualizar<Persona>('/persons', id, cuerpo as unknown as Record<string, unknown>),
  opciones: async (): Promise<OpcionSelect[]> =>
    listar<Persona>('/persons').then((r) =>
      r.map((p) => ({ value: String(p.id), label: `${p.first_name} ${p.last_name}` }))
    ),
};

// ---------------------------------------------------------------------------
// Almacenes
// ---------------------------------------------------------------------------

export const almacenesApi = {
  listar: (companyId?: number | string) =>
    listar<Almacen>(
      '/warehouses',
      companyId !== undefined && companyId !== '' ? { company_id: companyId } : undefined
    ),
  crear: (cuerpo: Omit<Almacen, 'id' | 'created_at' | 'updated_at'>) =>
    crear<Almacen>('/warehouses', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Almacen>) =>
    actualizar<Almacen>('/warehouses', id, cuerpo as unknown as Record<string, unknown>),
  cambiarEstado: (id: number, activo: boolean) => cambiarEstado('/warehouses', id, activo),
};

// ---------------------------------------------------------------------------
// Permisos
// ---------------------------------------------------------------------------

export const permisosApi = {
  listar: () => listar<Permiso>('/permissions'),
  crear: (cuerpo: Omit<Permiso, 'id'>) =>
    crear<Permiso>('/permissions', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Permiso>) =>
    actualizar<Permiso>('/permissions', id, cuerpo as unknown as Record<string, unknown>),
  cambiarEstado: (id: number, activo: boolean) => cambiarEstado('/permissions', id, activo),
};

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

export const usuariosApi = {
  listar: () => listar<Usuario>('/users'),
  crear: (cuerpo: { person_id: number; username: string; password: string; email?: string }) =>
    crear<Usuario>('/users', cuerpo as unknown as Record<string, unknown>),
  actualizar: (id: number, cuerpo: Partial<Usuario> & { password?: string }) =>
    actualizar<Usuario>('/users', id, cuerpo as unknown as Record<string, unknown>),
  cambiarEstado: (id: number, activo: boolean) => cambiarEstado('/users', id, activo),
  eliminar: (id: number) => api.delete(`/users/${id}`),
  listarPermisos: (id: number) => listar<Permiso>(`/users/${id}/permissions`),
  asignarPermisos: (id: number, permissionIds: number[]) =>
    api.put(`/users/${id}/permissions`, { permission_ids: permissionIds }),
  listarUbicacion: async (id: number): Promise<UbicacionUsuario | null> => {
    const { data } = await api.get<{ data: UbicacionUsuario | null }>(`/users/${id}/ubicacion`);
    return data.data;
  },
  guardarUbicacion: (id: number, cuerpo: { company_id: number; cost_center_id: number; department_id: number }) =>
    api.put(`/users/${id}/ubicacion`, cuerpo),
  quitarUbicacion: (id: number) => api.put(`/users/${id}/ubicacion`, {}),
};