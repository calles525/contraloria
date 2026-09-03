// Tipos centrales del dominio.

export type Rol = 'solicitante' | 'departamento' | 'contraloria' | 'admin';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  departamentoId: number;
  departamentoNombre: string;
  cargo?: string;
  password?: string;
  activo: boolean;
}

export interface Departamento {
  id: number;
  nombre: string;
  descripcion?: string;
  responsableId: number | null;
  usuariosIds: number[];
  activo: boolean;
}

export type EstadoSolicitud =
  | 'borrador'
  | 'enviado'
  | 'en_revision_departamento'
  | 'en_contraloria'
  | 'aprobado'
  | 'rechazado'
  | 'ajustes_requeridos';

export type TipoSolicitud =
  | 'creacion_tercero'
  | 'registro_producto'
  | 'solicitud_compra'
  | 'viaticos'
  | 'otro';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface CampoEspecifico {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'rif' | 'phone' | 'money' | 'date' | 'textarea' | 'select';
  options?: string[];
  required: boolean;
}

export interface HistorialEntry {
  fecha: string;
  usuarioId: number;
  usuarioNombre: string;
  estadoAnterior: EstadoSolicitud | null;
  estadoNuevo: EstadoSolicitud | null;
  comentario?: string;
}

export interface Comentario {
  fecha: string;
  usuarioId: number;
  usuarioNombre: string;
  texto: string;
}

export interface Documento {
  nombre: string;
  size: string;
  fecha: string;
}

export interface Solicitud {
  id: number;
  numeroSolicitud: string;
  tipo: TipoSolicitud;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fechaRequerida?: string;
  estado: EstadoSolicitud;
  creadorId: number;
  creadorNombre: string;
  departamentoOrigenId: number;
  departamentoOrigenNombre: string;
  departamentoDestinoId: number;
  departamentoDestinoNombre: string;
  asignadoA: number | null;
  asignadoANombre: string;
  fechaCreacion: string;
  fechaEnvio?: string | null;
  fechaRevisionDepartamento?: string | null;
  fechaAprobacionContraloria?: string | null;
  fechaFinalizacion?: string | null;
  datosEspecificos: Record<string, string>;
  documentos: Documento[];
  historial: HistorialEntry[];
  comentarios: Comentario[];
  ultimaModificacion: string;
  activo: boolean;
}

export interface FiltroSolicitud {
  estado?: EstadoSolicitud | '';
  tipo?: TipoSolicitud | '';
  departamentoOrigenId?: number | '';
  departamentoDestinoId?: number | '';
  prioridad?: Prioridad | '';
  buscar?: string;
  desde?: string;
  hasta?: string;
}

export interface AppState {
  usuarios: Usuario[];
  departamentos: Departamento[];
  solicitudes: Solicitud[];
  config: { nextSolicitud: number };
}
