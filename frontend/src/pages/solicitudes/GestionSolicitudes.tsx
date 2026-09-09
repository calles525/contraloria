import { useCallback, useEffect, useState } from 'react';
import GestionarSolicitudModal from '../../components/solicitudes/GestionarSolicitudModal';
import { solicitudesApi } from '../../services/solicitudes';
import {
  CATEGORIAS,
  ESTADOS_SOLICITUD,
  ESTILO_ESTADO,
  ESTILO_TIPO,
  Solicitud,
} from '../../types/solicitudes';
import { confirmarEliminacion, notificarExito, notificarError } from '../../utils/sweetalert';

const claseCe =
  'rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90';

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

export default function GestionSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState('');

  // Filtros.
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [buscador, setBuscador] = useState('');

  // Modal de gestión.
  const [solicitudGestion, setSolicitudGestion] = useState<Solicitud | null>(null);

  const esTerminal = (estado: Solicitud['estado']) => estado === 'RECHAZADA' || estado === 'VALIDADA';

  const cargarSolicitudes = useCallback(async () => {
    setCargandoLista(true);
    try {
      setSolicitudes(
        await solicitudesApi.listar({
          estado: filtroEstado || undefined,
          categoria: filtroCategoria || undefined,
          q: buscador || undefined,
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

  /** Abre la solicitud en el modal de gestión (carga el detalle completo). */
  async function abrirGestion(solicitud: Solicitud) {
    try {
      setSolicitudGestion(await solicitudesApi.obtener(solicitud.id));
      setError('');
    } catch {
      notificarError('No se pudo cargar el detalle de la solicitud.');
    }
  }

  /** Ejecuta una acción de gestión sobre la solicitud abierta. */
  async function manejarAccionGestion(
    tipo: 'procesar' | 'regresar' | 'rechazar' | 'validar' | 'nota',
    nota: string
  ) {
    if (!solicitudGestion) return;
    let actualizada: Solicitud;
    switch (tipo) {
      case 'procesar':
        actualizada = await solicitudesApi.procesar(solicitudGestion.id, nota);
        notificarExito('Solicitud en proceso.');
        break;
      case 'regresar':
        actualizada = await solicitudesApi.regresar(solicitudGestion.id, nota);
        notificarExito('Solicitud devuelta.');
        break;
      case 'rechazar':
        actualizada = await solicitudesApi.rechazar(solicitudGestion.id, nota);
        notificarExito('Solicitud rechazada.');
        break;
      case 'validar':
        actualizada = await solicitudesApi.validar(solicitudGestion.id, nota);
        notificarExito('Solicitud validada.');
        break;
      default:
        actualizada = await solicitudesApi.agregarNota(solicitudGestion.id, nota);
        break;
    }
    setSolicitudGestion(actualizada);
    await cargarSolicitudes();
  }

  /** Adjunta o reemplaza el documento de un requerimiento desde el modal de gestión. */
  async function manejarAdjuntarArchivo(reqId: number, archivo: File) {
    if (!solicitudGestion) return;
    try {
      const actualizada = await solicitudesApi.subirArchivoRequerimiento(
        solicitudGestion.id,
        reqId,
        archivo
      );
      setSolicitudGestion(actualizada);
      notificarExito('Documento adjuntado.');
    } catch {
      notificarError('No se pudo adjuntar el documento.');
    }
  }

  /** Quita el documento de un requerimiento desde el modal de gestión. */
  async function manejarQuitarArchivo(reqId: number) {
    if (!solicitudGestion) return;
    const confirmar = await confirmarEliminacion(
      'Quitar documento',
      '¿Desea quitar el documento adjunto de este requerimiento?'
    );
    if (!confirmar) return;
    try {
      const actualizada = await solicitudesApi.quitarArchivoRequerimiento(
        solicitudGestion.id,
        reqId
      );
      setSolicitudGestion(actualizada);
      notificarExito('Documento removido.');
    } catch {
      notificarError('No se pudo quitar el documento.');
    }
  }

  /** Descarga el documento adjunto de un requerimiento. */
  async function manejarDescargarArchivo(reqId: number) {
    if (!solicitudGestion) return;
    try {
      const descarga = await solicitudesApi.descargarArchivoRequerimiento(
        solicitudGestion.id,
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

  /**
   * Prepara el documento adjunto para la vista previa dentro del modal.
   * Devuelve el blob y el nombre; el modal lo muestra sin descargarlo.
   */
  async function manejarVerArchivo(
    reqId: number
  ): Promise<{ blob: Blob; nombre: string } | null> {
    if (!solicitudGestion) return null;
    try {
      const descarga = await solicitudesApi.descargarArchivoRequerimiento(
        solicitudGestion.id,
        reqId
      );
      return { blob: descarga.blob, nombre: descarga.nombre };
    } catch {
      notificarError('No se pudo abrir el documento.');
      return null;
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            Gestión de solicitudes
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Dé seguimiento a las solicitudes: inícielas, devuélvalas, rechácelas o valídelas, y
            revise los documentos adjuntos.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          {/* Cabecera con filtros */}
          <div className="mb-4 flex flex-col gap-3">
            <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Listado
            </h3>
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
                        <button
                          type="button"
                          onClick={() => abrirGestion(solicitud)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-theme-xs font-medium shadow-theme-xs ${
                            esTerminal(solicitud.estado)
                              ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
                              : 'bg-brand-600 text-white hover:bg-brand-700'
                          }`}
                        >
                          <svg
                            className={esTerminal(solicitud.estado) ? 'fill-gray-500 dark:fill-gray-400' : 'fill-current'}
                            width="14"
                            height="14"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M11.0001 3.99994C10.8672 3.58178 10.4767 3.30691 10.0353 3.31097C9.62583 3.31478 9.24923 3.55666 9.08955 3.93228L4.72955 13.8539C4.5596 14.2547 4.68799 14.7189 5.04417 14.9737C5.36246 15.202 5.79732 15.1585 6.06602 14.8897L8.99999 11.9557V16.0001C8.99999 16.5524 9.44771 17.0001 9.99999 17.0001C10.5523 17.0001 11 16.5524 11 16.0001V8.41428L14.2929 11.7071C14.6834 12.0976 15.3166 12.0976 15.7071 11.7071C16.0976 11.3166 16.0976 10.6834 15.7071 10.2929L11.7071 6.29295C11.6149 6.20075 11.5048 6.1282 11.3861 6.07714C11.2824 6.03072 11.1704 6.00337 11.0564 5.99676C11.0376 5.99555 11.0188 5.99498 11 5.995C11 5.995 10.9999 5.99502 11.0001 3.99994Z" />
                          </svg>
                          {esTerminal(solicitud.estado) ? 'Ver' : 'Gestionar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: gestión de solicitud */}
      {solicitudGestion && (
        <GestionarSolicitudModal
          solicitud={solicitudGestion}
          alCerrar={() => setSolicitudGestion(null)}
          onAccion={manejarAccionGestion}
          onAdjuntarArchivo={manejarAdjuntarArchivo}
          onQuitarArchivo={manejarQuitarArchivo}
          onDescargarArchivo={manejarDescargarArchivo}
          onVerArchivo={manejarVerArchivo}
        />
      )}
    </div>
  );
}