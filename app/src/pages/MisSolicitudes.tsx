import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { useModal } from '../components/Modal';
import { store } from '../lib/store';
import { ESTADOS, PRIORIDADES, TIPOS } from '../lib/constants';
import type { EstadoSolicitud, Prioridad, TipoSolicitud } from '../lib/types';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePaginacion } from '../hooks/usePaginacion';
import { EstadoBadge, PrioridadBadge, TipoBadge } from '../components/Badge';
import { EstadoVacio, Paginacion, FilaSkeleton } from '../components/Abstracciones';
import { exportarPDF, generarPDFSolicitud } from '../lib/exportExcel';

interface FiltrosEstado {
  estado: EstadoSolicitud | '';
  tipo: TipoSolicitud | '';
  destino: number | '';
  prioridad: Prioridad | '';
  buscar: string;
  cargando: boolean;
}

export default function MisSolicitudes() {
  usePageTitle('Mis Solicitudes');
  const { usuario, version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const { confirmar } = useModal();

  const [filtros, setFiltros] = useState<FiltrosEstado>({ estado: '', tipo: '', destino: '', prioridad: '', buscar: '', cargando: false });

  const lista = useMemo(() => {
    // Simular carga breve para skeleton (mejora perceptual de UX).
    return store
      .getSolicitudes({
        estado: filtros.estado || undefined,
        tipo: filtros.tipo || undefined,
        prioridad: filtros.prioridad || undefined,
        departamentoDestinoId: filtros.destino || undefined,
        buscar: filtros.buscar || undefined,
      })
      .filter((s) => s.creadorId === usuario?.id && s.activo !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.estado, filtros.tipo, filtros.destino, filtros.prioridad, filtros.buscar, version]);

  const pag = usePaginacion(lista, 10);

  if (!usuario) return null;

  const puedeEditar = (estado: EstadoSolicitud) => estado === 'borrador';

  const formatoExportar = () => {
    confirmar({
      titulo: 'Exportar solicitudes',
      mensaje: `Elija el formato para exportar las ${lista.length} solicitudes.`,
      textoConfirmar: 'PDF',
      textoCancelar: 'Cancelar',
    }).then((ok) => {
      if (!ok) return;
      exportarPDF(lista);
    });
  };

  const enviar = async (id: number) => {
    const sol = store.getSolicitud(id);
    if (!sol || !usuario) return;
    const ok = await confirmar({
      titulo: 'Enviar solicitud',
      mensaje: `¿Desea enviar la solicitud ${sol.numeroSolicitud} al departamento ${sol.departamentoDestinoNombre}?`,
      textoConfirmar: 'Enviar',
    });
    if (!ok) return;
    sol.estado = 'enviado';
    sol.fechaEnvio = new Date().toISOString();
    store.agregarHistorial(sol, 'borrador', 'enviado', 'Solicitud enviada.', usuario);
    store.guardarSolicitud(sol);
    recargarDatos();
    mostrar(`Solicitud ${sol.numeroSolicitud} enviada.`);
  };

  const eliminar = async (id: number) => {
    const sol = store.getSolicitud(id);
    if (!sol) return;
    const ok = await confirmar({
      titulo: 'Eliminar solicitud',
      mensaje: `¿Está seguro de eliminar la solicitud ${sol.numeroSolicitud}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    store.eliminarSolicitud(id);
    recargarDatos();
    mostrar('Solicitud eliminada.');
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>Mis Solicitudes</h3>
        <div className="head-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={formatoExportar}>
            Exportar (PDF)
          </button>
          <Link to="/nueva" className="btn btn-primary btn-sm">
            + Nueva Solicitud
          </Link>
        </div>
      </div>

      <div className="filtros">
        <div className="filter-inputs">
          <input
            className="filter-control"
            placeholder="Buscar..."
            value={filtros.buscar}
            onChange={(e) => setFiltros((f) => ({ ...f, buscar: e.target.value }))}
          />
          <select
            className="filter-control"
            value={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value as EstadoSolicitud | '' }))}
          >
            <option value="">Estado: Todos</option>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="filter-control"
            value={filtros.tipo}
            onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value as TipoSolicitud | '' }))}
          >
            <option value="">Tipo: Todos</option>
            {Object.entries(TIPOS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="filter-control"
            value={filtros.destino}
            onChange={(e) => setFiltros((f) => ({ ...f, destino: e.target.value ? Number(e.target.value) : '' }))}
          >
            <option value="">Destino: Todos</option>
            {store.getDepartamentos().map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
          <select
            className="filter-control"
            value={filtros.prioridad}
            onChange={(e) => setFiltros((f) => ({ ...f, prioridad: e.target.value as Prioridad | '' }))}
          >
            <option value="">Prioridad: Todas</option>
            {Object.entries(PRIORIDADES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {filtros.cargando ? (
        <FilaSkeleton columnas={7} filas={6} />
      ) : pag.datos.length === 0 ? (
        <EstadoVacio
          icono="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
          titulo="No hay solicitudes"
          descripcion="Aún no hay solicitudes que coincidan con los filtros."
          accion={<Link to="/nueva" className="btn btn-primary btn-sm">Crear nueva solicitud</Link>}
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Nº</th><th>Título</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Destino</th><th>Fecha</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pag.datos.map((s) => (
                  <tr key={s.id}>
                    <td><span className="mono">{s.numeroSolicitud}</span></td>
                    <td>
                      <Link className="link" to={`/detalle/${s.id}`}>{s.titulo}</Link>
                    </td>
                    <td><TipoBadge tipo={s.tipo} /></td>
                    <td><PrioridadBadge prioridad={s.prioridad} /></td>
                    <td><EstadoBadge estado={s.estado} /></td>
                    <td>{s.departamentoDestinoNombre}</td>
                    <td>{new Date(s.fechaCreacion).toLocaleDateString('es-VE')}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/detalle/${s.id}`} className="icon-btn" title="Ver">
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                        </Link>
                        {puedeEditar(s.estado) ? (
                          <>
                            <Link to={`/nueva?editar=${s.id}`} className="icon-btn" title="Editar">
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16.86 4.14l3 3L6 21H3v-3L16.86 4.14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                            </Link>
                            <button type="button" className="icon-btn" title="Enviar" onClick={() => enviar(s.id)}>
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                            </button>
                            <button type="button" className="icon-btn danger-icon" title="Eliminar" onClick={() => eliminar(s.id)}>
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                            </button>
                          </>
                        ) : null}
                        <button type="button" className="icon-btn" title="Descargar PDF" onClick={() => generarPDFSolicitud(s)}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pag.pagina}
            totalPages={pag.totalPages}
            total={pag.total}
            inicio={pag.inicio}
            fin={pag.fin}
            tamanoPagina={pag.tamanoPagina}
            onCambiarPagina={pag.cambiarPagina}
            onCambiarTamano={pag.cambiarTamano}
          />
        </>
      )}
    </div>
  );
}
