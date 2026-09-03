import { useMemo, useState } from 'react';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { useModal, CabeceraModal } from '../components/Modal';
import { store } from '../lib/store';
import { ROLES } from '../lib/constants';
import type { Rol, Usuario } from '../lib/types';
import { validarUsuario } from '../lib/validation';
import { usePageTitle } from '../hooks/usePageTitle';
import { Avatar } from '../components/Badge';
import { EstadoVacio } from '../components/Abstracciones';

interface FormUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  departamentoId: number | '';
  cargo: string;
  password: string;
  activo: boolean;
}

function FormUsuarioModal({ usuario, onCerrar }: { usuario?: Usuario; onCerrar: () => void }) {
  const { recargarDatos } = useApp();
  const { mostrar } = useToast();
  const [form, setForm] = useState<FormUsuario>({
    id: usuario?.id ?? 0,
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    rol: usuario?.rol ?? 'solicitante',
    departamentoId: usuario?.departamentoId ?? '',
    cargo: usuario?.cargo ?? '',
    password: '',
    activo: usuario?.activo ?? true,
  });
  const set = (p: Partial<FormUsuario>) => setForm((f) => ({ ...f, ...p }));

  const guardar = () => {
    const errs = validarUsuario({
      nombre: form.nombre, email: form.email, rol: form.rol,
      departamentoId: form.departamentoId, cargo: form.cargo, password: form.password, esNuevo: !usuario,
    });
    if (errs.length) {
      mostrar(errs[0], 'error');
      return;
    }
    const existe = store.getUsuarios().some(
      (x) => x.email.toLowerCase() === form.email.toLowerCase() && x.id !== form.id,
    );
    if (existe) {
      mostrar('Ya existe un usuario con ese email.', 'error');
      return;
    }
    const nuevo: Usuario = {
      id: form.id, nombre: form.nombre.trim(), email: form.email.trim(),
      rol: form.rol, departamentoId: Number(form.departamentoId),
      departamentoNombre: store.getDepartamento(Number(form.departamentoId))?.nombre ?? '',
      cargo: form.cargo.trim() || undefined,
      activo: form.activo,
    };
    nuevo.password = form.password || (form.id === 0 ? '1234' : undefined);
    store.guardarUsuario(nuevo);
    recargarDatos();
    mostrar(usuario ? 'Usuario actualizado.' : 'Usuario creado.');
    onCerrar();
  };

  return (
    <>
      <CabeceraModal titulo={usuario ? `Editar ${usuario.nombre}` : 'Nuevo Usuario'} onCerrar={onCerrar} />
      <div className="modal-body">
        <div className="form-group">
          <label>Nombre completo</label>
          <input value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => set({ rol: e.target.value as Rol })}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Departamento</label>
            <select value={form.departamentoId} onChange={(e) => set({ departamentoId: e.target.value ? Number(e.target.value) : '' })}>
              <option value="">Seleccione...</option>
              {store.getDepartamentos().filter((d) => d.activo).map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Cargo (opcional)</label>
            <input value={form.cargo} onChange={(e) => set({ cargo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>{usuario ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
            <input type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder={usuario ? 'Dejar en blanco' : 'mín. 4 caracteres'} />
          </div>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.activo} onChange={(e) => set({ activo: e.target.checked })} />
          Cuenta activa
        </label>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-outline" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={guardar}>Guardar</button>
      </div>
    </>
  );
}

export default function Usuarios() {
  usePageTitle('Usuarios');
  const { usuario, version, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const { abrir, confirmar } = useModal();
  const [buscar, setBuscar] = useState('');

  const lista = useMemo(() => {
    const todos = store.getUsuarios();
    if (!buscar) return todos;
    const q = buscar.toLowerCase();
    return todos.filter((u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, version]);

  const abrirModal = (u?: Usuario) => {
    const cerrar = abrir(<FormUsuarioModal usuario={u} onCerrar={() => cerrar()} />, 'lg');
  };

  const eliminar = async (u: Usuario) => {
    if (u.id === usuario?.id) {
      mostrar('No puede eliminar su propia cuenta.', 'error');
      return;
    }
    const ok = await confirmar({
      titulo: 'Eliminar usuario',
      mensaje: `¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    store.eliminarUsuario(u.id);
    recargarDatos();
    mostrar('Usuario eliminado.');
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>Usuarios</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirModal()}>
          + Nuevo Usuario
        </button>
      </div>
      <div className="filtros">
        <input className="filter-control" placeholder="Buscar por nombre o email..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      </div>
      {lista.length === 0 ? (
        <EstadoVacio icono="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" titulo="Sin usuarios" descripcion="No hay usuarios que coincidan." />
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Departamento</th><th>Cargo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td><span className="user-cell"><Avatar nombre={u.nombre} id={u.id} tamano="sm" /> {u.nombre}</span></td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-primary">{ROLES[u.rol]}</span></td>
                  <td>{u.departamentoNombre}</td>
                  <td>{u.cargo ?? '—'}</td>
                  <td>{u.activo ? <span className="badge badge-success">Activo</span> : <span className="badge badge-danger">Inactivo</span>}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-btn" title="Editar" onClick={() => abrirModal(u)}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16.86 4.14l3 3L6 21H3v-3L16.86 4.14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                      </button>
                      <button type="button" className="icon-btn danger-icon" title="Eliminar" onClick={() => eliminar(u)}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
