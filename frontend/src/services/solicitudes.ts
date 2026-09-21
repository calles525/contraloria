import api from './api';
import { DatosCrearSolicitud, Solicitud } from '../types/solicitudes';

interface RespuestaLista<T> {
  data: T[];
}

interface RespuestaItem<T> {
  data: T;
}

/** Datos para crear/actualizar: la solicitud más los archivos a adjuntar. */
export type DatosCrearSolicitudConArchivos = DatosCrearSolicitud & {
  archivos?: Record<string, File>;
};

/**
 * Construye el FormData multipart de una solicitud.
 * El JSON viaja en el campo "datos", los nombres de los requerimientos con
 * archivo en "nombres_archivos" y los archivos en el campo "archivos".
 */
function construirFormData(datos: DatosCrearSolicitudConArchivos): FormData {
  const { archivos, ...payload } = datos;
  const formData = new FormData();
  formData.append('datos', JSON.stringify(payload));

  const nombres: string[] = [];
  for (const requerimiento of payload.requerimientos ?? []) {
    const archivo = archivos?.[requerimiento.nombre];
    if (archivo) {
      nombres.push(requerimiento.nombre);
      formData.append('archivos', archivo);
    }
  }
  if (nombres.length > 0) {
    formData.append('nombres_archivos', JSON.stringify(nombres));
  }

  return formData;
}

export interface FiltrosSolicitudes {
  estado?: string;
  categoria?: string;
  tipo_solicitud?: string;
  empresa_id?: number | string;
  q?: string;
  /** Limita el resultado a las solicitudes del departamento del usuario. */
  solo_departamento?: '1';
}

export const solicitudesApi = {
  listar: (filtros?: FiltrosSolicitudes): Promise<Solicitud[]> => {
    const params: Record<string, string | number> = {};
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.categoria) params.categoria = filtros.categoria;
    if (filtros?.tipo_solicitud) params.tipo_solicitud = filtros.tipo_solicitud;
    if (filtros?.empresa_id) params.empresa_id = filtros.empresa_id;
    if (filtros?.q) params.q = filtros.q;
    if (filtros?.solo_departamento) params.solo_departamento = filtros.solo_departamento;
    return api.get<RespuestaLista<Solicitud>>('/solicitudes', { params }).then((r) => r.data.data);
  },

  obtener: (id: number, soloDepartamento?: boolean): Promise<Solicitud> =>
    api
      .get<RespuestaItem<Solicitud>>(`/solicitudes/${id}`, {
        params: soloDepartamento ? { solo_departamento: '1' } : undefined,
      })
      .then((r) => r.data.data),

  crear: (datos: DatosCrearSolicitudConArchivos): Promise<Solicitud> => {
    const formData = construirFormData(datos);
    return api
      .post<RespuestaItem<Solicitud>>('/solicitudes', formData)
      .then((r) => r.data.data);
  },

  actualizar: (id: number, datos: DatosCrearSolicitudConArchivos): Promise<Solicitud> => {
    const formData = construirFormData(datos);
    return api
      .put<RespuestaItem<Solicitud>>(`/solicitudes/${id}`, formData)
      .then((r) => r.data.data);
  },

  eliminar: (id: number) => api.delete(`/solicitudes/${id}`),

  procesar: (id: number, nota?: string): Promise<Solicitud> =>
    api
      .post<RespuestaItem<Solicitud>>(`/solicitudes/${id}/procesar`, { nota })
      .then((r) => r.data.data),

  regresar: (id: number, nota: string): Promise<Solicitud> =>
    api
      .post<RespuestaItem<Solicitud>>(`/solicitudes/${id}/regresar`, { nota })
      .then((r) => r.data.data),

  reenviar: (id: number, nota?: string): Promise<Solicitud> =>
    api
      .post<RespuestaItem<Solicitud>>(`/solicitudes/${id}/reenviar`, { nota })
      .then((r) => r.data.data),

  validar: (id: number, nota?: string): Promise<Solicitud> =>
    api
      .post<RespuestaItem<Solicitud>>(`/solicitudes/${id}/validar`, { nota })
      .then((r) => r.data.data),

  agregarNota: (id: number, nota: string): Promise<Solicitud> =>
    api
      .post<RespuestaItem<Solicitud>>(`/solicitudes/${id}/notas`, { nota })
      .then((r) => r.data.data),

  // -------------------------------------------------------------------------
  // Documentos requeridos (archivos adjuntos)
  // -------------------------------------------------------------------------

  /** Adjunta (o reemplaza) el archivo de un documento requerido. */
  subirArchivoRequerimiento: (
    solicitudId: number,
    requerimientoId: number,
    archivo: File
  ): Promise<Solicitud> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return api
      .post<RespuestaItem<Solicitud>>(
        `/solicitudes/${solicitudId}/requerimientos/${requerimientoId}/archivo`,
        formData
      )
      .then((r) => r.data.data);
  },

  /** Quita el archivo adjunto de un documento requerido. */
  quitarArchivoRequerimiento: (
    solicitudId: number,
    requerimientoId: number
  ): Promise<Solicitud> =>
    api
      .delete<RespuestaItem<Solicitud>>(
        `/solicitudes/${solicitudId}/requerimientos/${requerimientoId}/archivo`
      )
      .then((r) => r.data.data),

  /**
   * Descarga el archivo adjunto de un documento requerido.
   * Devuelve el blob y el nombre original para guardarlo en el navegador.
   */
  descargarArchivoRequerimiento: async (
    solicitudId: number,
    requerimientoId: number
  ): Promise<{ blob: Blob; nombre: string }> => {
    const respuesta = await api.get(
      `/solicitudes/${solicitudId}/requerimientos/${requerimientoId}/archivo`,
      { responseType: 'blob' }
    );

    // El nombre original viene en el encabezado Content-Disposition.
    let nombre = `documento-${requerimientoId}`;
    const disposicion = (respuesta.headers['content-disposition'] as string) || '';
    const conCodificacion = /filename\*=UTF-8''([^;]+)/i.exec(disposicion);
    if (conCodificacion) {
      nombre = decodeURIComponent(conCodificacion[1]);
    } else {
      const simples = /filename="?([^"]+)"?/i.exec(disposicion);
      if (simples) nombre = simples[1];
    }

    return { blob: respuesta.data as Blob, nombre };
  },
};