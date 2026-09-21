import { useEffect, useState } from 'react';
import Modal from '../crud/Modal';
import {
  CAMPOS_POR_CATEGORIA,
  REQUERIMIENTOS_POR_CATEGORIA,
  TIPOS_SOLICITUD,
  TipoSolicitud,
  CampoDinamico,
  Requerimiento,
  Solicitud,
} from '../../types/solicitudes';
import { empresasApi, centrosCostoApi, departamentosApi } from '../../services/maestros';
import { obtenerUbicacionUsuario, UbicacionUsuario } from '../../services/auth';
import { OpcionSelect } from '../../types/maestros';

interface DatosEnvioSolicitud {
  tipo_solicitud: TipoSolicitud;
  categoria: string;
  empresa_id: number;
  cost_center_id?: number | null;
  department_id?: number | null;
  supervisor_person_id?: number | null;
  datos: Record<string, unknown>;
  observaciones?: string;
  requerimientos: { nombre: string; cumplido: boolean }[];
  /** Documentos elegidos por el usuario, indexados por nombre de requerimiento. */
  archivos: Record<string, File>;
}

interface PropsCrearSolicitudModal {
  alCerrar: () => void;
  cargando: boolean;
  /** Si viene, el modal trabaja en modo edición (o solo lectura si la solicitud está cerrada). */
  solicitudEditar?: Solicitud | null;
  onCrear: (datos: DatosEnvioSolicitud) => void;
  /** Permite descargar el archivo ya adjuntado de un requerimiento (solo en edición/lectura). */
  onDescargarArchivo?: (reqId: number) => Promise<void>;
}

/** Opción de departamento para el select, con los datos de su encargado (supervisor). */
interface DepartamentoOpcion extends OpcionSelect {
  manager_person_id: number | null;
  manager_name: string | null;
}

const claseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-white/30';
const claseBotonSecundario =
  'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]';
const claseBotonPrimario =
  'inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-60';
const claseBotonError =
  'inline-flex items-center justify-center rounded-lg border border-error-200 bg-white px-3 py-2 text-theme-sm font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500 dark:hover:bg-error-500/15';

export default function CrearSolicitudModal({
  alCerrar,
  cargando,
  solicitudEditar,
  onCrear,
  onDescargarArchivo,
}: PropsCrearSolicitudModal) {
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');

  // Paso 1: tipo de solicitud.
  const [tipo, setTipo] = useState<TipoSolicitud | ''>(
    solicitudEditar ? solicitudEditar.tipo_solicitud : ''
  );

  // Paso 2: categoría.
  const [categoria, setCategoria] = useState(solicitudEditar?.categoria ?? '');

  // Paso 3: datos dinámicos + documentos requeridos (archivos) + registro.
  const [datos, setDatos] = useState<Record<string, unknown>>(() => {
    if (!solicitudEditar) return {};
    // El supervisor se asigna automáticamente; se descarta cualquier valor
    // residual de versiones anteriores que lo guardaba dentro de "datos".
    const datosEdicion = { ...(solicitudEditar.datos ?? {}) };
    delete datosEdicion['supervisor_id'];
    return datosEdicion;
  });
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>(
    solicitudEditar?.requerimientos ?? []
  );
  const [archivos, setArchivos] = useState<Record<string, File>>({});
  const [observaciones, setObservaciones] = useState(solicitudEditar?.observaciones ?? '');

  // Cascada empresa -> sede -> departamento y supervisor automático.
  const [empresas, setEmpresas] = useState<OpcionSelect[]>([]);
  const [sedes, setSedes] = useState<OpcionSelect[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOpcion[]>([]);
  // Supervisor del departamento (encargado), calculado automáticamente.
  const [supervisorId, setSupervisorId] = useState(
    solicitudEditar?.supervisor_person_id != null ? String(solicitudEditar.supervisor_person_id) : ''
  );
  const [supervisorNombre, setSupervisorNombre] = useState(
    solicitudEditar?.supervisor_nombre ?? ''
  );
  const [empresaId, setEmpresaId] = useState(
    solicitudEditar ? String(solicitudEditar.empresa_id) : ''
  );
  const [sedeId, setSedeId] = useState(
    solicitudEditar?.cost_center_id != null ? String(solicitudEditar.cost_center_id) : ''
  );
  const [deptId, setDeptId] = useState(
    solicitudEditar?.department_id != null ? String(solicitudEditar.department_id) : ''
  );

  // Ubicación del usuario logueado (empresa/sede/departamento) y solicitante.
  const [ubicacionUsuario, setUbicacionUsuario] = useState<UbicacionUsuario | null>(null);
  const [solicitante, setSolicitante] = useState<string | null>(null);

  const esSoloLectura = Boolean(
    solicitudEditar &&
      (solicitudEditar.estado === 'RECHAZADA' || solicitudEditar.estado === 'VALIDADA')
  );

  /** Asigna el supervisor automático a partir del encargado del departamento elegido. */
  function aplicarSupervisorPorDepartamento(deptos: DepartamentoOpcion[], deptId: string) {
    const departamento = deptos.find((d) => d.value === deptId);
    if (departamento?.manager_person_id != null) {
      setSupervisorId(String(departamento.manager_person_id));
      setSupervisorNombre(departamento.manager_name ?? '');
    } else {
      setSupervisorId('');
      setSupervisorNombre('');
    }
  }

  useEffect(() => {
    empresasApi
      .opciones()
      .then(setEmpresas)
      .catch(() => setEmpresas([]));

    async function precargar() {
      if (solicitudEditar) {
        // Modo edición: los valores del registro vienen de la solicitud.
        try {
          const respuesta = await obtenerUbicacionUsuario();
          setSolicitante(respuesta.solicitante);
          setUbicacionUsuario(respuesta.ubicacion);
        } catch {
          setSolicitante(null);
        }
        setEmpresaId(String(solicitudEditar.empresa_id));
        const sedesCargadas = await centrosCostoApi.opciones(String(solicitudEditar.empresa_id));
        setSedes(sedesCargadas);
        if (solicitudEditar.cost_center_id != null) {
          setSedeId(String(solicitudEditar.cost_center_id));
          const deptos: DepartamentoOpcion[] = (
            await departamentosApi.listar({
              company_id: String(solicitudEditar.empresa_id),
              cost_center_id: String(solicitudEditar.cost_center_id),
            })
          ).map((d) => ({
            value: String(d.id),
            label: d.name,
            manager_person_id: d.manager_person_id,
            manager_name: d.manager_name ?? null,
          }));
          setDepartamentos(deptos);
          if (solicitudEditar.department_id != null) {
            setDeptId(String(solicitudEditar.department_id));
            aplicarSupervisorPorDepartamento(deptos, String(solicitudEditar.department_id));
          }
        }
        return;
      }

      // Nueva solicitud: precarga automática según el usuario logueado.
      obtenerUbicacionUsuario()
        .then(async (respuesta) => {
          setSolicitante(respuesta.solicitante);
          const { ubicacion } = respuesta;
          if (!ubicacion) return;
          setUbicacionUsuario(ubicacion);
          setEmpresaId(String(ubicacion.company_id));
          const sedesCargadas = await centrosCostoApi.opciones(String(ubicacion.company_id));
          setSedes(sedesCargadas);
          setSedeId(String(ubicacion.cost_center_id));
          const deptos: DepartamentoOpcion[] = (
            await departamentosApi.listar({
              company_id: String(ubicacion.company_id),
              cost_center_id: String(ubicacion.cost_center_id),
            })
          ).map((d) => ({
            value: String(d.id),
            label: d.name,
            manager_person_id: d.manager_person_id,
            manager_name: d.manager_name ?? null,
          }));
          setDepartamentos(deptos);
          setDeptId(String(ubicacion.department_id));
          aplicarSupervisorPorDepartamento(deptos, String(ubicacion.department_id));
        })
        .catch(() => {
          // Sin ubicación conocida: el usuario elige manualmente.
        });
    }

    precargar().catch(() => {});
  }, [solicitudEditar]);

  useEffect(() => {
    // Carga la lista de documentos según la categoría elegida.
    // En edición solo se recalcula si el usuario cambió la categoría.
    if (solicitudEditar && categoria === solicitudEditar.categoria) return;
    const lista = REQUERIMIENTOS_POR_CATEGORIA[categoria] ?? [];
    setRequerimientos(lista.map((nombre) => ({ nombre, cumplido: false })));
    setArchivos({});
  }, [categoria, solicitudEditar]);

  const camposCategoria: CampoDinamico[] = categoria ? CAMPOS_POR_CATEGORIA[categoria] ?? [] : [];

  function puedeAvanzar(): boolean {
    if (paso === 1) return tipo !== '';
    if (paso === 2) return categoria !== '';
    return empresaId !== '';
  }

  function irSiguiente() {
    if (!puedeAvanzar()) {
      setError(
        paso === 1
          ? 'Seleccione el tipo de solicitud.'
          : paso === 2
            ? 'Seleccione la categoría.'
            : 'Seleccione una empresa.'
      );
      return;
    }
    setError('');
    setPaso((p) => p + 1);
  }

  function irAtras() {
    setError('');
    setPaso((p) => p - 1);
  }

  async function manejarCambioEmpresa(valor: string) {
    setEmpresaId(valor);
    setSedeId('');
    setDeptId('');
    setSedes([]);
    setDepartamentos([]);
    setSupervisorId('');
    setSupervisorNombre('');
    if (!valor) return;
    try {
      setSedes(await centrosCostoApi.opciones(valor));
    } catch {
      setSedes([]);
    }
  }

  async function manejarCambioSede(valor: string) {
    setSedeId(valor);
    setDeptId('');
    setDepartamentos([]);
    setSupervisorId('');
    setSupervisorNombre('');
    if (!valor) return;
    try {
      setDepartamentos(
        (
          await departamentosApi.listar({ company_id: empresaId, cost_center_id: valor })
        ).map((d) => ({
          value: String(d.id),
          label: d.name,
          manager_person_id: d.manager_person_id,
          manager_name: d.manager_name ?? null,
        }))
      );
    } catch {
      setDepartamentos([]);
    }
  }

  function manejarCambioDepartamento(valor: string) {
    setDeptId(valor);
    aplicarSupervisorPorDepartamento(departamentos, valor);
  }

  function manejarCampoDinamico(nombre: string, valor: unknown) {
    setDatos((actual) => ({ ...actual, [nombre]: valor }));
  }

  /** Registra el archivo elegido para un documento requerido (cumplido automático). */
  function manejarArchivoRequerimiento(nombre: string, archivo: File | null) {
    setArchivos((actual) => {
      const siguiente = { ...actual };
      if (archivo) {
        siguiente[nombre] = archivo;
      } else {
        delete siguiente[nombre];
      }
      return siguiente;
    });
  }

  function renderCampo(campo: CampoDinamico) {
    const valor = datos[campo.nombre];
    switch (campo.tipo) {
      case 'numero':
        return (
          <input
            type="number"
            value={valor as number | string}
            onChange={(e) =>
              manejarCampoDinamico(campo.nombre, e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder={campo.placeholder}
            disabled={esSoloLectura}
            className={claseInput}
          />
        );
      case 'area':
        return (
          <textarea
            value={valor as string}
            onChange={(e) => manejarCampoDinamico(campo.nombre, e.target.value)}
            placeholder={campo.placeholder}
            rows={2}
            disabled={esSoloLectura}
            className={`${claseInput} resize-none`}
          />
        );
      case 'select':
        return (
          <select
            value={valor as string}
            onChange={(e) => manejarCampoDinamico(campo.nombre, e.target.value)}
            disabled={esSoloLectura}
            className={claseInput}
          >
            <option value="">Seleccione una opción</option>
            {(campo.opciones ?? []).map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        );
      case 'check':
        return (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(valor)}
              onChange={(e) => manejarCampoDinamico(campo.nombre, e.target.checked)}
              disabled={esSoloLectura}
              className="h-4 w-4 rounded border-gray-300 accent-brand-500 disabled:cursor-not-allowed"
            />
            <span className="text-theme-xs text-gray-700 dark:text-gray-400">Sí</span>
          </label>
        );
      case 'multi':
        return (
          <div className="flex flex-wrap gap-2">
            {(campo.opcionesMulti ?? []).map((opcion) => {
              const seleccionado = Array.isArray(valor) && valor.includes(opcion);
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => {
                    if (esSoloLectura) return;
                    const actual = Array.isArray(valor) ? (valor as string[]) : [];
                    const siguiente = seleccionado
                      ? actual.filter((v) => v !== opcion)
                      : [...actual, opcion];
                    manejarCampoDinamico(campo.nombre, siguiente);
                  }}
                  disabled={esSoloLectura}
                  className={
                    seleccionado
                      ? 'inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-theme-xs font-medium text-white shadow-theme-xs disabled:opacity-60'
                      : 'inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }
                >
                  {seleccionado && (
                    <svg
                      className="fill-current"
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M16.7045 4.15374C17.0971 4.5697 17.0783 5.20271 16.6623 5.59534L8.7471 12.9733C8.544 13.1611 8.27487 13.2665 7.99413 13.2685C7.71339 13.2705 7.44263 13.1689 7.23667 12.984L2.74498 8.88247C2.32472 8.50431 2.29056 7.87199 2.66872 7.45173C3.04688 7.03147 3.6792 6.99731 4.09946 7.37547L7.97605 10.9306L15.2966 4.10113C15.7126 3.70851 16.3456 3.7273 16.7382 4.14326C16.7526 4.15882 16.7662 4.17508 16.7788 4.19201C16.7582 4.15927 16.739 4.12587 16.7212 4.09191L16.7045 4.15374Z" />
                    </svg>
                  )}
                  {opcion}
                </button>
              );
            })}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            value={(valor as string) || ''}
            onChange={(e) => manejarCampoDinamico(campo.nombre, e.target.value)}
            disabled={esSoloLectura}
            className={claseInput}
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={(valor as string) || ''}
            onChange={(e) => manejarCampoDinamico(campo.nombre, e.target.value)}
            disabled={esSoloLectura}
            className={claseInput}
          />
        );
      default:
        return (
          <input
            type="text"
            value={valor as string}
            onChange={(e) => manejarCampoDinamico(campo.nombre, e.target.value)}
            placeholder={campo.placeholder}
            disabled={esSoloLectura}
            className={claseInput}
          />
        );
    }
  }

  function validarPaso3(): string | null {
    const camposRequeridos = camposCategoria.filter((c) => c.requerido);

    for (const campo of camposRequeridos) {
      const valor = datos[campo.nombre];
      if (!valor || (typeof valor === 'string' && !valor.trim())) {
        return `El campo "${campo.etiqueta}" es requerido`;
      }
    }

    // Documentos exigidos por la categoría (en edición cuentan los ya adjuntados).
    const docsRequeridos = REQUERIMIENTOS_POR_CATEGORIA[categoria] || [];
    const docsFaltantes = docsRequeridos.filter(
      (doc) =>
        !archivos[doc] &&
        !requerimientos.some((r) => r.nombre === doc && (r.cumplido || r.archivo_ruta || r.archivo_nombre))
    );

    if (docsFaltantes.length > 0) {
      return `Debe adjuntar los siguientes documentos: ${docsFaltantes.join(', ')}`;
    }

    return null;
  }

  function manejarEnvio() {
    setError('');

    if (!empresaId) {
      setError('Debe seleccionar una empresa.');
      return;
    }

    const errorValidacion = validarPaso3();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    onCrear({
      tipo_solicitud: tipo as TipoSolicitud,
      categoria,
      empresa_id: Number(empresaId),
      cost_center_id: sedeId ? Number(sedeId) : null,
      department_id: deptId ? Number(deptId) : null,
      supervisor_person_id: supervisorId ? Number(supervisorId) : null,
      datos,
      observaciones: observaciones || undefined,
      // El cumplido real lo marca el archivo físicamente guardado en el backend.
      requerimientos: requerimientos.map((r) => ({
        nombre: r.nombre,
        cumplido: false,
      })),
      archivos,
    });
    // El cierre y recarga lo maneja la página tras el guardado.
  }

  return (
    <Modal
      titulo={
        solicitudEditar ? `Editar solicitud ${solicitudEditar.numero}` : 'Nueva solicitud'
      }
      alCerrar={alCerrar}
      ancho="xl"
    >
      {/* Pasos */}
      <div className="mb-5 flex items-center gap-1.5">
        {['Tipo', 'Categoría', 'Datos'].map((etiqueta, indice) => {
          const activo = indice + 1 === paso;
          const completado = indice + 1 < paso;
          return (
            <div key={etiqueta} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => (indice + 1 < paso ? setPaso(indice + 1) : undefined)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-theme-xs font-medium ${
                  activo
                    ? 'bg-brand-600 text-white'
                    : completado
                      ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400'
                }`}
              >
                {completado ? (
                  <svg
                    className="fill-current"
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16.7045 4.15374C17.0971 4.5697 17.0783 5.20271 16.6623 5.59534L8.7471 12.9733C8.544 13.1611 8.27487 13.2665 7.99413 13.2685C7.71339 13.2705 7.44263 13.1689 7.23667 12.984L2.74498 8.88247C2.32472 8.50431 2.29056 7.87199 2.66872 7.45173C3.04688 7.03147 3.6792 6.99731 4.09946 7.37547L7.97605 10.9306L15.2966 4.10113C15.7126 3.70851 16.3456 3.7273 16.7382 4.14326C16.7526 4.15882 16.7662 4.17508 16.7788 4.19201C16.7582 4.15927 16.739 4.12587 16.7212 4.09191L16.7045 4.15374Z" />
                  </svg>
                ) : (
                  indice + 1
                )}
              </button>
              <span
                className={`text-theme-xs font-medium ${
                  activo ? 'text-gray-800 dark:text-white/90' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {etiqueta}
              </span>
              {indice < 2 && <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
          {error}
        </div>
      )}

      {paso === 1 && (
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
            ¿Qué desea hacer? <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TIPOS_SOLICITUD.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                disabled={esSoloLectura}
                className={`rounded-lg border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  tipo === t.valor
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-500/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:hover:border-gray-600'
                }`}
              >
                <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t.etiqueta}</p>
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  {t.valor === 'CREAR' && 'Registrar un nuevo registro en el sistema.'}
                  {t.valor === 'ACTUALIZAR' && 'Modificar datos de un registro existente.'}
                  {t.valor === 'ACTIVAR' && 'Reactivar un registro inactivo.'}
                  {t.valor === 'DESACTIVAR' && 'Desactivar un registro activo.'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 2 && (
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
            Seleccione la categoría <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(CAMPOS_POR_CATEGORIA).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                disabled={esSoloLectura}
                className={`rounded-lg border px-3 py-2.5 text-left text-theme-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  categoria === cat
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="flex flex-col gap-4">
          {/* Registro: empresa -> sede -> departamento -> supervisor + solicitante */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.03]">
            <h4 className="mb-2.5 text-theme-xs font-semibold text-gray-800 dark:text-white/90">
              Datos del registro
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                  Empresa <span className="text-error-500">*</span>
                </label>
                <select
                  value={empresaId}
                  onChange={(e) => manejarCambioEmpresa(e.target.value)}
                  className={claseInput}
                  disabled={!!ubicacionUsuario || esSoloLectura}
                >
                  <option value="">Seleccione la empresa</option>
                  {empresas.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                  Sede (Centro de costo)
                </label>
                <select
                  value={sedeId}
                  onChange={(e) => manejarCambioSede(e.target.value)}
                  className={claseInput}
                  disabled={!empresaId || !!ubicacionUsuario || esSoloLectura}
                >
                  <option value="">Seleccione la sede</option>
                  {sedes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                  Departamento
                </label>
                <select
                  value={deptId}
                  onChange={(e) => manejarCambioDepartamento(e.target.value)}
                  className={claseInput}
                  disabled={!sedeId || !!ubicacionUsuario || esSoloLectura}
                >
                  <option value="">Seleccione el departamento</option>
                  {departamentos.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                  Supervisor solicitante
                </label>
                <input
                  type="text"
                  value={supervisorNombre || (supervisorId ? 'Cargando…' : 'Sin supervisor asignado')}
                  disabled
                  placeholder="Automático según el departamento"
                  title="El supervisor es el encargado del departamento del solicitante"
                  className={claseInput}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                  Solicitante
                </label>
                <input
                  type="text"
                  value={solicitante ?? ''}
                  disabled
                  placeholder="Su usuario"
                  title="El solicitante es el usuario con sesión activa"
                  className={claseInput}
                />
              </div>
            </div>
          </div>

          {/* Campos dinámicos por categoría */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.03]">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-theme-xs font-semibold text-gray-800 dark:text-white/90">
                Datos de la solicitud
              </h4>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-400">
                {categoria}
              </span>
            </div>
            {camposCategoria.length === 0 ? (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                La categoría «{categoria}» no requiere datos adicionales.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {camposCategoria.map((campo) => (
                  <div
                    key={campo.nombre}
                    className={campo.spanCompleto ? 'sm:col-span-2 xl:col-span-3' : ''}
                  >
                    <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                      {campo.etiqueta}
                      {campo.requerido && <span className="text-error-500"> *</span>}
                    </label>
                    {renderCampo(campo)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documentos requeridos (archivos adjuntos) */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.03]">
            <h4 className="mb-2.5 text-theme-xs font-semibold text-gray-800 dark:text-white/90">
              Documentos requeridos
            </h4>
            <p className="mb-2.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Adjunte el archivo de cada documento. Formatos: PDF, PNG, JPG, DOC, DOCX, XLS, XLSX.
              Tamaño máximo: 10 MB.
            </p>
            {requerimientos.length === 0 ? (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Esta categoría no exige documentos.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-2">
                {requerimientos.map((req, indice) => {
                  const archivo = archivos[req.nombre];
                  const tieneExistente = Boolean(req.archivo_ruta || req.archivo_nombre);
                  const cumplidoVisual = Boolean(archivo) || tieneExistente;
                  const idInput = `req-archivo-${categoria}-${indice}`;
                  return (
                    <div key={req.nombre} className="flex">
                      <div
                        className={`flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                          cumplidoVisual
                            ? 'border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]'
                        }`}
                      >
                        <span className="flex-1 text-theme-xs text-gray-700 dark:text-gray-300">
                          {req.nombre}
                        </span>

                        {archivo ? (
                          <>
                            <span
                              className="max-w-[160px] truncate text-theme-xs font-medium text-success-600 dark:text-success-500"
                              title={archivo.name}
                            >
                              {archivo.name}
                            </span>
                            {!esSoloLectura && (
                              <button
                                type="button"
                                onClick={() => manejarArchivoRequerimiento(req.nombre, null)}
                                className={claseBotonError}
                              >
                                Quitar
                              </button>
                            )}
                          </>
                        ) : tieneExistente ? (
                          <>
                            <span
                              className="max-w-[160px] truncate text-theme-xs font-medium text-success-600 dark:text-success-500"
                              title={req.archivo_nombre ?? ''}
                            >
                              {req.archivo_nombre}
                            </span>
                            {onDescargarArchivo && req.id && (
                              <button
                                type="button"
                                onClick={() => onDescargarArchivo(req.id!)}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                              >
                                <svg
                                  className="mr-1 fill-current"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M10 2.5C10.4142 2.5 10.75 2.83579 10.75 3.25V9.18934L12.7197 7.21967C13.0126 6.92678 13.4874 6.92678 13.7803 7.21967C14.0732 7.51256 14.0732 7.98744 13.7803 8.28033L10.5303 11.5303C10.2374 11.8232 9.76256 11.8232 9.46967 11.5303L6.21967 8.28033C5.92678 7.98744 5.92678 7.51256 6.21967 7.21967C6.51256 6.92678 6.98744 6.92678 7.28033 7.21967L9.25 9.18934V3.25C9.25 2.83579 9.58579 2.5 10 2.5Z" />
                                  <path d="M4.5 14.25C4.5 13.8358 4.83579 13.5 5.25 13.5H14.75C15.1642 13.5 15.5 13.8358 15.5 14.25V16.25C15.5 16.6642 15.1642 17 14.75 17H5.25C4.83579 17 4.5 16.6642 4.5 16.25V14.25Z" />
                                </svg>
                                Descargar
                              </button>
                            )}
                            {!esSoloLectura && (
                              <>
                                <input
                                  id={idInput}
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                                  onChange={(e) => {
                                    manejarArchivoRequerimiento(
                                      req.nombre,
                                      e.target.files?.[0] ?? null
                                    );
                                    e.target.value = '';
                                  }}
                                />
                                <label
                                  htmlFor={idInput}
                                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-2 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                                >
                                  Reemplazar
                                </label>
                              </>
                            )}
                          </>
                        ) : (
                          !esSoloLectura && (
                            <>
                              <input
                                id={idInput}
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                                onChange={(e) => {
                                  manejarArchivoRequerimiento(
                                    req.nombre,
                                    e.target.files?.[0] ?? null
                                  );
                                  e.target.value = '';
                                }}
                              />
                              <label
                                htmlFor={idInput}
                                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                              >
                                <svg
                                  className="mr-1.5 fill-current"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M10 3C10.4142 3 10.75 3.33579 10.75 3.75V9.25H16.25C16.6642 9.25 17 9.58579 17 10C17 10.4142 16.6642 10.75 16.25 10.75H10.75V16.25C10.75 16.6642 10.4142 17 10 17C9.58579 17 9.25 16.6642 9.25 16.25V10.75H3.75C3.33579 10.75 3 10.4142 3 10C3 9.58579 3.33579 9.25 3.75 9.25H9.25V3.75C9.25 3.33579 9.58579 3 10 3Z" />
                                </svg>
                                Adjuntar
                              </label>
                            </>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-400">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Comentarios adicionales"
              disabled={esSoloLectura}
              className={`${claseInput} resize-none`}
            />
          </div>

          {/* Historial de notas (visible al revisar una solicitud) */}
          {solicitudEditar && (solicitudEditar.notas?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.03]">
              <h4 className="mb-2 text-theme-xs font-semibold text-gray-800 dark:text-white/90">
                Historial
              </h4>
              <ol className="flex flex-col gap-2">
                {solicitudEditar.notas!.map((nota) => (
                  <li key={nota.id} className="text-theme-xs">
                    <span className="font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {nota.tipo_nota}
                    </span>{' '}
                    <span className="text-gray-400">
                      {nota.autor_nombre} ·{' '}
                      {new Date(
                        nota.created_at.includes('T') ? nota.created_at : nota.created_at.replace(' ', 'T')
                      ).toLocaleString('es-VE')}
                    </span>
                    {nota.nota && (
                      <p className="mt-0.5 text-theme-sm text-gray-700 dark:text-gray-300">{nota.nota}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={paso === 1 ? alCerrar : irAtras}
          className={claseBotonSecundario}
        >
          {paso === 1 ? 'Cancelar' : 'Atrás'}
        </button>

        {paso < 3 ? (
          <button type="button" onClick={irSiguiente} className={claseBotonPrimario}>
            Continuar
          </button>
        ) : esSoloLectura ? (
          <button type="button" onClick={alCerrar} className={claseBotonPrimario}>
            Cerrar
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button type="button" onClick={alCerrar} className={claseBotonSecundario}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={manejarEnvio}
              disabled={cargando}
              className={claseBotonPrimario}
            >
              {cargando
                ? 'Guardando…'
                : solicitudEditar
                  ? 'Guardar cambios'
                  : 'Guardar solicitud'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}