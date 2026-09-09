import api from './api';

export interface RegistroBitacora {
  id: number;
  modulo: string;
  accion: string;
  descripcion: string;
  detalle: unknown;
  ip: string | null;
  created_at: string;
  username: string;
  usuario_nombre: string;
}

export interface RespuestaBitacora {
  data: RegistroBitacora[];
  total: number;
  pagina: number;
  limite: number;
}

export interface OpcionesBitacora {
  usuarios: { id: number; nombre: string }[];
  modulos: string[];
}

export interface FiltrosBitacora {
  usuario_id?: number | string;
  modulo?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  pagina?: number;
  limite?: number;
}

export const bitacoraApi = {
  listar: (filtros?: FiltrosBitacora): Promise<RespuestaBitacora> => {
    const params: Record<string, string | number> = {};
    if (filtros?.usuario_id) params.usuario_id = filtros.usuario_id;
    if (filtros?.modulo) params.modulo = filtros.modulo;
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;
    if (filtros?.q) params.q = filtros.q;
    if (filtros?.pagina) params.pagina = filtros.pagina;
    if (filtros?.limite) params.limite = filtros.limite;
    return api.get<RespuestaBitacora>('/bitacora', { params }).then((r) => r.data);
  },

  opciones: (): Promise<OpcionesBitacora> =>
    api.get<OpcionesBitacora>('/bitacora/opciones').then((r) => r.data),
};