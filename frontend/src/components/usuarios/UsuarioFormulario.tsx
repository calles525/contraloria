import { useEffect, useState } from 'react';
import {
  centrosCostoApi,
  departamentosApi,
  empresasApi,
  personasApi,
  permisosApi,
  usuariosApi,
} from '../../services/maestros';
import { OpcionSelect, Permiso, UbicacionUsuario, Usuario } from '../../types/maestros';

interface PropsUsuarioFormulario {
  usuario: Usuario | null;
  alCerrar: () => void;
  alGuardado: () => void;
}

const claseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-white/30';

const claseTab = (activo: boolean) =>
  `rounded-lg px-4 py-2 text-theme-sm font-medium transition-colors ${
    activo
      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300'
  }`;

export default function UsuarioFormulario({ usuario, alCerrar, alGuardado }: PropsUsuarioFormulario) {
  const [tabActivo, setTabActivo] = useState<'datos' | 'ubicacion' | 'permisos'>('datos');
  const [personas, setPersonas] = useState<OpcionSelect[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [personId, setPersonId] = useState(usuario?.person_id ? String(usuario.person_id) : '');
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [activo, setActivo] = useState(usuario ? usuario.is_active === 1 : 1);

  // Ubicación del usuario en el organigrama (empresa, sede, departamento).
  const [ubicacionOriginal, setUbicacionOriginal] = useState<UbicacionUsuario | null>(null);
  const [empresas, setEmpresas] = useState<OpcionSelect[]>([]);
  const [sedes, setSedes] = useState<OpcionSelect[]>([]);
  const [departamentos, setDepartamentos] = useState<OpcionSelect[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [personasData, permisosData, empresasData] = await Promise.all([
          personasApi.opciones(),
          permisosApi.listar(),
          empresasApi.opciones(),
        ]);
        setPersonas(personasData);
        setPermisos(permisosData);
        setEmpresas(empresasData);

        if (usuario) {
          const otorgados = await usuariosApi.listarPermisos(usuario.id);
          setSeleccionados(new Set(otorgados.map((p) => p.id)));

          // Precarga la ubicación actual del usuario.
          const ubicacion = await usuariosApi.listarUbicacion(usuario.id);
          if (ubicacion) {
            setUbicacionOriginal(ubicacion);
            setEmpresaId(String(ubicacion.company_id));
            setSedeId(String(ubicacion.cost_center_id));
            setDepartamentoId(String(ubicacion.department_id));
          }
        }
      } catch {
        setError('No se pudieron cargar las opciones del formulario.');
      } finally {
        setCargando(false);
      }
    })();
  }, [usuario]);

  // Carga las sedes (centros de costo) de la empresa seleccionada.
  useEffect(() => {
    let activo = true;
    if (!empresaId) {
      setSedes([]);
      setSedeId('');
      return;
    }
    centrosCostoApi
      .opciones(empresaId)
      .then((opciones) => {
        if (activo) setSedes(opciones);
      })
      .catch(() => {
        if (activo) {
          setSedes([]);
          setSedeId('');
        }
      });
    return () => {
      activo = false;
    };
  }, [empresaId]);

  // Carga los departamentos de la sede seleccionada.
  useEffect(() => {
    let activo = true;
    if (!sedeId) {
      setDepartamentos([]);
      setDepartamentoId('');
      return;
    }
    departamentosApi
      .opciones({ cost_center_id: sedeId })
      .then((opciones) => {
        if (activo) setDepartamentos(opciones);
      })
      .catch(() => {
        if (activo) {
          setDepartamentos([]);
          setDepartamentoId('');
        }
      });
    return () => {
      activo = false;
    };
  }, [sedeId]);

  function alternarPermiso(id: number) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  }

  async function manejarGuardar() {
    setError('');

    if (!username.trim()) {
      setError('El campo "Usuario" es obligatorio.');
      setTabActivo('datos');
      return;
    }
    if (!personId) {
      setError('Debe seleccionar la persona asociada al usuario.');
      setTabActivo('datos');
      return;
    }
    if (!usuario && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setTabActivo('datos');
      return;
    }
    if (empresaId && (!sedeId || !departamentoId)) {
      setError('Si selecciona una empresa, debe indicar también la sede y el departamento.');
      setTabActivo('ubicacion');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        person_id: Number(personId),
        username: username.trim(),
        email: email.trim() || undefined,
        is_active: activo ? 1 : 0,
      };

      let id = usuario?.id;
      if (usuario) {
        const cuerpo = password ? { ...datos, password } : datos;
        await usuariosApi.actualizar(usuario.id, cuerpo);
      } else {
        const creado = await usuariosApi.crear({ ...datos, password });
        id = creado.id;
      }

      // Guarda la ubicación en el organigrama si cambió.
      const ubicacionNueva =
        empresaId && sedeId && departamentoId
          ? {
              company_id: Number(empresaId),
              cost_center_id: Number(sedeId),
              department_id: Number(departamentoId),
            }
          : null;

      const hayOriginal = ubicacionOriginal !== null;
      const hayNueva = ubicacionNueva !== null;
      const cambioUbicacion =
        hayNueva !== hayOriginal ||
        (hayNueva &&
          hayOriginal &&
          (ubicacionNueva!.company_id !== ubicacionOriginal!.company_id ||
            ubicacionNueva!.cost_center_id !== ubicacionOriginal!.cost_center_id ||
            ubicacionNueva!.department_id !== ubicacionOriginal!.department_id));

      if (cambioUbicacion) {
        if (ubicacionNueva) {
          await usuariosApi.guardarUbicacion(id!, ubicacionNueva);
        } else {
          await usuariosApi.quitarUbicacion(id!);
        }
      }

      await usuariosApi.asignarPermisos(id!, Array.from(seleccionados));
      alGuardado();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo guardar el usuario. Verifique los datos.');
      setTabActivo('datos');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        <button type="button" onClick={() => setTabActivo('datos')} className={claseTab(tabActivo === 'datos')}>
          Datos
        </button>
        <button type="button" onClick={() => setTabActivo('ubicacion')} className={claseTab(tabActivo === 'ubicacion')}>
          Ubicación
        </button>
        <button type="button" onClick={() => setTabActivo('permisos')} className={claseTab(tabActivo === 'permisos')}>
          Permisos
        </button>
      </div>

      {tabActivo === 'datos' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              Persona <span className="text-error-500">*</span>
            </label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className={claseInput}
              disabled={cargando}
            >
              <option value="">Seleccione una persona</option>
              {personas.map((persona) => (
                <option key={persona.value} value={persona.value}>
                  {persona.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              Usuario <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={claseInput}
              placeholder="Nombre de acceso"
            />
          </div>

          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              Contraseña
              {usuario ? (
                <span className="text-gray-400"> (déjela vacía para no cambiarla)</span>
              ) : (
                <span className="text-error-500"> *</span>
              )}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={claseInput}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              Email
              <span className="text-gray-400"> (opcional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={claseInput}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={activo === 1}
                onChange={(e) => setActivo(e.target.checked ? 1 : 0)}
                className="h-4 w-4 rounded border-gray-300 accent-brand-500"
              />
              <span className="text-theme-sm text-gray-700 dark:text-gray-400">Activo</span>
            </label>
          </div>
        </div>
      ) : tabActivo === 'ubicacion' ? (
        <div>
          <p className="mb-4 text-theme-sm text-gray-500 dark:text-gray-400">
            Ubicación del usuario en el organigrama. Con estos datos se precarga la información al crear una solicitud.
          </p>
          {cargando ? (
            <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">Cargando…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  Empresa
                </label>
                <select
                  value={empresaId}
                  onChange={(e) => {
                    setEmpresaId(e.target.value);
                    setSedeId('');
                    setDepartamentoId('');
                  }}
                  className={claseInput}
                >
                  <option value="">Sin asignar</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.value} value={empresa.value}>
                      {empresa.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  Sede (centro de costo)
                </label>
                <select
                  value={sedeId}
                  onChange={(e) => {
                    setSedeId(e.target.value);
                    setDepartamentoId('');
                  }}
                  disabled={!empresaId}
                  className={claseInput}
                >
                  <option value="">Seleccione una sede</option>
                  {sedes.map((sede) => (
                    <option key={sede.value} value={sede.value}>
                      {sede.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  Departamento
                </label>
                <select
                  value={departamentoId}
                  onChange={(e) => setDepartamentoId(e.target.value)}
                  disabled={!sedeId}
                  className={claseInput}
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.value} value={departamento.value}>
                      {departamento.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="mb-4 text-theme-sm text-gray-500 dark:text-gray-400">
            Marque los módulos a los que este usuario tendrá acceso.
          </p>
          {cargando ? (
            <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">Cargando…</p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              {permisos.length === 0 ? (
                <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  No hay permisos creados. Cree permisos desde el módulo Permisos.
                </p>
              ) : (
                permisos.map((permiso) => (
                  <label
                    key={permiso.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <span>
                      <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {permiso.name}
                      </span>
                      {permiso.description && (
                        <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                          {permiso.description}
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={seleccionados.has(permiso.id)}
                      onChange={() => alternarPermiso(permiso.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-500"
                    />
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={alCerrar}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={manejarGuardar}
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}