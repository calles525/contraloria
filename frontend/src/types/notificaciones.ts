/** Configuración de la API de Evolution para mensajes de WhatsApp. */
export interface ConfiguracionEvolution {
  id: number;
  url_api: string;
  instancia: string;
  api_key: string | null;
  activo: boolean;
  updated_at?: string;
}

/** Datos para guardar la configuración de Evolution. */
export interface DatosConfiguracionEvolution {
  url_api: string;
  instancia: string;
  api_key?: string | null;
  activo?: boolean;
}

/** Usuario de un departamento y si recibe mensajes de WhatsApp. */
export interface UsuarioNotificacion {
  user_id: number;
  username: string;
  user_name: string;
  phone: string | null;
  asignado: boolean;
}

/** Departamento con los usuarios que trabajan en él. */
export interface DepartamentoNotificacion {
  id: number;
  name: string;
  company_id: number;
  usuarios: UsuarioNotificacion[];
}