import { useCallback, useEffect, useState } from 'react';
import CrearSolicitudModal from '../../components/solicitudes/CrearSolicitudModal';
import { solicitudesApi } from '../../services/solicitudes';
import {
  CATEGORIAS,
  ESTADOS_SOLICITUD,
  ESTILO_ESTADO,
  ESTILO_TIPO,
  Solicitud,
} from '../../types/solicitudes';
import { notificarExito, notificarError } from '../../utils/sweetalert';

const claseCe =
  'rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90';

interface DatosGuardarSolicitud {
  tipo_solicitud: Solicitud['tipo_solicitud'];
  categoria: string;
  empresa_id: number;
  cost_center_id?: number | null;
  department_id?: number | null;
  supervisor_person_id?: number | null;
  datos: Record<string, unknown>;
  observaciones?: string;
  requerimientos: { nombre: string; cumplido: boolean }[];
  archivos: Record<string, File>;
}

/** Formatea una fecha del backend ("YYYY-MM-DD HH:MM:SS") de forma segura. */
function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  try {
    const fechaLocal = new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'));
    return fechaLocal.toLocaleDateString('es-VE');
  } catch {
    return '—';
  }
}

export default function CreacionSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState('');

  // Filtros.
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [buscador, setBuscador] = useState('');

  // Modales.
  const [modalCrear, setModalCrear] = useState(false);
  const [solicitudEditar, setSolicitudEditar] = useState<Solicitud | null>(null);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);

  const esTerminal = (estado: Solicitud['estado']) => estado === 'RECHAZADA' || estado === 'VALIDADA';

  const cargarSolicitudes = useCallback(async () => {
    setCargandoLista(true);
    try {
      setSolicitudes(
        await solicitudesApi.listar({
          estado: filtroEstado || undefined,
          categoria: filtroCategoria || undefined,
          q: buscador || undefined,
          solo_departamento: '1',
        })
      );
      setError('');
    } catch {
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setCargandoLista(false);
    }
  }, [filtroEstado, filtroCategoria, buscador]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  /** Abre la solicitud para editarla (o verla en solo lectura si está cerrada). */
  async function abrirSolicitud(solicitud: Solicitud) {
    try {
      setSolicitudEditar(await solicitudesApi.obtener(solicitud.id, true));
      setError('');
    } catch {
      notificarError('No se pudo cargar la solicitud.');
    }
  }

  /** Crea o actualiza la solicitud y sube los documentos nuevos elegidos en el wizard. */
  async function manejarGuardar(datos: DatosGuardarSolicitud) {
    setCargandoGuardar(true);
    try {
      const guardada = solicitudEditar
        ? await solicitudesApi.actualizar(solicitudEditar.id, datos)
        : await solicitudesApi.crear(datos);

      // Los archivos se suben después de guardar (se necesita el id de la solicitud).
      const detalle = await solicitudesApi.obtener(guardada.id);
      const subidas = await Promise.allSettled(
        (detalle.requerimientos ?? []).map((req) => {
          const archivo = datos.archivos[req.nombre];
          if (!archivo) return Promise.resolve();
          return solicitudesApi.subirArchivoRequerimiento(detalle.id, req.id!, archivo);
        })
      );

      setModalCrear(false);
      setSolicitudEditar(null);
      await cargarSolicitudes();

      const fallidas = subidas.filter((r) => r.status === 'rejected').length;
      if (fallidas > 0) {
        notificarError(
          solicitudEditar
            ? `La solicitud se actualizó, pero ${fallidas} documento(s) no se pudieron adjuntar.`
            : `La solicitud se creó, pero ${fallidas} documento(s) no se pudieron adjuntar.`
        );
      } else {
        notificarExito(
          solicitudEditar
            ? 'Solicitud actualizada correctamente.'
            : 'Solicitud creada correctamente.'
        );
      }
    } catch {
      notificarError(
        solicitudEditar
          ? 'No se pudo actualizar la solicitud. Verifique los datos.'
          : 'No se pudo crear la solicitud. Verifique los datos.'
      );
    } finally {
      setCargandoGuardar(false);
    }
  }

  /** Descarga el documento adjunto de un requerimiento desde el modal de edición/lectura. */
  async function manejarDescargarArchivo(reqId: number) {
    if (!solicitudEditar) return;
    try {
      const descarga = await solicitudesApi.descargarArchivoRequerimiento(
        solicitudEditar.id,
        reqId
      );
      const url = URL.createObjectURL(descarga.blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = descarga.nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      notificarError('No se pudo descargar el documento.');
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            Creación de solicitudes
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Cree y edite las solicitudes de creación, actualización, activación o desactivación de
            datos maestros. Las solicitudes rechazadas o validadas quedan en solo lectura.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          {/* Cabecera con filtros y botón crear */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                Listado
              </h3>
              <button
                type="button"
                onClick={() => setModalCrear(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 3C10.4142 3 10.75 3.33579 10.75 3.75V9.25H16.25C16.6642 9.25 17 9.58579 17 10C17 10.4142 16.6642 10.75 16.25 10.75H10.75V16.25C10.75 16.6642 10.4142 17 10 17C9.58579 17 9.25 16.6642 9.25 16.25V10.75H3.75C3.33579 10.75 3 10.4142 3 10C3 9.58579 3.33579 9.25 3.75 9.25H9.25V3.75C9.25 3.33579 9.58579 3 10 3Z"
                    fill=""
                  />
                </svg>
                Nueva solicitud
              </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={buscador}
                onChange={(e) => setBuscador(e.target.value)}
                placeholder="Buscar por número o categoría…"
                className={claseCe}
              />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={claseCe}
              >
                <option value="">Estado: todos</option>
                {ESTADOS_SOLICITUD.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className={claseCe}
              >
                <option value="">Categoría: todas</option>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
              {error}
            </div>
          )}

          {cargandoLista ? (
            <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
              Cargando…
            </p>
          ) : solicitudes.length === 0 ? (
            <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
              No hay solicitudes registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Sede / Departamento
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Solicitante
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((solicitud) => (
                    <tr
                      key={solicitud.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                        {solicitud.numero}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-theme-xs font-medium ${ESTILO_TIPO[solicitud.tipo_solicitud]}`}
                        >
                          {solicitud.tipo_solicitud}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                        {solicitud.categoria}
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                        {solicitud.empresa_nombre}
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {solicitud.sede_nombre || '—'}
                        {solicitud.departamento_nombre
                          ? ` · ${solicitud.departamento_nombre}`
                          : ''}
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {solicitud.solicitante_nombre}
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {formatearFechaCorta(solicitud.fecha_solicitud)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-theme-xs font-medium ${ESTILO_ESTADO[solicitud.estado]}`}
                        >
                          {solicitud.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {esTerminal(solicitud.estado) ? (
                          <button
                            type="button"
                            onClick={() => abrirSolicitud(solicitud)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                          >
                            <svg
                              className="fill-gray-500 dark:fill-gray-400"
                              width="14"
                              height="14"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M10 12.5C10.8284 12.5 11.5 11.8284 11.5 11C11.5 10.1716 10.8284 9.5 10 9.5C9.17157 9.5 8.5 10.1716 8.5 11C8.5 11.8284 9.17157 12.5 10 12.5Z" />
                              <path d="M2 11C2 11 4.27273 5.5 10 5.5C15.7273 5.5 18 11 18 11C18 11 15.7273 16.5 10 16.5C4.27273 16.5 2 11 2 11Z" />
                            </svg>
                            Ver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => abrirSolicitud(solicitud)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-theme-xs font-medium text-white shadow-theme-xs hover:bg-brand-700"
                          >
                            <svg
                              className="fill-current"
                              width="14"
                              height="14"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12.1464 3.85355C13.3281 2.67188 15.2362 2.67188 16.4178 3.85355L16.6464 4.08218C17.8281 5.26385 17.8281 7.17195 16.6464 8.35362L8.88231 16.1177C8.62587 16.3741 8.29445 16.543 7.93564 16.6027L4.47079 17.232C3.94329 17.3232 3.42492 16.9858 3.28459 16.4714L2.51794 13.5968C2.41076 13.2086 2.42037 12.7963 2.54548 12.4142L3.14645 10.6464C3.33948 10.0955 3.76426 9.65306 4.30651 9.4375L12.1464 3.85355ZM15.3536 4.93934C14.7434 4.32917 13.7265 4.32917 13.1163 4.93934L5.45579 12.5999C5.32388 12.7318 5.23471 12.9003 5.19978 13.0831L4.83155 14.7578L6.69763 14.3424C6.84565 14.3112 6.98516 14.2445 7.10204 14.1477L14.9706 6.27917C15.5808 5.669 15.5808 4.65202 14.9706 4.04185L15.3536 4.93934Z" />
                            </svg>
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: crear o editar solicitud */}
      {(modalCrear || solicitudEditar) && (
        <CrearSolicitudModal
          solicitudEditar={solicitudEditar}
          alCerrar={() => {
            setModalCrear(false);
            setSolicitudEditar(null);
          }}
          cargando={cargandoGuardar}
          onCrear={manejarGuardar}
          onDescargarArchivo={manejarDescargarArchivo}
        />
      )}
    </div>
  );
}