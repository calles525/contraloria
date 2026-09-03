import { useMemo, useState } from 'react';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { store } from '../lib/store';
import { ROLES } from '../lib/constants';
import { usePageTitle } from '../hooks/usePageTitle';
import { Avatar, EstadoBadge, TipoBadge } from '../components/Badge';
import { usePaginacion } from '../hooks/usePaginacion';
import { Paginacion, EstadoVacio } from '../components/Abstracciones';
import { Link } from 'react-router-dom';

export default function Perfil() {
  usePageTitle('Mi Perfil');
  const { usuario, version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const [cargo, setCargo] = useState(usuario?.cargo ?? '');

  const misSolicitudes = useMemo(() => {
    if (!usuario) return [];
    return store.getSolicitudes({}).filter((s) => s.creadorId === usuario.id && s.estado !== 'borrador');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, version]);

  const pag = usePaginacion(misSolicitudes, 5);

  if (!usuario) return null;

  const guardar = () => {
    const semilla = { ...usuario, cargo: cargo.trim() || undefined };
    store.guardarUsuario(semilla);
    recargarDatos();
    mostrar('Perfil actualizado.');
  };

  return (
    <div className="grid grid-2-1">
      <div className="card">
        <div className="perfil-head">
          <Avatar nombre={usuario.nombre} id={usuario.id} tamano="xl" />
          <div>
            <h3>{usuario.nombre}</h3>
            <p className="muted">{ROLES[usuario.rol]} · {usuario.departamentoNombre}</p>
          </div>
        </div>
        <div className="perfil-body">
          <div className="grid grid-2">
            <div className="form-group">
              <label>Nombre completo</label>
              <input value={usuario.nombre} disabled />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={usuario.email} disabled />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <input value={ROLES[usuario.rol]} disabled />
            </div>
            <div className="form-group">
              <label>Departamento</label>
              <input value={usuario.departamentoNombre} disabled />
            </div>
            <div className="form-group">
              <label>Cargo</label>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Analista" />
            </div>
          </div>
          <div className="perfil-actions">
            <button type="button" className="btn btn-primary" onClick={guardar}>Guardar cambios</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Mis solicitudes</h3></div>
        {pag.datos.length === 0 ? (
          <EstadoVacio icono="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" titulo="Sin solicitudes" descripcion="Aún no tiene solicitudes enviadas." />
        ) : (
          <>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr><th>Nº</th><th>Título</th><th>Tipo</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {pag.datos.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.numeroSolicitud}</td>
                      <td><Link className="link" to={`/detalle/${s.id}`}>{s.titulo}</Link></td>
                      <td><TipoBadge tipo={s.tipo} /></td>
                      <td><EstadoBadge estado={s.estado} /></td>
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
    </div>
  );
}
