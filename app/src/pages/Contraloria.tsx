import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { useModal } from '../components/Modal';
import { store } from '../lib/store';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePaginacion } from '../hooks/usePaginacion';
import { EstadoBadge, PrioridadBadge, TipoBadge } from '../components/Badge';
import { EstadoVacio, Paginacion } from '../components/Abstracciones';
import type { Solicitud } from '../lib/types';

export default function Contraloria() {
  usePageTitle('Panel de Contraloría');
  const { usuario, version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const { confirmar } = useModal();
  const [filtro, setFiltro] = useState<'bandeja' | 'todas'>('bandeja');

  const lista = useMemo(() => {
    const todas = store.getSolicitudes({});
    if (filtro === 'bandeja') {
      return todas.filter((s) => s.estado === 'en_contraloria' || s.estado === 'ajustes_requeridos');
    }
    return todas.filter((s) => s.estado !== 'borrador');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, version]);

  const pag = usePaginacion(lista, 10);

  const aprobar = async (sol: Solicitud, comentario: string) => {
    if (!usuario) return;
    const ok = await confirmar({
      titulo: 'Aprobar solicitud',
      mensaje: `¿Aprobar la solicitud ${sol.numeroSolicitud}?`,
      textoConfirmar: 'Aprobar',
    });
    if (!ok) return;
    const estadoPrev = sol.estado;
    sol.estado = 'aprobado';
    sol.fechaFinalizacion = new Date().toISOString();
    store.agregarHistorial(sol, estadoPrev, 'aprobado', comentario || 'Aprobada por contraloría.', usuario);
    store.guardarSolicitud(sol);
    recargarDatos();
    mostrar(`Solicitud ${sol.numeroSolicitud} aprobada.`);
  };

  const solicitarAjustes = async (sol: Solicitud, comentario: string) => {
    if (!usuario) return;
    const ok = await confirmar({
      titulo: 'Solicitar ajustes',
      mensaje: `¿Solicitar ajustes para la solicitud ${sol.numeroSolicitud}? Esta volverá al departamento.`,
      textoConfirmar: 'Solicitar',
      peligro: true,
    });
    if (!ok) return;
    const estadoPrev = sol.estado;
    sol.estado = 'ajustes_requeridos';
    store.agregarHistorial(sol, estadoPrev, 'ajustes_requeridos', comentario || 'Se requieren ajustes.', usuario);
    store.guardarSolicitud(sol);
    recargarDatos();
    mostrar('Ajustes solicitados.');
  };

  const rechazar = async (sol: Solicitud, comentario: string) => {
    if (!usuario) return;
    const ok = await confirmar({
      titulo: 'Rechazar solicitud',
      mensaje: `¿Rechazar la solicitud ${sol.numeroSolicitud} de forma definitiva?`,
      textoConfirmar: 'Rechazar',
      peligro: true,
    });
    if (!ok) return;
    const estadoPrev = sol.estado;
    sol.estado = 'rechazado';
    sol.fechaFinalizacion = new Date().toISOString();
    store.agregarHistorial(sol, estadoPrev, 'rechazado', comentario || 'Rechazada por contraloría.', usuario);
    store.guardarSolicitud(sol);
    recargarDatos();
    mostrar(`Solicitud ${sol.numeroSolicitud} rechazada.`);
  };

  if (!usuario) return null;

  const acciones = (sol: Solicitud) =>
    sol.estado === 'en_contraloria' || sol.estado === 'ajustes_requeridos' ? (
      <div className="row-actions">
        <button type="button" className="btn btn-success btn-sm" onClick={() => aprobar(sol, '')}>Aprobar</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => solicitarAjustes(sol, '')}>Ajustes</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => rechazar(sol, '')}>Rechazar</button>
      </div>
    ) : null;

  return (
    <div className="card">
      <div className="card-head">
        <h3>Panel de Contraloría</h3>
        <div className="tabs">
          <button type="button" className={`tab-btn ${filtro === 'bandeja' ? 'active' : ''}`} onClick={() => setFiltro('bandeja')}>
            Bandeja de revisión ({store.getSolicitudes({}).filter((s) => s.estado === 'en_contraloria' || s.estado === 'ajustes_requeridos').length})
          </button>
          <button type="button" className={`tab-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>
            Historial de solicitudes
          </button>
        </div>
      </div>

      {pag.datos.length === 0 ? (
        <EstadoVacio
          icono="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          titulo="Bandeja vacía"
          descripcion="No hay solicitudes pendientes de revisión en este momento."
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>Nº</th><th>Título</th><th>Departamento</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pag.datos.map((s) => (
                  <tr key={s.id}>
                    <td><span className="mono">{s.numeroSolicitud}</span></td>
                    <td><Link className="link" to={`/detalle/${s.id}`}>{s.titulo}</Link></td>
                    <td>{s.departamentoOrigenNombre}</td>
                    <td><TipoBadge tipo={s.tipo} /></td>
                    <td><PrioridadBadge prioridad={s.prioridad} /></td>
                    <td><EstadoBadge estado={s.estado} /></td>
                    <td>{new Date(s.fechaCreacion).toLocaleDateString('es-VE')}</td>
                    <td>{acciones(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pag.pagina} totalPages={pag.totalPages} total={pag.total}
            inicio={pag.inicio} fin={pag.fin} tamanoPagina={pag.tamanoPagina}
            onCambiarPagina={pag.cambiarPagina} onCambiarTamano={pag.cambiarTamano}
          />
        </>
      )}
    </div>
  );
}
