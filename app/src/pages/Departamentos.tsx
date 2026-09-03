import { useMemo, useState } from 'react';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { useModal, CabeceraModal } from '../components/Modal';
import { store } from '../lib/store';
import type { Departamento } from '../lib/types';
import { usePageTitle } from '../hooks/usePageTitle';
import { Avatar } from '../components/Badge';
import { EstadoVacio } from '../components/Abstracciones';

interface FormDepto {
  id: number;
  nombre: string;
  descripcion: string;
  responsableId: number | null;
  activo: boolean;
}

function FormDeptoModal({ depto, onCerrar }: { depto?: Departamento; onCerrar: () => void }) {
  const { recargarDatos } = useApp();
  const { mostrar } = useToast();
  const [form, setForm] = useState<FormDepto>({
    id: depto?.id ?? 0,
    nombre: depto?.nombre ?? '',
    descripcion: depto?.descripcion ?? '',
    responsableId: depto?.responsableId ?? null,
    activo: depto?.activo ?? true,
  });

  const guardar = () => {
    if (!form.nombre.trim()) {
      mostrar('El nombre es obligatorio.', 'error');
      return;
    }
    const existe = store.getDepartamentos().some(
      (d) => d.nombre.toLowerCase() === form.nombre.trim().toLowerCase() && d.id !== form.id,
    );
    if (existe) {
      mostrar('Ya existe un departamento con ese nombre.', 'error');
      return;
    }
    const usuariosIds = depto ? store.getDepartamento(depto.id)?.usuariosIds ?? [] : [];
    const nuevo: Departamento = {
      id: form.id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      responsableId: form.responsableId,
      usuariosIds,
      activo: form.activo,
    };
    store.guardarDepartamento(nuevo);
    recargarDatos();
    mostrar(depto ? 'Departamento actualizado.' : 'Departamento creado.');
    onCerrar();
  };

  return (
    <>
      <CabeceraModal titulo={depto ? `Editar ${depto.nombre}` : 'Nuevo Departamento'} onCerrar={onCerrar} />
      <div className="modal-body">
        <div className="form-group">
          <label>Nombre</label>
          <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea rows={3} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Responsable (opcional)</label>
          <select value={form.responsableId ?? ''} onChange={(e) => setForm((f) => ({ ...f, responsableId: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Sin responsable</option>
            {store.getUsuarios().map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
          Departamento activo
        </label>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-outline" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={guardar}>Guardar</button>
      </div>
    </>
  );
}

export default function Departamentos() {
  usePageTitle('Departamentos');
  const { version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const { abrir, confirmar } = useModal();
  const [buscar, setBuscar] = useState('');

  const lista = useMemo(() => {
    const todos = store.getDepartamentos();
    if (!buscar) return todos;
    const q = buscar.toLowerCase();
    return todos.filter((d) => d.nombre.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, version]);

  const abrirModal = (d?: Departamento) => {
    const cerrar = abrir(<FormDeptoModal depto={d} onCerrar={() => cerrar()} />, 'lg');
  };

  const eliminar = async (d: Departamento) => {
    const tieneUsr = store.getUsuarios().some((u) => u.departamentoId === d.id);
    if (tieneUsr) {
      mostrar(`No se puede eliminar: el departamento ${d.nombre} tiene usuarios asignados.`, 'error');
      return;
    }
    const ok = await confirmar({
      titulo: 'Eliminar departamento',
      mensaje: `¿Eliminar el departamento ${d.nombre}?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    store.eliminarDepartamento(d.id);
    recargarDatos();
    mostrar('Departamento eliminado.');
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>Departamentos</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirModal()}>+ Nuevo Departamento</button>
      </div>
      <div className="filtros">
        <input className="filter-control" placeholder="Buscar por nombre..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </div>
      {lista.length === 0 ? (
        <EstadoVacio icono="M3 21h18M5 21V5l7 4 7-4v16M9 9h.01M9 13h.01M15 9h.01M15 13h.01" titulo="Sin departamentos" descripcion="No hay departamentos que coincidan." />
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Descripción</th><th>Responsable</th><th>Usuarios</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {lista.map((d) => {
                const resp = d.responsableId ? store.getUsuario(d.responsableId) : undefined;
                const usuarios = store.getUsuarios().filter((u) => u.departamentoId === d.id);
                return (
                  <tr key={d.id}>
                    <td><strong>{d.nombre}</strong></td>
                    <td>{d.descripcion ?? '—'}</td>
                    <td>{resp ? <span className="user-cell"><Avatar nombre={resp.nombre} id={resp.id} tamano="sm" /> {resp.nombre}</span> : '—'}</td>
                    <td>{usuarios.length}</td>
                    <td>{d.activo ? <span className="badge badge-success">Activo</span> : <span className="badge badge-danger">Inactivo</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-btn" title="Editar" onClick={() => abrirModal(d)}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16.86 4.14l3 3L6 21H3v-3L16.86 4.14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                        </button>
                        <button type="button" className="icon-btn danger-icon" title="Eliminar" onClick={() => eliminar(d)}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
