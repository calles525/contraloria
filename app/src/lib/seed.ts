// Semilla de datos de ejemplo (primera carga).
import type { AppState, Departamento, Solicitud, Usuario } from './types';

const diasAtras = (n: number): string =>
  new Date(Date.now() - n * 86400000).toISOString();

function seedDepartamentos(): Departamento[] {
  return [
    { id: 1, nombre: 'Compras', descripcion: 'Gestión de adquisiciones y compras.', responsableId: 1, usuariosIds: [1], activo: true },
    { id: 2, nombre: 'Contabilidad', descripcion: 'Registro contable y financiero.', responsableId: null, usuariosIds: [], activo: true },
    { id: 3, nombre: 'Logística', descripcion: 'Coordinación de logística y almacén.', responsableId: 4, usuariosIds: [4], activo: true },
    { id: 4, nombre: 'Recursos Humanos', descripcion: 'Gestión de talento humano.', responsableId: null, usuariosIds: [], activo: true },
    { id: 5, nombre: 'Contraloría', descripcion: 'Control y fiscalización interna.', responsableId: 3, usuariosIds: [2, 3], activo: true },
  ];
}

function seedUsuarios(): Usuario[] {
  return [
    { id: 1, nombre: 'Ana Rodríguez', email: 'ana@compras.com', rol: 'solicitante', departamentoId: 1, departamentoNombre: 'Compras', cargo: 'Analista de Compras', activo: true, password: '1234' },
    { id: 2, nombre: 'Carlos Pérez', email: 'carlos@contraloria.com', rol: 'departamento', departamentoId: 5, departamentoNombre: 'Contraloría', cargo: 'Auditor', activo: true, password: '1234' },
    { id: 3, nombre: 'Luis Fernández', email: 'luis@contraloria.com', rol: 'contraloria', departamentoId: 5, departamentoNombre: 'Contraloría', cargo: 'Contralor', activo: true, password: '1234' },
    { id: 4, nombre: 'María Gómez', email: 'maria@logistica.com', rol: 'solicitante', departamentoId: 3, departamentoNombre: 'Logística', cargo: 'Coordinadora', activo: true, password: '1234' },
    { id: 5, nombre: 'Juan Méndez', email: 'admin@admin.com', rol: 'admin', departamentoId: 4, departamentoNombre: 'Recursos Humanos', cargo: 'Administrador del sistema', activo: true, password: '1234' },
  ];
}

function seedSolicitudes(): Solicitud[] {
  return [
    {
      id: 1, numeroSolicitud: 'SOL-2026-0001', tipo: 'creacion_tercero', titulo: 'Registro de proveedor Construcciones CA',
      descripcion: 'Solicitud de creación de tercero para nuevo proveedor de materiales.',
      prioridad: 'alta', fechaRequerida: diasAtras(-2), estado: 'en_contraloria',
      creadorId: 1, creadorNombre: 'Ana Rodríguez', departamentoOrigenId: 1, departamentoOrigenNombre: 'Compras',
      departamentoDestinoId: 5, departamentoDestinoNombre: 'Contraloría', asignadoA: 2, asignadoANombre: 'Carlos Pérez',
      fechaCreacion: diasAtras(10), fechaEnvio: diasAtras(9), fechaRevisionDepartamento: diasAtras(6), fechaAprobacionContraloria: null, fechaFinalizacion: null,
      datosEspecificos: { nombreTercero: 'Construcciones CA', rifTercero: 'J-12345678-9', emailTercero: 'contacto@construcciones.com', telefonoTercero: '0412-555-1234', tipoPersona: 'Jurídica' },
      documentos: [{ nombre: 'RIF.pdf', size: '120 KB', fecha: diasAtras(10) }],
      historial: [
        { fecha: diasAtras(10), usuarioId: 1, usuarioNombre: 'Ana Rodríguez', estadoAnterior: null, estadoNuevo: 'borrador', comentario: 'Solicitud creada.' },
        { fecha: diasAtras(9), usuarioId: 1, usuarioNombre: 'Ana Rodríguez', estadoAnterior: 'borrador', estadoNuevo: 'enviado', comentario: 'Enviada a Contraloría.' },
        { fecha: diasAtras(6), usuarioId: 2, usuarioNombre: 'Carlos Pérez', estadoAnterior: 'enviado', estadoNuevo: 'en_contraloria', comentario: 'Revisada y aprobada por el departamento.' },
      ],
      comentarios: [{ fecha: diasAtras(5), usuarioId: 2, usuarioNombre: 'Carlos Pérez', texto: 'Favor verificar RIF antes de aprobar.' }],
      ultimaModificacion: diasAtras(5), activo: true,
    },
    {
      id: 2, numeroSolicitud: 'SOL-2026-0002', tipo: 'viaticos', titulo: 'Viáticos viaje a Maracaibo',
      descripcion: 'Viáticos para auditoría de campo en Maracaibo.',
      prioridad: 'media', fechaRequerida: diasAtras(5), estado: 'aprobado',
      creadorId: 4, creadorNombre: 'María Gómez', departamentoOrigenId: 3, departamentoOrigenNombre: 'Logística',
      departamentoDestinoId: 5, departamentoDestinoNombre: 'Contraloría', asignadoA: 3, asignadoANombre: 'Luis Fernández',
      fechaCreacion: diasAtras(14), fechaEnvio: diasAtras(13), fechaRevisionDepartamento: diasAtras(11), fechaAprobacionContraloria: diasAtras(7), fechaFinalizacion: diasAtras(7),
      datosEspecificos: { destino: 'Maracaibo', fechaSalida: diasAtras(3), fechaRegreso: diasAtras(1), motivoViaje: 'Auditoría de campo', presupuestoEstimado: '1500' },
      documentos: [],
      historial: [
        { fecha: diasAtras(14), usuarioId: 4, usuarioNombre: 'María Gómez', estadoAnterior: null, estadoNuevo: 'borrador', comentario: 'Solicitud creada.' },
        { fecha: diasAtras(13), usuarioId: 4, usuarioNombre: 'María Gómez', estadoAnterior: 'borrador', estadoNuevo: 'enviado', comentario: 'Enviada.' },
        { fecha: diasAtras(11), usuarioId: 2, usuarioNombre: 'Carlos Pérez', estadoAnterior: 'enviado', estadoNuevo: 'en_contraloria', comentario: 'Aprobada por departamento.' },
        { fecha: diasAtras(7), usuarioId: 3, usuarioNombre: 'Luis Fernández', estadoAnterior: 'en_contraloria', estadoNuevo: 'aprobado', comentario: 'Aprobación definitiva.' },
      ],
      comentarios: [],
      ultimaModificacion: diasAtras(7), activo: true,
    },
    {
      id: 3, numeroSolicitud: 'SOL-2026-0003', tipo: 'solicitud_compra', titulo: 'Compra de equipos de oficina',
      descripcion: 'Adquisición de laptops y monitores para el departamento.',
      prioridad: 'alta', fechaRequerida: diasAtras(1), estado: 'ajustes_requeridos',
      creadorId: 1, creadorNombre: 'Ana Rodríguez', departamentoOrigenId: 1, departamentoOrigenNombre: 'Compras',
      departamentoDestinoId: 5, departamentoDestinoNombre: 'Contraloría', asignadoA: 3, asignadoANombre: 'Luis Fernández',
      fechaCreacion: diasAtras(8), fechaEnvio: diasAtras(7), fechaRevisionDepartamento: diasAtras(5), fechaAprobacionContraloria: null, fechaFinalizacion: null,
      datosEspecificos: { descripcionBien: '5 laptops + 3 monitores', montoEstimado: '45000', proveedor: 'Tecnoshop', justificacion: 'Renovación de equipos obsoletos' },
      documentos: [{ nombre: 'Cotizacion.xlsx', size: '45 KB', fecha: diasAtras(8) }],
      historial: [
        { fecha: diasAtras(8), usuarioId: 1, usuarioNombre: 'Ana Rodríguez', estadoAnterior: null, estadoNuevo: 'borrador', comentario: 'Creada.' },
        { fecha: diasAtras(7), usuarioId: 1, usuarioNombre: 'Ana Rodríguez', estadoAnterior: 'borrador', estadoNuevo: 'enviado', comentario: 'Enviada.' },
        { fecha: diasAtras(5), usuarioId: 2, usuarioNombre: 'Carlos Pérez', estadoAnterior: 'enviado', estadoNuevo: 'en_contraloria', comentario: 'Aprobada por departamento.' },
        { fecha: diasAtras(2), usuarioId: 3, usuarioNombre: 'Luis Fernández', estadoAnterior: 'en_contraloria', estadoNuevo: 'ajustes_requeridos', comentario: 'Falta justificar montos por unidad.' },
      ],
      comentarios: [{ fecha: diasAtras(2), usuarioId: 3, usuarioNombre: 'Luis Fernández', texto: 'Enviar desglose de montos por ítem.' }],
      ultimaModificacion: diasAtras(2), activo: true,
    },
    {
      id: 4, numeroSolicitud: 'SOL-2026-0004', tipo: 'registro_producto', titulo: 'Registro de producto Detergente X',
      descripcion: 'Alta de nuevo producto de limpieza en el catálogo.',
      prioridad: 'baja', fechaRequerida: diasAtras(-6), estado: 'enviado',
      creadorId: 4, creadorNombre: 'María Gómez', departamentoOrigenId: 3, departamentoOrigenNombre: 'Logística',
      departamentoDestinoId: 5, departamentoDestinoNombre: 'Contraloría', asignadoA: null, asignadoANombre: '',
      fechaCreacion: diasAtras(3), fechaEnvio: diasAtras(3), fechaRevisionDepartamento: null, fechaAprobacionContraloria: null, fechaFinalizacion: null,
      datosEspecificos: { codigoProducto: 'PROD-0012', nombreProducto: 'Detergente X', categoriaProducto: 'Limpieza', marca: 'LimpiaYa', cantidad: '500', unidadMedida: 'litros' },
      documentos: [],
      historial: [
        { fecha: diasAtras(3), usuarioId: 4, usuarioNombre: 'María Gómez', estadoAnterior: null, estadoNuevo: 'enviado', comentario: 'Solicitud creada y enviada.' },
      ],
      comentarios: [],
      ultimaModificacion: diasAtras(3), activo: true,
    },
    {
      id: 5, numeroSolicitud: 'SOL-2026-0005', tipo: 'otro', titulo: 'Solicitud de copias certificadas',
      descripcion: 'Copias certificadas de actas de reunión del primer trimestre.',
      prioridad: 'media', fechaRequerida: diasAtras(3), estado: 'borrador',
      creadorId: 1, creadorNombre: 'Ana Rodríguez', departamentoOrigenId: 1, departamentoOrigenNombre: 'Compras',
      departamentoDestinoId: 5, departamentoDestinoNombre: 'Contraloría', asignadoA: null, asignadoANombre: '',
      fechaCreacion: diasAtras(1), fechaEnvio: null, fechaRevisionDepartamento: null, fechaAprobacionContraloria: null, fechaFinalizacion: null,
      datosEspecificos: { detalle: 'Se requieren 4 copias certificadas de las actas Q1.' },
      documentos: [],
      historial: [{ fecha: diasAtras(1), usuarioId: 1, usuarioNombre: 'Ana Rodríguez', estadoAnterior: null, estadoNuevo: 'borrador', comentario: 'Solicitud creada.' }],
      comentarios: [],
      ultimaModificacion: diasAtras(1), activo: true,
    },
  ];
}

export function crearEstadoSemilla(): AppState {
  const solicitudes = seedSolicitudes();
  return {
    usuarios: seedUsuarios(),
    departamentos: seedDepartamentos(),
    solicitudes,
    config: { nextSolicitud: solicitudes.length + 1 },
  };
}
