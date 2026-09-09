// Tipos y catálogos del módulo de solicitudes.

export type TipoSolicitud = 'CREAR' | 'ACTUALIZAR' | 'ACTIVAR' | 'DESACTIVAR';

export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'EN PROCESO'
  | 'DEVUELTA'
  | 'RECHAZADA'
  | 'VALIDADA';

export type TipoNota = 'NOTA' | 'REGRESAR' | 'RECHAZAR' | 'VALIDAR' | 'PROCESAR';

export type TipoCampoDinamico = 'texto' | 'numero' | 'area' | 'select' | 'check' | 'multi' | 'date' | 'datetime';

export interface CampoDinamico {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampoDinamico;
  requerido?: boolean;
  placeholder?: string;
  spanCompleto?: boolean;
  /** Opciones para campos tipo select. */
  opciones?: string[];
  /** Opciones para campos tipo multi (selección múltiple con checkboxes). */
  opcionesMulti?: string[];
}

export interface Requerimiento {
  id?: number;
  nombre: string;
  cumplido: boolean;
  /** Nombre original del documento adjunto (si existe). */
  archivo_nombre?: string | null;
  /** Ruta relativa del documento adjunto (solo se usa para descargar). */
  archivo_ruta?: string | null;
}

export interface Nota {
  id: number;
  tipo_nota: TipoNota;
  nota: string;
  autor_nombre: string;
  created_at: string;
}

export interface Solicitud {
  id: number;
  numero: string;
  tipo_solicitud: TipoSolicitud;
  categoria: string;
  empresa_id: number;
  empresa_nombre: string;
  cost_center_id: number | null;
  sede_nombre: string | null;
  department_id: number | null;
  departamento_nombre: string | null;
  solicitante_user_id: number;
  solicitante_nombre: string;
  supervisor_person_id: number | null;
  supervisor_nombre: string | null;
  estado: EstadoSolicitud;
  datos: Record<string, unknown> | null;
  observaciones: string | null;
  fecha_solicitud: string;
  fecha_gestion: string | null;
  fecha_validacion: string | null;
  requerimientos?: Requerimiento[];
  notas?: Nota[];
}

export interface DatosCrearSolicitud {
  tipo_solicitud: TipoSolicitud;
  categoria: string;
  empresa_id: number;
  cost_center_id?: number | null;
  department_id?: number | null;
  supervisor_person_id?: number | null;
  datos: Record<string, unknown>;
  observaciones?: string;
  requerimientos: Requerimiento[];
}

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export const TIPOS_SOLICITUD: { valor: TipoSolicitud; etiqueta: string }[] = [
  { valor: 'CREAR', etiqueta: 'Crear' },
  { valor: 'ACTUALIZAR', etiqueta: 'Actualizar' },
  { valor: 'ACTIVAR', etiqueta: 'Activar' },
  { valor: 'DESACTIVAR', etiqueta: 'Desactivar' },
];

export const CATEGORIAS: string[] = [
  'ALMACEN',
  'BANCOS',
  'CLIENTE',
  'PALETAS O BIG BAG',
  'PRODUCTOR',
  'PRODUCTOS & ATRIBUTOS',
  'PROVEEDOR-AUTORIZADO',
  'REGION DE VENTAS',
  'TRANSPORTISTA - CHOFER',
];

export const ESTADOS_SOLICITUD: EstadoSolicitud[] = [
  'PENDIENTE',
  'EN PROCESO',
  'DEVUELTA',
  'RECHAZADA',
  'VALIDADA',
];

/** Clases de badge por estado, coherentes con la paleta TailAdmin. */
export const ESTILO_ESTADO: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
  'EN PROCESO': 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  DEVUELTA: 'bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-gray-300',
  RECHAZADA: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  VALIDADA: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
};

/** Clases de badge por tipo de solicitud, coherentes con la paleta TailAdmin. */
export const ESTILO_TIPO: Record<TipoSolicitud, string> = {
  CREAR: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  ACTUALIZAR: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  ACTIVAR: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
  DESACTIVAR: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
};

// ---------------------------------------------------------------------------
// Campos dinámicos por categoría (según los formatos oficiales)
// ---------------------------------------------------------------------------

export const CAMPOS_POR_CATEGORIA: Record<string, CampoDinamico[]> = {
  ALMACEN: [
    { nombre: 'organizacion', etiqueta: 'Organización', tipo: 'texto' },
    { nombre: 'codigo', etiqueta: 'Código', tipo: 'texto', requerido: true },
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { nombre: 'localizacion', etiqueta: 'Localización', tipo: 'texto' },
    { nombre: 'usuarios_tms', etiqueta: 'Usuarios TMS', tipo: 'texto' },
    { nombre: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto' },
    { nombre: 'es_consignacion', etiqueta: 'Es Consignación', tipo: 'check' },
    { nombre: 've_stock', etiqueta: 'Ve Stock', tipo: 'check' },
    { nombre: 'es_producto_terminado', etiqueta: 'Es para Producto Terminado', tipo: 'check' },
    { nombre: 'es_aplicacion_movil', etiqueta: 'Es de Aplicación Móvil', tipo: 'check' },
    { nombre: 'ubicacion_reserva', etiqueta: 'Ubicación Reserva', tipo: 'texto' },
    { nombre: 'tipo_documento_movimiento', etiqueta: 'Tipo Documento para Movimiento', tipo: 'texto' },
    { nombre: 'sede', etiqueta: 'Sede', tipo: 'texto' },
    { nombre: 'custodio_bodega', etiqueta: 'Custodio de Bodega', tipo: 'texto' },
    { nombre: 'responsable_bodega', etiqueta: 'Responsable de Bodega', tipo: 'texto' },
    { nombre: 'tipo_documento', etiqueta: 'Tipo de Documento', tipo: 'texto' },
    { nombre: 'tipo_autorizacion_devolucion', etiqueta: 'Tipo Autorización Devolución', tipo: 'texto' },
  ],

  BANCOS: [
    { 
      nombre: 'organizacion', 
      etiqueta: 'Organización', 
      tipo: 'texto', 
      requerido: true 
    },
    {
      nombre: 'tipo_fondo',
      etiqueta: 'Tipo de Fondo',
      tipo: 'select',
      opciones: ['FONDO ROTATIVO', 'CUENTA BANCARIA'],
      requerido: true,
    },
    { 
      nombre: 'responsable', 
      etiqueta: 'Responsable', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'entidad_bancaria', 
      etiqueta: 'Entidad Bancaria', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'cuenta_bancaria', 
      etiqueta: 'Cuenta Bancaria', 
      tipo: 'texto', 
      requerido: true 
    },
    {
      nombre: 'tipo_cuenta',
      etiqueta: 'Tipo de Cuenta',
      tipo: 'select',
      opciones: ['AHORROS', 'CUENTA CORRIENTE'],
    },
    { 
      nombre: 'beneficiario', 
      etiqueta: 'Beneficiario', 
      tipo: 'texto' 
    },
    { 
      nombre: 'cedula_rif_beneficiario', 
      etiqueta: 'Nro. Cédula o RIF del Beneficiario', 
      tipo: 'texto' 
    },
  ],

  CLIENTE: [
    // === CAMPOS OBLIGATORIOS ===
    { 
      nombre: 'rif', 
      etiqueta: 'RIF', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'nombre', 
      etiqueta: 'Nombre Cliente', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'direccion_fiscal', 
      etiqueta: 'Dirección Fiscal', 
      tipo: 'area', 
      spanCompleto: true,
      requerido: true 
    },
    { 
      nombre: 'direccion_entrega', 
      etiqueta: 'Dirección de Entrega', 
      tipo: 'area', 
      spanCompleto: true,
      requerido: true 
    },
    { 
      nombre: 'persona_contacto', 
      etiqueta: 'Persona de Contacto', 
      tipo: 'texto',
      requerido: true 
    },
    { 
      nombre: 'telefono_contacto', 
      etiqueta: 'Nro. Teléfono Persona de Contacto', 
      tipo: 'texto',
      requerido: true 
    },

    // === CAMPOS OPCIONALES ===
    { 
      nombre: 'tipo_cliente', 
      etiqueta: 'Tipo Cliente', 
      tipo: 'texto' 
    },
    { 
      nombre: 'tipo_vehiculo', 
      etiqueta: 'Tipo de Vehículo', 
      tipo: 'texto' 
    },
    { 
      nombre: 'condiciones_credito', 
      etiqueta: 'Condiciones de Crédito', 
      tipo: 'texto' 
    },
    { 
      nombre: 'lista_precios', 
      etiqueta: 'Lista de Precios', 
      tipo: 'texto' 
    },
    { 
      nombre: 'ciudad', 
      etiqueta: 'Ciudad', 
      tipo: 'texto' 
    },
    { 
      nombre: 'estado', 
      etiqueta: 'Estado', 
      tipo: 'texto' 
    },
    { 
      nombre: 'regiones', 
      etiqueta: 'Regiones', 
      tipo: 'texto' 
    },
    { 
      nombre: 'dias_despacho', 
      etiqueta: 'Días Despacho', 
      tipo: 'numero' 
    },
    { 
      nombre: 'asesor_comercializacion', 
      etiqueta: 'Asesor de Comercialización', 
      tipo: 'texto' 
    },
    { 
      nombre: 'region', 
      etiqueta: 'Región', 
      tipo: 'texto' 
    },
    { 
      nombre: 'zonas', 
      etiqueta: 'Zonas', 
      tipo: 'texto' 
    },
    { 
      nombre: 'coordinador', 
      etiqueta: 'Coordinador', 
      tipo: 'texto' 
    },
    { 
      nombre: 'correo_electronico', 
      etiqueta: 'Correo Electrónico', 
      tipo: 'texto' 
    },
    { 
      nombre: 'estatus', 
      etiqueta: 'Estatus', 
      tipo: 'select', 
      opciones: ['ACTIVO', 'INACTIVO'] 
    },
    { 
      nombre: 'contribuyente_especial', 
      etiqueta: 'Contribuyente Especial', 
      tipo: 'check' 
    },
    { 
      nombre: 'ano_formula', 
      etiqueta: 'Año Fórmula', 
      tipo: 'numero' 
    },
    { 
      nombre: 'fecha_envio', 
      etiqueta: 'Fecha de Envío', 
      tipo: 'datetime',
      requerido: true 
    },
  ],

  'PALETAS O BIG BAG': [
    { 
      nombre: 'empresa', 
      etiqueta: 'Empresa', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'sede', 
      etiqueta: 'Sede', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'numero_paleta', 
      etiqueta: 'Número de Paleta o Big Bag', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'peso', 
      etiqueta: 'Peso (kg)', 
      tipo: 'numero', 
      requerido: true 
    },
    { 
      nombre: 'nombre_solicitante', 
      etiqueta: 'Nombre del Solicitante', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'fecha_solicitud', 
      etiqueta: 'Fecha Solicitud', 
      tipo: 'date', 
      requerido: true 
    },
  ],

  PRODUCTOR: [
    { 
      nombre: 'organizacion', 
      etiqueta: 'Organización', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'codigo_tercero', 
      etiqueta: 'Código Tercero (Idempiere)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre', 
      etiqueta: 'Nombre', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'direccion_fiscal', 
      etiqueta: 'Dirección Fiscal', 
      tipo: 'area', 
      spanCompleto: true,
      requerido: true 
    },
    { 
      nombre: 'ciudad_fiscal', 
      etiqueta: 'Ciudad (Fiscal)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'estado_fiscal', 
      etiqueta: 'Estado (Fiscal)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'direccion_entrega', 
      etiqueta: 'Dirección de Entrega', 
      tipo: 'area', 
      spanCompleto: true,
      requerido: true 
    },
    { 
      nombre: 'ciudad_entrega', 
      etiqueta: 'Ciudad (Entrega)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'estado_entrega', 
      etiqueta: 'Estado (Entrega)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'telefono', 
      etiqueta: 'Nro. Teléfono', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'cliente', 
      etiqueta: 'Cliente', 
      tipo: 'texto' 
    },
  ],

  'PRODUCTOS & ATRIBUTOS': [
    { 
      nombre: 'empresa', 
      etiqueta: 'Empresa', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'clasificacion', 
      etiqueta: 'Clasificación del Producto', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre_item', 
      etiqueta: 'Nombre del Ítem', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'unidad_medida_base', 
      etiqueta: 'Unidad de Medida (Base)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'unidad_medida_conversion', 
      etiqueta: 'Unidad de Medida (Conversión)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre_conjunto_atributo', 
      etiqueta: 'Nombre del Conjunto & Atributo', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre_valor_atributo', 
      etiqueta: 'Nombre del Valor Atributo', 
      tipo: 'texto' 
    },
    { 
      nombre: 'observaciones', 
      etiqueta: 'Observaciones', 
      tipo: 'area', 
      spanCompleto: true 
    },
    { 
      nombre: 'fecha_solicitud', 
      etiqueta: 'Fecha Solicitud (Día/Hora)', 
      tipo: 'datetime', 
      requerido: true 
    },
  ],

  'PROVEEDOR-AUTORIZADO': [
    // === CAMPOS OBLIGATORIOS ===
    { 
      nombre: 'rif', 
      etiqueta: 'RIF', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'nombre', 
      etiqueta: 'Nombre de Tercero', 
      tipo: 'texto', 
      requerido: true 
    },
    {
      nombre: 'grupo_tercero',
      etiqueta: 'Grupo de Tercero',
      tipo: 'select',
      opciones: ['PROVEEDOR-NACIONAL', 'PROVEEDOR-INTERNACIONAL', 'TERCERO AUTORIZADO'],
      requerido: true,
    },
    { 
      nombre: 'direccion', 
      etiqueta: 'Dirección (Domicilio Fiscal)', 
      tipo: 'area', 
      spanCompleto: true,
      requerido: true 
    },
    { 
      nombre: 'pais', 
      etiqueta: 'País', 
      tipo: 'texto', 
      requerido: true 
    },

    // === CAMPOS OPCIONALES ===
    { 
      nombre: 'estado', 
      etiqueta: 'Estado', 
      tipo: 'texto' 
    },
    { 
      nombre: 'ciudad', 
      etiqueta: 'Ciudad', 
      tipo: 'texto' 
    },
    { 
      nombre: 'municipio', 
      etiqueta: 'Municipio', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre_banco', 
      etiqueta: 'Nombre del Banco', 
      tipo: 'texto' 
    },
    { 
      nombre: 'numero_cuenta_nacional', 
      etiqueta: 'Nro. Cuenta Bancaria Nacional', 
      tipo: 'texto' 
    },
    { 
      nombre: 'numero_cuenta_internacional', 
      etiqueta: 'Nro. Cuenta Bancaria Internacional', 
      tipo: 'texto' 
    },
    {
      nombre: 'tipo_cuenta',
      etiqueta: 'Tipo de Cuenta',
      tipo: 'select',
      opciones: [
        'AHORROS',
        'CUENTA CORRIENTE',
        'CAJA',
        'CUENTA CUSTODIO',
        'INTERNACIONAL',
        'TARJETA',
        'WALLET',
        'ZELLE',
      ],
    },
    { 
      nombre: 'cuenta_favorita', 
      etiqueta: 'Cuenta Favorita', 
      tipo: 'check' 
    },
    { 
      nombre: 'beneficiario_pago', 
      etiqueta: 'Beneficiario del Pago', 
      tipo: 'texto' 
    },
    { 
      nombre: 'cedula_rif_beneficiario', 
      etiqueta: 'Nro. Cédula o RIF del Beneficiario', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre_contacto', 
      etiqueta: 'Nombre del Contacto', 
      tipo: 'texto' 
    },
    { 
      nombre: 'telefono_contacto', 
      etiqueta: 'N° Teléfono', 
      tipo: 'texto' 
    },
    { 
      nombre: 'correo_contacto', 
      etiqueta: 'Correo Electrónico', 
      tipo: 'texto' 
    },
    { 
      nombre: 'observaciones', 
      etiqueta: 'Observaciones', 
      tipo: 'area', 
      spanCompleto: true 
    },
    { 
      nombre: 'solicitante_requerimiento', 
      etiqueta: 'Solicitante del Requerimiento', 
      tipo: 'texto' 
    },
    { 
      nombre: 'fecha_solicitud', 
      etiqueta: 'Fecha Solicitud (Día/Hora)', 
      tipo: 'datetime', 
      requerido: true 
    },
  ],

  'REGION DE VENTAS': [
    { 
      nombre: 'codigo', 
      etiqueta: 'Código', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'nombre', 
      etiqueta: 'Nombre', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'representante_actual', 
      etiqueta: 'Representante Comercial ACTUAL', 
      tipo: 'texto' 
    },
    { 
      nombre: 'acumular_nivel', 
      etiqueta: 'Acumular Nivel', 
      tipo: 'select', 
      opciones: ['SI', 'NO'] 
    },
    { 
      nombre: 'representante_nuevo', 
      etiqueta: 'Representante Comercial NUEVO', 
      tipo: 'texto' 
    },
  ],

  'TRANSPORTISTA - CHOFER': [
    { 
      nombre: 'organizacion', 
      etiqueta: 'Organización', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'codigo', 
      etiqueta: 'Código', 
      tipo: 'texto' 
    },
    { 
      nombre: 'nombre', 
      etiqueta: 'Nombre', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'tercero', 
      etiqueta: 'Tercero (Transportista)', 
      tipo: 'texto', 
      requerido: true 
    },
    { 
      nombre: 'placa', 
      etiqueta: 'Placa', 
      tipo: 'texto' 
    },
    { 
      nombre: 'modelo', 
      etiqueta: 'Modelo', 
      tipo: 'texto' 
    },
    { 
      nombre: 'capacidad', 
      etiqueta: 'Capacidad', 
      tipo: 'numero' 
    },
    { 
      nombre: 'color', 
      etiqueta: 'Descripción (Color)', 
      tipo: 'texto' 
    },
    { 
      nombre: 'es_plataforma', 
      etiqueta: 'Es Plataforma', 
      tipo: 'check' 
    },
  ],
};

// ---------------------------------------------------------------------------
// Checklist de documentos por categoría
// ---------------------------------------------------------------------------

export const REQUERIMIENTOS_POR_CATEGORIA: Record<string, string[]> = {
  ALMACEN: [],
  BANCOS: [], // No requiere documentos
  CLIENTE: [
    'REGISTRO MERCANTIL',
    'RIF',
    'COMPROBANTE DE SENIAT',
    'CEDULA',
    'SUNAGRO',
    'PLANILLA'
  ],
  'PALETAS O BIG BAG': [], // No requiere documentos
  'PRODUCTOR': [], // No requiere documentos
  'PRODUCTOS & ATRIBUTOS': [], // No requiere documentos
  'PROVEEDOR-AUTORIZADO': [
    'RIF',
    'REFERENCIA BANCARIA',
    'REGISTRO MERCANTIL (PARA SOCIOS)',
    'AUTORIZACION FIRMADA Y SELLADA',
  ],
  'REGION DE VENTAS': [], // No requiere documentos
  'TRANSPORTISTA - CHOFER': [], // No requiere documentos
};

/** Obtiene el nombre legible de una categoría (normalizado). */
export function normalizarCategoria(categoria: string): string {
  return categoria
    .split(' ')
    .map((palabra) => (palabra ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase() : ''))
    .join(' ');
}