// Almacén de datos: gestión del estado y persistencia en localStorage.
import { crearEstadoSemilla } from './seed';
import type {
  AppState,
  Departamento,
  FiltroSolicitud,
  HistorialEntry,
  Solicitud,
  Usuario,
} from './types';

const STORAGE_KEY = 'sigid_data_v1';
const SESSION_KEY = 'sigid_session_v1';
const THEME_KEY = 'sigid_theme_v1';

class Store {
  private state: AppState;

  constructor() {
    this.state = this.cargar();
  }

  private cargar(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && Array.isArray(parsed.usuarios)) return parsed;
      }
    } catch {
      // Datos corruptos: se regeneran.
    }
    return crearEstadoSemilla();
  }

  private persistir(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('No se pudieron persistir los datos', err);
    }
  }

  // ------------------------------ RECURSOS ------------------------------
  obtenerEstado = (): AppState => this.state;

  limpiarAlmacen = (): void => {
    this.state = crearEstadoSemilla();
    this.persistir();
  };

  // ------------------------------ USUARIOS ------------------------------
  getUsuarios = (): Usuario[] => this.state.usuarios;

  getUsuario = (id: number): Usuario | undefined =>
    this.state.usuarios.find((u) => u.id === id);

  getUsuarioActual = (): Usuario | null => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const id = Number(raw);
    const user = this.state.usuarios.find((u) => u.id === id);
    return user && user.activo ? user : null;
  };

  login = (email: string, password: string): Usuario | null => {
    const user = this.state.usuarios.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    );
    if (!user || !user.activo) return null;
    localStorage.setItem(SESSION_KEY, String(user.id));
    return user;
  };

  logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
  };

  guardarUsuario = (usuario: Usuario): Usuario => {
    const dept = this.state.departamentos.find((d) => d.id === usuario.departamentoId);
    usuario.departamentoNombre = dept?.nombre ?? '';
    if (usuario.id === undefined || usuario.id === 0) {
      usuario.id = this.siguienteId(this.state.usuarios);
      this.state.usuarios.push(usuario);
    } else {
      const i = this.state.usuarios.findIndex((u) => u.id === usuario.id);
      if (i >= 0) this.state.usuarios[i] = usuario;
    }
    this.persistir();
    return usuario;
  };

  eliminarUsuario = (id: number): void => {
    this.state.usuarios = this.state.usuarios.filter((u) => u.id !== id);
    this.persistir();
  };

  // ---------------------------- DEPARTAMENTOS ----------------------------
  getDepartamentos = (): Departamento[] => this.state.departamentos;

  getDepartamento = (id: number): Departamento | undefined =>
    this.state.departamentos.find((d) => d.id === id);

  guardarDepartamento = (dept: Departamento): Departamento => {
    if (dept.id === undefined || dept.id === 0) {
      dept.id = this.siguienteId(this.state.departamentos);
      this.state.departamentos.push(dept);
    } else {
      const i = this.state.departamentos.findIndex((d) => d.id === dept.id);
      if (i >= 0) this.state.departamentos[i] = dept;
    }
    this.persistir();
    return dept;
  };

  eliminarDepartamento = (id: number): void => {
    this.state.departamentos = this.state.departamentos.filter((d) => d.id !== id);
    this.persistir();
  };

  // ----------------------------- SOLICITUDES -----------------------------
  getSolicitudes = (filtro: FiltroSolicitud = {}): Solicitud[] => {
    let lista = [...this.state.solicitudes];
    const {
      estado, tipo, departamentoOrigenId, departamentoDestinoId, prioridad, buscar, desde, hasta,
    } = filtro;

    if (estado) lista = lista.filter((s) => s.estado === estado);
    if (tipo) lista = lista.filter((s) => s.tipo === tipo);
    if (prioridad) lista = lista.filter((s) => s.prioridad === prioridad);
    if (departamentoOrigenId) lista = lista.filter((s) => s.departamentoOrigenId === Number(departamentoOrigenId));
    if (departamentoDestinoId) lista = lista.filter((s) => s.departamentoDestinoId === Number(departamentoDestinoId));
    if (desde) lista = lista.filter((s) => new Date(s.fechaCreacion) >= new Date(desde));
    if (hasta) lista = lista.filter((s) => new Date(s.fechaCreacion) <= new Date(hasta));
    if (buscar) {
      const q = buscar.toLowerCase();
      lista = lista.filter((s) =>
        (s.numeroSolicitud ?? '').toLowerCase().includes(q) ||
        (s.titulo ?? '').toLowerCase().includes(q) ||
        (s.creadorNombre ?? '').toLowerCase().includes(q) ||
        (s.departamentoOrigenNombre ?? '').toLowerCase().includes(q),
      );
    }
    lista.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
    return lista;
  };

  getSolicitud = (id: number): Solicitud | undefined =>
    this.state.solicitudes.find((s) => s.id === id);

  guardarSolicitud = (solicitud: Solicitud): Solicitud => {
    const esNueva = solicitud.id === undefined || solicitud.id === 0;
    if (esNueva) {
      solicitud.id = this.siguienteId(this.state.solicitudes);
      solicitud.numeroSolicitud = this.generarNumero(solicitud.id);
      solicitud.fechaCreacion = new Date().toISOString();
      solicitud.ultimaModificacion = new Date().toISOString();
      solicitud.historial = solicitud.historial ?? [];
      solicitud.comentarios = solicitud.comentarios ?? [];
      solicitud.documentos = solicitud.documentos ?? [];
      this.state.solicitudes.push(solicitud);
    } else {
      solicitud.ultimaModificacion = new Date().toISOString();
      const i = this.state.solicitudes.findIndex((s) => s.id === solicitud.id);
      if (i >= 0) this.state.solicitudes[i] = solicitud;
    }
    this.persistir();
    return solicitud;
  };

  eliminarSolicitud = (id: number): void => {
    this.state.solicitudes = this.state.solicitudes.filter((s) => s.id !== id);
    this.persistir();
  };

  agregarHistorial = (
    solicitud: Solicitud,
    estadoAnterior: HistorialEntry['estadoAnterior'],
    estadoNuevo: HistorialEntry['estadoNuevo'],
    comentario: string,
    usuario: Usuario,
  ): void => {
    const entry: HistorialEntry = {
      fecha: new Date().toISOString(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      estadoAnterior,
      estadoNuevo,
      comentario,
    };
    solicitud.historial = solicitud.historial ?? [];
    solicitud.historial.push(entry);
  };

  agregarComentario = (solicitud: Solicitud, texto: string, usuario: Usuario): void => {
    solicitud.comentarios = solicitud.comentarios ?? [];
    solicitud.comentarios.push({
      fecha: new Date().toISOString(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      texto,
    });
    solicitud.ultimaModificacion = new Date().toISOString();
    this.persistir();
  };

  // ----------------------------- UTILIDADES -----------------------------
  private siguienteId = (arr: Array<{ id: number }>): number =>
    arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;

  private generarNumero = (id: number): string =>
    `SOL-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

export const store = new Store();

export { STORAGE_KEY, SESSION_KEY, THEME_KEY };
