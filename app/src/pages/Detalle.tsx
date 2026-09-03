import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { store } from '../lib/store';
import { usePageTitle } from '../hooks/usePageTitle';
import { EstadoBadge, PrioridadBadge, TipoBadge } from '../components/Badge';
import { Timeline } from '../components/Timeline';
import { formatearFecha, formatearMonto } from '../lib/utils';
import { TIPOS } from '../lib/constants';
import { generarPDFSolicitud } from '../lib/exportExcel';

export default function Detalle() {
  const { id } = useParams();
  const solicitudId = Number(id ?? '0');
  const { usuario, version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const [comentario, setComentario] = useState('');

  const sol = useMemo(
    () => store.getSolicitud(solicitudId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solicitudId, version],
  );

  usePageTitle(sol ? sol.numeroSolicitud : 'Solicitud');

  const puedeVer = useMemo(() => {
    if (!usuario || !sol) return false;
    if (usuario.rol === 'admin' || usuario.rol === 'contraloria') return true;
    if (sol.creadorId === usuario.id) return true;
    if (sol.departamentoDestinoId === usuario.departamentoId) return true;
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, sol]);

  if (!usuario || !sol) {
    return (
      <div className="card">
        <p className="empty-text">Solicitud no encontrada.</p>
        <Link to="/mis-solicitudes" className="btn btn-outline btn-sm">Volver</Link>
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="card">
        <p className="empty-text">No tiene permisos para ver esta solicitud.</p>
        <Link to="/dashboard" className="btn btn-outline btn-sm">Volver</Link>
      </div>
    );
  }

  const enviarComentario = () => {
    const texto = comentario.trim();
    if (!texto || !usuario) return;
    store.agregarComentario(sol, texto, usuario);
    setComentario('');
    recargarDatos();
    mostrar('Comentario agregado.');
  };

  const monto = sol.datosEspecificos?.montoEstimado ?? sol.datosEspecificos?.presupuestoEstimado;

  return (
    <div className="detail-page">
      <div className="grid grid-2-1">
        <div className="card">
          <div className="card-head">
            <h3>{sol.titulo}</h3>
            <div className="head-actions">
              <TipoBadge tipo={sol.tipo} />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => generarPDFSolicitud(sol)}>
                Descargar PDF
              </button>
            </div>
          </div>
          <table className="table detail-table">
            <tbody>
              <tr><th>Nº de solicitud</th><td><span className="mono">{sol.numeroSolicitud}</span></td></tr>
              <tr><th>Estado</th><td><EstadoBadge estado={sol.estado} /></td></tr>
              <tr><th>Prioridad</th><td><PrioridadBadge prioridad={sol.prioridad} /></td></tr>
              <tr><th>Tipo</th><td>{TIPOS[sol.tipo]}</td></tr>
              <tr><th>Solicitante</th><td>{sol.creadorNombre}</td></tr>
              <tr><th>Departamento origen</th><td>{sol.departamentoOrigenNombre}</td></tr>
              <tr><th>Departamento destino</th><td>{sol.departamentoDestinoNombre}</td></tr>
              {monto ? <tr><th>Monto</th><td>{formatearMonto(monto)}</td></tr> : null}
              <tr><th>Fecha requerida</th><td>{sol.fechaRequerida ? formatearFecha(sol.fechaRequerida) : '—'}</td></tr>
              <tr><th>Creada</th><td>{formatearFecha(sol.fechaCreacion)}</td></tr>
            </tbody>
          </table>
          <div className="detail-block">
            <h4>Descripción</h4>
            <p>{sol.descripcion}</p>
          </div>
          {sol.datosEspecificos && Object.keys(sol.datosEspecificos).length > 0 ? (
            <div className="detail-block">
              <h4>Datos específicos</h4>
              <table className="table detail-table">
                <tbody>
                  {Object.entries(sol.datosEspecificos).map(([k, v]) => (
                    <tr key={k}><th>{k.replace(/([A-Z])/g, ' $1')}</th><td>{v || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="card">
          <div className="card-head"><h3>Historial</h3></div>
          <Timeline
            items={sol.historial.map((h) => ({
              fecha: h.fecha,
              usuarioNombre: h.usuarioNombre,
              comentario: h.comentario,
              estadoAnterior: h.estadoAnterior,
              estadoNuevo: h.estadoNuevo,
            }))}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Comentarios</h3></div>
        <div className="comentarios-list">
          {sol.comentarios.length === 0 ? <p className="empty-text">Sin comentarios.</p> : null}
          {sol.comentarios.map((c, i) => (
            <div className="comentario" key={i}>
              <div className="comentario-head">
                <strong>{c.usuarioNombre}</strong>
                <span className="muted">{formatearFecha(c.fecha)}</span>
              </div>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
        <div className="comentario-form">
          <textarea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escriba un comentario..." />
          <button type="button" className="btn btn-primary" onClick={enviarComentario} disabled={!comentario.trim()}>
            Comentar
          </button>
        </div>
      </div>
    </div>
  );
}
