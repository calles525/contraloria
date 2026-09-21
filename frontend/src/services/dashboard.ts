// Servicio de datos para el panel principal (dashboard).

import api from './api';

export interface DistribucionCategoria {
  categoria: string;
  total: number;
}

export interface DistribucionTipo {
  tipo: string;
  total: number;
}

export interface DistribucionDepartamento {
  departamento: string;
  total: number;
}

export interface DistribucionMes {
  mes: string;
  total: number;
}

export interface DistribucionMesEstado {
  mes: string;
  estado: string;
  total: number;
}

/** Filtros que aplican a todas las métricas del resumen. */
export interface FiltrosResumen {
  estado?: string;
  categoria?: string;
  department_id?: number;
}

export interface GestionSolicitudes {
  /** Solicitudes que están hoy EN PROCESO. */
  enProceso: number;
  /** Fueron devueltas (con errores) y luego corregidas y reenviadas. */
  corregidas: number;
  /** Fueron devueltas y aún no se han corregido/reviado. */
  noCorregidas: number;
  /** Nunca fueron devueltas. */
  sinErrores: number;
  /** Total de alguna vez devueltas (corregidas + no corregidas). */
  conErrores: number;
  total: number;
}

export interface ResumenDashboard {
  porEstado: Record<string, number>;
  porCategoria: DistribucionCategoria[];
  porTipo: DistribucionTipo[];
  porDepartamento: DistribucionDepartamento[];
  porMes: DistribucionMes[];
  porMesEstado: DistribucionMesEstado[];
  gestion: GestionSolicitudes;
  ultimas: import('../types/solicitudes').Solicitud[];
  totales: {
    solicitudes: number;
    usuariosActivos: number;
    empresas: number;
    departamentos: number;
  };
}

interface RespuestaItem<T> {
  data: T;
}

export const dashboardApi = {
  resumen: (filtros?: FiltrosResumen): Promise<ResumenDashboard> =>
    api
      .get<RespuestaItem<ResumenDashboard>>('/solicitudes/resumen', {
        params: filtros as Record<string, string | number> | undefined,
      })
      .then((r) => r.data.data),
};