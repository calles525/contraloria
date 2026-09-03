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

type Pestana = 'pendientes' | 'en_revision' | 'todas';

const PESTANAS: Array<{ id: Pestana; label: string; filtro?: (s: Solicitud) => boolean }> = [
  { id: 'pendientes', label: 'Pendientes', filtro: (s) => s.estado === 'enviado' },
  { id: 'en_revision', label: 'En revisión', filtro: (s) => ['en_revision_departamento', 'ajustes_requeridos'].includes(s.estado) },
  { id: 'todas', label: 'Todas' },
];

export default function Recibidas() {
  usePageTitle('Solicitudes Recibidas');
  const { usuario, version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const { confirmar } = useModal();
  const [pestana, setPestana] = useState<Pestana>('pendientes');

  const lista = useMemo(() => {
    if (!usuario) return [];
    const todas = store.getSolicitudes({ departamentoDestinoId: usuario.departamentoId });
    const filtro = PESTANAS.find((p) => p.id === pestana)?.filtro;
    return filtro ? todas.filter(filtro) : todas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, pestana, version]);

  const pag = usePaginacion(lista, 10);

  const enviarContraloria = async (sol: Solicitud, comentario: string) => {
    if (!usuario) return;
    const ok = await confirmar({
      titulo: 'Enviar a contraloría',
      mensaje: `¿Enviar la solicitud ${sol.numeroSolicitud} a contraloría para su revisión final?`,
      textoConfirmar: 'Enviar',
    });
    if (!ok) return;
    sol.estado = 'en_contraloria';
    sol.fechaAprobacionContraloria = new Date().toISOString();
    store.agregarHistorial(sol, 'en_revision_departamento', 'en_contraloria', comentario || 'Revisión departamental completada.', usuario);
    store.guardarSolicitud(sol);
    recargarDatos();
    mostrar(`Solicitud ${sol.numeroSolicitud} enviada a contraloría.`);
  };

  const iniciarRevision = async (sol: Solicitud) => {
    if (!usuario) return;
    const ok = await confirmar({
      titulo: 'Iniciar revisión',
      mensaje: `¿Empezar la revisión de la solicitud ${sol.numeroSolicitud}?`,
      textoConfirmar: 'Iniciar',
    });
    if (!ok) return;
    sol.estado = 'en_revision_departamento';
    sol.fechaRevisionDepartamento = new Date().toISOString();
    store.agregarHistorial(sol, 'enviado', 'en_revision_departamento', 'Revisión iniciada por el departamento.', usuario);
    store.guardarSolicitud(sol);
    recargarDatos();
    mostrar('Revisión iniciada.');
  };

  if (!usuario) return null;

  const acciones = (sol: Solicitud) => {
    switch (sol.estado) {
      case 'enviado':
        return (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => iniciarRevision(sol)}>Iniciar revisión</button>
          </>
        );
      case 'en_revision_departamento':
        return (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => enviarContraloria(sol, '')}>Enviar a contraloría</button>
          </>
        );
      case 'ajustes_requeridos':
        return (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => enviarContraloria(sol, '')}>Reenviar a contraloría</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="card-head"><h3>Solicitudes Recibidas</h3></div>
      <div className="tabs">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`tab-btn ${pestana === p.id ? 'active' : ''}`}
            onClick={() => setPestana(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pag.datos.length === 0 ? (
        <EstadoVacio
          icono="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"
          titulo="No hay solicitudes"
          descripcion="No hay solicitudes que coincidan con este criterio."
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>Nº</th><th>Título</th><th>Solicitante</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pag.datos.map((s) => (
                  <tr key={s.id}>
                    <td><span className="mono">{s.numeroSolicitud}</span></td>
                    <td><Link className="link" to={`/detalle/${s.id}`}>{s.titulo}</Link></td>
                    <td>{s.creadorNombre}</td>
                    <td><TipoBadge tipo={s.tipo} /></td>
                    <td><PrioridadBadge prioridad={s.prioridad} /></td>
                    <td><EstadoBadge estado={s.estado} /></td>
                    <td>{new Date(s.fechaCreacion).toLocaleDateString('es-VE')}</td>
                    <td><div className="row-actions">{acciones(s)}</div></td>
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
