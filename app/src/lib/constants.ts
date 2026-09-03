// Catálogos y valores constantes del dominio.
import type { CampoEspecifico, EstadoSolicitud, Prioridad, Rol, TipoSolicitud } from './types';

export const ROLES: Record<Rol, string> = {
  solicitante: 'Solicitante',
  departamento: 'Departamento',
  contraloria: 'Contraloría',
  admin: 'Administrador',
};

export const ESTADOS: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  en_revision_departamento: 'En revisión (departamento)',
  en_contraloria: 'En contraloría',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  ajustes_requeridos: 'Ajustes requeridos',
};

export const TIPOS: Record<TipoSolicitud, string> = {
  creacion_tercero: 'Creación de Tercero',
  registro_producto: 'Registro de Producto',
  solicitud_compra: 'Solicitud de Compra',
  viaticos: 'Viáticos',
  otro: 'Otro',
};

export const PRIORIDADES: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const ESTADO_GRUPOS = {
  pendientes: ['enviado', 'en_revision_departamento', 'ajustes_requeridos'] as EstadoSolicitud[],
  enRevision: ['en_contraloria', 'en_revision_departamento', 'ajustes_requeridos'] as EstadoSolicitud[],
  finalizados: ['aprobado', 'rechazado'] as EstadoSolicitud[],
};

export const ESTADO_COLOR: Record<EstadoSolicitud, string> = {
  borrador: 'slate',
  enviado: 'info',
  en_revision_departamento: 'warning',
  en_contraloria: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
  ajustes_requeridos: 'danger',
};

export const PRIORIDAD_COLOR: Record<Prioridad, string> = {
  alta: 'danger',
  media: 'warning',
  baja: 'success',
};

export const TIPO_CAMPOS: Record<TipoSolicitud, CampoEspecifico[]> = {
  creacion_tercero: [
    { key: 'nombreTercero', label: 'Nombre / Razón Social', type: 'text', required: true },
    { key: 'rifTercero', label: 'RIF (J-XXXXXXXX-X)', type: 'rif', required: true },
    { key: 'emailTercero', label: 'Email de contacto', type: 'email', required: true },
    { key: 'telefonoTercero', label: 'Teléfono (XXX-XXX-XXXX)', type: 'phone', required: true },
    { key: 'tipoPersona', label: 'Tipo de persona', type: 'select', options: ['Natural', 'Jurídica'], required: true },
  ],
  registro_producto: [
    { key: 'codigoProducto', label: 'Código de producto', type: 'text', required: true },
    { key: 'nombreProducto', label: 'Nombre del producto', type: 'text', required: true },
    { key: 'categoriaProducto', label: 'Categoría', type: 'text', required: true },
    { key: 'marca', label: 'Marca', type: 'text', required: false },
    { key: 'cantidad', label: 'Cantidad', type: 'number', required: true },
    { key: 'unidadMedida', label: 'Unidad de medida', type: 'text', required: false },
  ],
  solicitud_compra: [
    { key: 'descripcionBien', label: 'Descripción del bien/servicio', type: 'text', required: true },
    { key: 'montoEstimado', label: 'Monto estimado (Bs.)', type: 'money', required: true },
    { key: 'proveedor', label: 'Proveedor sugerido', type: 'text', required: false },
    { key: 'justificacion', label: 'Justificación de la compra', type: 'textarea', required: true },
  ],
  viaticos: [
    { key: 'destino', label: 'Destino', type: 'text', required: true },
    { key: 'fechaSalida', label: 'Fecha de salida', type: 'date', required: true },
    { key: 'fechaRegreso', label: 'Fecha de regreso', type: 'date', required: true },
    { key: 'motivoViaje', label: 'Motivo del viaje', type: 'textarea', required: true },
    { key: 'presupuestoEstimado', label: 'Presupuesto estimado (Bs.)', type: 'money', required: true },
  ],
  otro: [{ key: 'detalle', label: 'Detalle de la solicitud', type: 'textarea', required: true }],
};
