/**
 * ============================================================================
 * CAPA DE DATOS (Data Layer)
 * ----------------------------------------------------------------------------
 * Aquí se definen:
 *  - Las constantes de catálogos (roles, estados, tipos, prioridades)
 *  - Los modelos base de las entidades (Usuarios, Departamentos, Solicitudes)
 *  - El gestor de persistencia en localStorage (DataStore)
 *  - Los datos de ejemplo que se cargan la primera vez
 *
 * El estado de la aplicación vive EN MEMORIA en `DataStore.state` y se
 * sincroniza a localStorage tras cada mutación (guardar/actualizar/eliminar),
 * de forma que los datos persisten al recargar la página.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// CATÁLOGOS (valores permitidos)
// ---------------------------------------------------------------------------
const ROLES = {
  solicitante: 'Solicitante',
  departamento: 'Departamento',
  contraloria: 'Contraloría',
  admin: 'Administrador',
};

const ESTADOS = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  en_revision_departamento: 'En revisión (departamento)',
  en_contraloria: 'En contraloría',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  ajustes_requeridos: 'Ajustes requeridos',
};

// Agrupación de estados por etapa del flujo, útil para pestañas/contadores.
const ESTADO_GRUPOS = {
  pendientes: ['enviado', 'en_revision_departamento', 'ajustes_requeridos'],
  enRevision: ['en_contraloria', 'en_revision_departamento', 'ajustes_requeridos'],
  finalizados: ['aprobado', 'rechazado'],
};

const TIPOS = {
  creacion_tercero: 'Creación de Tercero',
  registro_producto: 'Registro de Producto',
  solicitud_compra: 'Solicitud de Compra',
  viaticos: 'Viáticos',
  otro: 'Otro',
};

const PRIORIDADES = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

// Clase de color (para badges / estilos dinámicos) por estado y prioridad.
const ESTADO_COLOR = {
  borrador: 'slate',
  enviado: 'info',
  en_revision_departamento: 'warning',
  en_contraloria: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
  ajustes_requeridos: 'danger',
};

const PRIORIDAD_COLOR = {
  alta: 'danger',
  media: 'warning',
  baja: 'success',
};

// Campos condicionales obligatorios según el tipo de solicitud.
// Se usan en el Paso 2 del wizard y en las validaciones.
const TIPO_CAMPOS = {
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
  otro: [
    { key: 'detalle', label: 'Detalle de la solicitud', type: 'textarea', required: true },
  ],
};

// ---------------------------------------------------------------------------
// DATASTORE: gestor de estado + localStorage
// ---------------------------------------------------------------------------
const DataStore = {
  STORAGE_KEY: 'sigid_data_v1',
  SESSION_KEY: 'sigid_session_v1',
  THEME_KEY: 'sigid_theme_v1',

  // Estado en memoria (fuente de la verdad durante la sesión).
  state: {
    usuarios: [],
    departamentos: [],
    solicitudes: [],
    config: {},
  },

  // ------------------------------------------------------------------
  // Mantis: cambiar el estado de las solicitudes.
  // ------------------------------------------------------------------

  init() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try { this.state = JSON.parse(raw); } catch (e) { this.loadSeed(); }
    } else {
      this.loadSeed();
    }
    this.persist();
  },

  // Carga los datos de ejemplo la primera vez.
  loadSeed() {
    this.state = {
      usuarios: seedUsuarios(),
      departamentos: seedDepartamentos(),
      solicitudes: seedSolicitudes(),
      config: { nextSolicitud: seedSolicitudes().length + 1 },
    };
  },

  persist() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  },

  // --------------------------- USUARIOS ---------------------------
  getUsuarios() { return this.state.usuarios; },

  getUsuario(id) {
    return this.state.usuarios.find((u) => u.id === id);
  },

  // Encuentra el usuario autenticado en la sesión actual.
  getCurrentUser() {
    const id = localStorage.getItem(this.SESSION_KEY);
    if (!id) return null;
    const user = this.state.usuarios.find((u) => u.id === Number(id));
    return user && user.activo ? user : null;
  },

  saveUsuario(usuario) {
    // Asignar la referencia al departamento del usuario (denormalizado para UI).
    const dept = this.state.departamentos.find((d) => d.id === usuario.departamentoId);
    usuario.departamentoNombre = dept ? dept.nombre : '';
    if (usuario.id === undefined) {
      usuario.id = this.nextId(this.state.usuarios);
      this.state.usuarios.push(usuario);
    } else {
      const i = this.state.usuarios.findIndex((u) => u.id === usuario.id);
      if (i >= 0) this.state.usuarios[i] = usuario;
    }
    this.persist();
    return usuario;
  },

  deleteUsuario(id) {
    this.state.usuarios = this.state.usuarios.filter((u) => u.id !== id);
    this.persist();
  },

  // ------------------------- DEPARTAMENTOS -------------------------
  getDepartamentos() { return this.state.departamentos; },

  getDepartamento(id) {
    return this.state.departamentos.find((d) => d.id === id);
  },

  saveDepartamento(dept) {
    if (dept.id === undefined) {
      dept.id = this.nextId(this.state.departamentos);
      this.state.departamentos.push(dept);
    } else {
      const i = this.state.departamentos.findIndex((d) => d.id === dept.id);
      if (i >= 0) this.state.departamentos[i] = dept;
    }
    this.persist();
    // Actualizar nombre de departamento en solicitudes/usuario denormalizados.
    App && App.refresh();
    return dept;
  },

  deleteDepartamento(id) {
    this.state.departamentos = this.state.departamentos.filter((d) => d.id !== id);
    this.persist();
  },

  // ------------------------- SOLICITUDES -------------------------
  getSolicitudes(filtro = {}) {
    let lista = [...this.state.solicitudes];
    const { estado, tipo, departamentoOrigenId, departamentoDestinoId, prioridad, buscar, desde, hasta } = filtro;

    if (estado) lista = lista.filter((s) => s.estado === estado);
    if (tipo) lista = lista.filter((s) => s.tipo === tipo);
    if (prioridad) lista = lista.filter((s) => s.prioridad === prioridad);
    if (departamentoOrigenId) lista = lista.filter((s) => s.departamentoOrigenId === departamentoOrigenId);
    if (departamentoDestinoId) lista = lista.filter((s) => s.departamentoDestinoId === departamentoDestinoId);
    if (desde) lista = lista.filter((s) => new Date(s.fechaCreacion) >= new Date(desde));
    if (hasta) lista = lista.filter((s) => new Date(s.fechaCreacion) <= new Date(hasta));
    if (buscar) {
      const q = buscar.toLowerCase();
      lista = lista.filter((s) =>
        (s.numeroSolicitud || '').toLowerCase().includes(q) ||
        (s.titulo || '').toLowerCase().includes(q) ||
        (s.creadorNombre || '').toLowerCase().includes(q) ||
        (s.tipo || '').toLowerCase().includes(q)
      );
    }

    // Ordenar por fecha de creación (más recientes primero).
    lista.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    return lista;
  },

  getSolicitud(id) {
    return this.state.solicitudes.find((s) => s.id === id);
  },

  saveSolicitud(sol, opciones = {}) {
    const esNueva = sol.id === undefined;
    if (esNueva) {
      sol.id = this.nextId(this.state.solicitudes);
      sol.numeroSolicitud = this.buildNumeroSolicitud(sol.id);
      sol.fechaCreacion = sol.fechaCreacion || this.nowISO();
      sol.ultimaModificacion = this.nowISO();
      sol.historial = sol.historial || [];
      sol.comentarios = sol.comentarios || [];
      sol.documentos = sol.documentos || [];
      this.state.solicitudes.push(sol);
    } else {
      sol.ultimaModificacion = this.nowISO();
      const i = this.state.solicitudes.findIndex((s) => s.id === sol.id);
      if (i >= 0) this.state.solicitudes[i] = sol;
    }
    this.persist();
    return sol;
  },

  deleteSolicitud(id) {
    this.state.solicitudes = this.state.solicitudes.filter((s) => s.id !== id);
    this.persist();
  },

  // Agrega una entrada al historial de una solicitud.
  addHistorial(solicitud, estadoAnterior, estadoNuevo, comentario, usuario) {
    solicitud.historial.push({
      fecha: this.nowISO(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      estadoAnterior,
      estadoNuevo,
      comentario,
    });
  },

  // Agrega un comentario general (no asociado a cambio de estado).
  addComentario(solicitud, texto, usuario) {
    solicitud.comentarios.push({
      fecha: this.nowISO(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      texto,
    });
    solicitud.ultimaModificacion = this.nowISO();
    this.persist();
  },

  // -------------------------- UTILIDADES --------------------------
  nextId(arr) {
    return arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
  },

  buildNumeroSolicitud(id) {
    const y = new Date().getFullYear();
    return `SOL-${y}-${String(id).padStart(4, '0')}`;
  },

  nowISO() {
    return new Date().toISOString();
  },

  formatFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  },

  formatFechaCorta(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  },
};

// ---------------------------------------------------------------------------
// DATOS DE EJEMPLO
// ---------------------------------------------------------------------------
function seedDepartamentos() {
  return [
    { id: 1, nombre: 'Compras', descripcion: 'Gestión de adquisiciones y compras.', responsableId: 1, usuariosIds: [1], activo: true },
    { id: 2, nombre: 'Contabilidad', descripcion: 'Registro contable y financiero.', responsableId: null, usuariosIds: [], activo: true },
    { id: 3, nombre: 'Logística', descripcion: 'Coordinación de logística y almacén.', responsableId: 4, usuariosIds: [4], activo: true },
    { id: 4, nombre: 'Recursos Humanos', descripcion: 'Gestión de talento humano.', responsableId: null, usuariosIds: [], activo: true },
    { id: 5, nombre: 'Contraloría', descripcion: 'Control y fiscalización interna.', responsableId: 3, usuariosIds: [2, 3], activo: true },
  ];
}

function seedUsuarios() {
  // departamentoNombre se rellena automáticamente al guardar; aquí lo fijamos.
  return [
    { id: 1, nombre: 'Ana Rodríguez', email: 'ana@compras.com', rol: 'solicitante', departamentoId: 1, departamentoNombre: 'Compras', cargo: 'Analista de Compras', activo: true, password: '1234' },
    { id: 2, nombre: 'Carlos Pérez', email: 'carlos@contraloria.com', rol: 'departamento', departamentoId: 5, departamentoNombre: 'Contraloría', cargo: 'Auditor', activo: true, password: '1234' },
    { id: 3, nombre: 'Luis Fernández', email: 'luis@contraloria.com', rol: 'contraloria', departamentoId: 5, departamentoNombre: 'Contraloría', cargo: 'Contralor', activo: true, password: '1234' },
    { id: 4, nombre: 'María Gómez', email: 'maria@logistica.com', rol: 'solicitante', departamentoId: 3, departamentoNombre: 'Logística', cargo: 'Coordinadora', activo: true, password: '1234' },
    { id: 5, nombre: 'Juan Méndez', email: 'admin@admin.com', rol: 'admin', departamentoId: 4, departamentoNombre: 'Recursos Humanos', cargo: 'Administrador del sistema', activo: true, password: '1234' },
  ];
}

function seedSolicitudes() {
  const ahora = new Date();
  const diasAtras = (n) => new Date(ahora.getTime() - n * 86400000).toISOString();

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
      id: 4, numeroSolicitud: 'SOL-2026-0004', tipo: 'registro_producto', titulo: 'Registro de producto "Detergente X"',
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
