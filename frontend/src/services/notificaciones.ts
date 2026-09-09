import api from './api';

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface RespuestaNotificaciones {
  data: Notificacion[];
  total: number;
  noLeidas: number;
}

export const notificacionesApi = {
  listar: (limite = 10): Promise<RespuestaNotificaciones> =>
    api
      .get<RespuestaNotificaciones>('/notificaciones', { params: { limite } })
      .then((r) => r.data),

  contarNoLeidas: (): Promise<number> =>
    api.get<{ noLeidas: number }>('/notificaciones/no-leidas').then((r) => r.data.noLeidas),

  marcarTodasLeidas: () => api.post('/notificaciones/leer-todas'),

  marcarLeida: (id: number) => api.post(`/notificaciones/${id}/leida`),
};