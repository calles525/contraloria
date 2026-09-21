import api from './api';
import {
  ConfiguracionEvolution,
  DatosConfiguracionEvolution,
  DepartamentoNotificacion,
} from '../types/notificaciones';

interface RespuestaLista<T> {
  data: T[];
}

interface RespuestaItem<T> {
  data: T;
}

export const notificacionesWhatsappApi = {
  /** Lee la configuración de Evolution vigente (null si no existe). */
  obtenerConfiguracion: async (): Promise<ConfiguracionEvolution | null> => {
    const { data } = await api.get<RespuestaItem<ConfiguracionEvolution | null>>(
      '/notificaciones-whatsapp/configuracion'
    );
    return data.data;
  },

  /** Guarda (reemplaza) la configuración de Evolution. */
  guardarConfiguracion: async (
    cuerpo: DatosConfiguracionEvolution
  ): Promise<ConfiguracionEvolution> => {
    const { data } = await api.put<RespuestaItem<ConfiguracionEvolution>>(
      '/notificaciones-whatsapp/configuracion',
      cuerpo
    );
    return data.data;
  },

  /** Lista los departamentos activos con los usuarios de cada uno. */
  listarDepartamentos: async (): Promise<DepartamentoNotificacion[]> => {
    const { data } = await api.get<RespuestaLista<DepartamentoNotificacion>>(
      '/notificaciones-whatsapp/departamentos'
    );
    return data.data;
  },

  /** Reemplaza los destinatarios de WhatsApp del departamento indicado. */
  guardarUsuariosDepartamento: async (
    departmentId: number,
    userIds: number[]
  ): Promise<void> => {
    await api.put(`/notificaciones-whatsapp/departamentos/${departmentId}/usuarios`, {
      user_ids: userIds,
    });
  },
};