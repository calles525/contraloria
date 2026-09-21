import { useMemo, useState } from 'react';
import Modal from '../crud/Modal';
import VistaPreviaDocumento from './VistaPreviaDocumento';
import SelectorCamposErroneos, { OpcionCampo } from '../ui/SelectorCamposErroneos';
import {
  CAMPOS_POR_CATEGORIA,
  ESTILO_ESTADO,
  ESTILO_TIPO,
  Solicitud,
  TipoNota,
} from '../../types/solicitudes';

interface PropsGestionarSolicitudModal {
  solicitud: Solicitud;
  alCerrar: () => void;
  onAccion: (
    tipo: 'procesar' | 'regresar' | 'validar' | 'nota',
    nota: string
  ) => Promise<void>;
  onAdjuntarArchivo: (reqId: number, archivo: File) => Promise<void>;
  onQuitarArchivo: (reqId: number) => Promise<void>;
  onDescargarArchivo: (reqId: number) => Promise<void>;
  /** Obtiene el documento adjunto para mostrarlo en la vista previa (sin descargarlo). */
  onVerArchivo?: (reqId: number) => Promise<{ blob: Blob; nombre: string } | null>;
}

const claseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-white/30';

const ITEM_INFO =
  'flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white/[0.03]';

const ITEM_LABEL = 'text-theme-xs font-medium text-gray-500 dark:text-gray-400';
const ITEM_VALOR = 'text-theme-sm font-medium text-gray-800 dark:text-white/90';

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const fechaLocal = new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'));
  return fechaLocal.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Convierte un valor de la solicitud a texto corto para mostrarlo en la opción. */
function formatearValorCampo(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (Array.isArray(valor)) return valor.join(', ');
  return String(valor);
}

const ESTILO_NOTAS: Record<TipoNota, string> = {
  NOTA: 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300',
  PROCESAR: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  REGRESAR: 'bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  RECHAZAR: 'bg-error-100 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  VALIDAR: 'bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  REENVIAR: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
};

const ETIQUETA_NOTAS: Record<TipoNota, string> = {
  NOTA: 'Nota',
  PROCESAR: 'Proceso',
  REGRESAR: 'Devuelta',
  RECHAZAR: 'Rechazo',
  VALIDAR: 'Validación',
  REENVIAR: 'Reenvío',
};

export default function GestionarSolicitudModal({
  solicitud,
  alCerrar,
  onAccion,
  onAdjuntarArchivo,
  onQuitarArchivo,
  onDescargarArchivo,
  onVerArchivo,
}: PropsGestionarSolicitudModal) {
  const [notaSeguimiento, setNotaSeguimiento] = useState('');
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
  const [subiendoId, setSubiendoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState<{ blob: Blob; nombre: string } | null>(null);
  const [tabActivo, setTabActivo] = useState<'historial' | 'vistaPrevia'>('historial');
  const [motivoAccion, setMotivoAccion] = useState<'regresar' | null>(null);
  /** Campos de la solicitud marcados como erróneos (motivo de regreso). */
  const [camposErrores, setCamposErrores] = useState<string[]>([]);
  /** Comentario adicional opcional junto a los campos marcados. */
  const [textoMotivo, setTextoMotivo] = useState('');

  const estado = solicitud.estado;
  const esTerminal = estado === 'RECHAZADA' || estado === 'VALIDADA';

  /** Campos de la solicitud disponibles para marcar como erróneos (solo los del formulario). */
  const opcionesCampos = useMemo<OpcionCampo[]>(() => {
    const definidos = CAMPOS_POR_CATEGORIA[solicitud.categoria] ?? [];
    const opciones: OpcionCampo[] = [];

    // Campos dinámicos según la categoría (con la etiqueta legible del formulario).
    const datos = solicitud.datos ?? {};
    for (const campo of definidos) {
      const valor = datos[campo.nombre];
      const texto = formatearValorCampo(valor);
      if (!texto) continue;
      opciones.push({
        valor: `datos.${campo.nombre}`,
        etiqueta: campo.etiqueta,
        valorActual: texto,
      });
    }

    // Documentos requeridos (cuando la categoría exige adjuntos).
    for (const req of solicitud.requerimientos ?? []) {
      opciones.push({
        valor: `req.${req.id ?? req.nombre}`,
        etiqueta: req.nombre,
        valorActual: req.archivo_nombre ?? (req.cumplido ? 'Cumplido' : 'Sin adjuntar'),
      });
    }

    return opciones;
  }, [solicitud]);

  /** Muestra el documento adjunto en el tab "Vista previa". */
  async function manejarVer(reqId: number) {
    if (!onVerArchivo) return;
    try {
      const previa = await onVerArchivo(reqId);
      if (previa) {
        setVistaPrevia(previa);
        setTabActivo('vistaPrevia');
      }
    } catch {
      setError('No se pudo mostrar la vista previa del documento.');
    }
  }

  /** Cierra la vista previa y vuelve al historial. */
  function cerrarVistaPrevia() {
    setVistaPrevia(null);
    setTabActivo('historial');
  }

  async function ejecutarAccion(
    tipo: 'procesar' | 'regresar' | 'validar' | 'nota',
    nota: string
  ) {
    setError('');
    setAccionEnCurso(tipo);
    try {
      await onAccion(tipo, nota);
      setNotaSeguimiento('');
      setMotivoAccion(null);
      setCamposErrores([]);
      setTextoMotivo('');
    } catch {
      setError('No se pudo completar la acción. Intente de nuevo.');
    } finally {
      setAccionEnCurso(null);
    }
  }

  /** Pide el motivo antes de regresar una solicitud, dentro del propio modal. */
  function pedirMotivo() {
    setCamposErrores([]);
    setTextoMotivo('');
    setMotivoAccion('regresar');
  }

  /** Etiqueta legible de una opción de campo seleccionada. */
  function etiquetaCampo(valor: string): string {
    return opcionesCampos.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
  }

  /** Confirma la acción de regresar con los campos erróneos marcados como motivo. */
  async function confirmarMotivo() {
    if (!motivoAccion) return;
    if (camposErrores.length === 0) {
      setError('Debe seleccionar al menos un campo con error.');
      return;
    }
    const listadoCampos = camposErrores.map(etiquetaCampo).join(', ');
    const motivo = textoMotivo.trim()
      ? `Campos con error: ${listadoCampos}. ${textoMotivo.trim()}`
      : `Campos con error: ${listadoCampos}.`;
    await ejecutarAccion(motivoAccion, motivo);
  }

  const detallesDatos: [string, unknown][] = solicitud.datos
    ? Object.entries(solicitud.datos).filter(
        ([clave, valor]) =>
          clave !== 'supervisor_id' &&
          valor !== null &&
          valor !== undefined &&
          valor !== ''
      )
    : [];

  const claseBotonAccion = (color: string) =>
    `inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-theme-xs font-medium shadow-theme-xs ${color}`;

  const botones = {
    procesar:
      'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60',
    regresar:
      'border border-warning-200 bg-white text-warning-600 hover:bg-warning-50 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400',
    validar:
      'bg-success-600 text-white hover:bg-success-700 disabled:opacity-60',
  };

  return (
    <Modal
      titulo={esTerminal ? `Vista previa · ${solicitud.numero}` : `Solicitud ${solicitud.numero}`}
      alCerrar={alCerrar}
      ancho={vistaPrevia ? 'full' : 'xl'}
    >
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Columna principal: datos y gestión */}
        <div className="lg:col-span-3">
      {/* Encabezado: tipo y estado */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-theme-xs font-medium ${ESTILO_TIPO[solicitud.tipo_solicitud]}`}
        >
          {solicitud.tipo_solicitud}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-theme-xs font-medium ${ESTILO_ESTADO[solicitud.estado]}`}
        >
          {solicitud.estado}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-theme-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-400">
          {solicitud.categoria}
        </span>
      </div>

      {/* Datos del registro */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={ITEM_INFO}>
          <span className={ITEM_LABEL}>Empresa</span>
          <span className={ITEM_VALOR}>{solicitud.empresa_nombre}</span>
        </div>
        <div className={ITEM_INFO}>
          <span className={ITEM_LABEL}>Sede</span>
          <span className={ITEM_VALOR}>{solicitud.sede_nombre || '—'}</span>
        </div>
        <div className={ITEM_INFO}>
          <span className={ITEM_LABEL}>Departamento</span>
          <span className={ITEM_VALOR}>{solicitud.departamento_nombre || '—'}</span>
        </div>
        <div className={ITEM_INFO}>
          <span className={ITEM_LABEL}>Solicitante</span>
          <span className={ITEM_VALOR}>{solicitud.solicitante_nombre}</span>
        </div>
        <div className={ITEM_INFO}>
          <span className={ITEM_LABEL}>Supervisor</span>
          <span className={ITEM_VALOR}>{solicitud.supervisor_nombre || '—'}</span>
        </div>
        <div className={ITEM_INFO}>
          <span className={ITEM_LABEL}>Fecha de solicitud</span>
          <span className={ITEM_VALOR}>{formatearFecha(solicitud.fecha_solicitud)}</span>
        </div>
        {solicitud.fecha_gestion && (
          <div className={ITEM_INFO}>
            <span className={ITEM_LABEL}>Fecha de gestión</span>
            <span className={ITEM_VALOR}>{formatearFecha(solicitud.fecha_gestion)}</span>
          </div>
        )}
        {solicitud.fecha_validacion && (
          <div className={ITEM_INFO}>
            <span className={ITEM_LABEL}>Fecha de validación</span>
            <span className={ITEM_VALOR}>{formatearFecha(solicitud.fecha_validacion)}</span>
          </div>
        )}
      </div>

      {/* Datos dinámicos por categoría */}
      {detallesDatos.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2.5 text-theme-xs font-semibold text-gray-800 dark:text-white/90">
            Datos de la solicitud
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {detallesDatos.map(([clave, valor]) => (
              <div
                key={clave}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-white/[0.03]"
              >
                <span className="text-theme-xs text-gray-500 dark:text-gray-400">{clave}</span>
                <span className="text-right text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {Array.isArray(valor) ? valor.join(', ') : String(valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentos requeridos (archivos adjuntos) */}
      {solicitud.requerimientos && solicitud.requerimientos.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2.5 text-theme-xs font-semibold text-gray-800 dark:text-white/90">
            Documentos requeridos
          </h4>
          <ul className="flex flex-col gap-2">
            {solicitud.requerimientos.map((req) => {
              const tieneArchivo = Boolean(req.archivo_ruta);
              const idInput = `gs-req-archivo-${req.id}`;
              return (
                <li
                  key={req.id ?? req.nombre}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                    req.cumplido
                      ? 'border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      req.cumplido
                        ? 'bg-success-600 text-white'
                        : 'bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400'
                    }`}
                  >
                    {req.cumplido ? (
                      <svg
                        className="fill-current"
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M16.7045 4.15374C17.0971 4.5697 17.0783 5.20271 16.6623 5.59534L8.7471 12.9733C8.544 13.1611 8.27487 13.2665 7.99413 13.2685C7.71339 13.2705 7.44263 13.1689 7.23667 12.984L2.74498 8.88247C2.32472 8.50431 2.29056 7.87199 2.66872 7.45173C3.04688 7.03147 3.6792 6.99731 4.09946 7.37547L7.97605 10.9306L15.2966 4.10113C15.7126 3.70851 16.3456 3.7273 16.7382 4.14326C16.7526 4.15882 16.7662 4.17508 16.7788 4.19201C16.7582 4.15927 16.739 4.12587 16.7212 4.09191L16.7045 4.15374Z" />
                      </svg>
                    ) : (
                      <span className="text-theme-xs font-medium">{'!'}</span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-theme-xs text-gray-700 dark:text-gray-300">{req.nombre}</p>
                    {tieneArchivo && (
                      <p
                        className="max-w-[260px] truncate text-theme-xs text-gray-500 dark:text-gray-400"
                        title={req.archivo_nombre ?? ''}
                      >
                        {req.archivo_nombre}
                      </p>
                    )}
                  </div>

                  {tieneArchivo && (
                    <>
                      <button
                        type="button"
                        onClick={() => manejarVer(req.id!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      >
                        <svg
                          className="fill-current"
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
                      <button
                        type="button"
                        onClick={() => onDescargarArchivo(req.id!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      >
                        <svg
                          className="fill-current"
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10 2.5C10.4142 2.5 10.75 2.83579 10.75 3.25V9.18934L12.7197 7.21967C13.0126 6.92678 13.4874 6.92678 13.7803 7.21967C14.0732 7.51256 14.0732 7.98744 13.7803 8.28033L10.5303 11.5303C10.2374 11.8232 9.76256 11.8232 9.46967 11.5303L6.21967 8.28033C5.92678 7.98744 5.92678 7.51256 6.21967 7.21967C6.51256 6.92678 6.98744 6.92678 7.28033 7.21967L9.25 9.18934V3.25C9.25 2.83579 9.58579 2.5 10 2.5Z" />
                          <path d="M4.5 14.25C4.5 13.8358 4.83579 13.5 5.25 13.5H14.75C15.1642 13.5 15.5 13.8358 15.5 14.25V16.25C15.5 16.6642 15.1642 17 14.75 17H5.25C4.83579 17 4.5 16.6642 4.5 16.25V14.25Z" />
                        </svg>
                        Descargar
                      </button>
                    </>
                  )}

                  {!esTerminal && (
                    <>
                      <input
                        id={idInput}
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                          const archivo = e.target.files?.[0];
                          e.target.value = '';
                          if (archivo) {
                            setSubiendoId(req.id ?? null);
                            onAdjuntarArchivo(req.id!, archivo).finally(() =>
                              setSubiendoId(null)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={idInput}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      >
                        <svg
                          className="fill-current"
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10 3C10.4142 3 10.75 3.33579 10.75 3.75V9.25H16.25C16.6642 9.25 17 9.58579 17 10C17 10.4142 16.6642 10.75 16.25 10.75H10.75V16.25C10.75 16.6642 10.4142 17 10 17C9.58579 17 9.25 16.6642 9.25 16.25V10.75H3.75C3.33579 10.75 3 10.4142 3 10C3 9.58579 3.33579 9.25 3.75 9.25H9.25V3.75C9.25 3.33579 9.58579 3 10 3Z" />
                        </svg>
                        {subiendoId === req.id
                          ? 'Subiendo…'
                          : tieneArchivo
                            ? 'Reemplazar'
                            : 'Adjuntar'}
                      </label>
                      {tieneArchivo && (
                        <button
                          type="button"
                          onClick={() => onQuitarArchivo(req.id!)}
                          className="inline-flex items-center gap-1 rounded-lg border border-error-200 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500"
                        >
                          Quitar
                        </button>
                      )}
                    </>
                  )}

                  <span className="ml-auto text-theme-xs text-gray-400">
                    {req.cumplido ? 'Cumplido' : 'Pendiente'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      </div>
        {/* Columna derecha: pestañas Historial / Vista previa */}
        <div className="lg:col-span-2">
          {/* Pestañas */}
          <div className="mb-4 flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setTabActivo('historial')}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-theme-sm font-medium transition-colors ${
                tabActivo === 'historial'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <svg
                className={tabActivo === 'historial' ? 'fill-current' : 'fill-gray-400 dark:fill-gray-500'}
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16C6.68629 16 4 13.3137 4 10Z" />
                <path d="M10 5.75C10.4142 5.75 10.75 6.08579 10.75 6.5V9.68934L12.7803 11.7197C13.0732 12.0126 13.0732 12.4874 12.7803 12.7803C12.4874 13.0732 12.0126 13.0732 11.7197 12.7803L9.46967 10.5303C9.32902 10.3897 9.25 10.1989 9.25 10V6.5C9.25 6.08579 9.58579 5.75 10 5.75Z" />
              </svg>
              Historial
            </button>
            <button
              type="button"
              onClick={() => setTabActivo('vistaPrevia')}
              disabled={!vistaPrevia}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-theme-sm font-medium transition-colors ${
                tabActivo === 'vistaPrevia'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } ${!vistaPrevia ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <svg
                className={tabActivo === 'vistaPrevia' ? 'fill-current' : 'fill-gray-400 dark:fill-gray-500'}
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 12.5C10.8284 12.5 11.5 11.8284 11.5 11C11.5 10.1716 10.8284 9.5 10 9.5C9.17157 9.5 8.5 10.1716 8.5 11C8.5 11.8284 9.17157 12.5 10 12.5Z" />
                <path d="M2 11C2 11 4.27273 5.5 10 5.5C15.7273 5.5 18 11 18 11C18 11 15.7273 16.5 10 16.5C4.27273 16.5 2 11 2 11Z" />
              </svg>
              Vista previa
            </button>
          </div>

          {/* Contenido: Historial */}
          {tabActivo === 'historial' && (
            <div>
              {solicitud.notas && solicitud.notas.length > 0 ? (
                <ol className="flex flex-col gap-4 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                {solicitud.notas.map((nota) => (
                  <li key={nota.id} className="relative">
                    <span
                      className={`absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full text-theme-xs font-bold ${ESTILO_NOTAS[nota.tipo_nota]}`}
                    >
                      {nota.tipo_nota === 'VALIDAR' ? '✓' : nota.tipo_nota === 'RECHAZAR' ? '✕' : nota.tipo_nota === 'REGRESAR' ? '⇦' : nota.tipo_nota === 'PROCESAR' ? '▶' : '•'}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {ETIQUETA_NOTAS[nota.tipo_nota]}
                        </span>
                        <span className="text-theme-xs text-gray-400">
                          {nota.autor_nombre} · {formatearFecha(nota.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-theme-sm text-gray-700 dark:text-gray-300">
                        {nota.nota}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              ) : (
                <p className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-theme-xs text-gray-400 dark:border-gray-700">
                  Sin movimientos registrados.
                </p>
              )}
            </div>
          )}

          {/* Contenido: Vista previa del documento */}
          {tabActivo === 'vistaPrevia' && (
            <div>
              {vistaPrevia ? (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p
                      className="max-w-full truncate text-theme-xs font-medium text-gray-700 dark:text-gray-300"
                      title={vistaPrevia.nombre}
                    >
                      {vistaPrevia.nombre}
                    </p>
                    <button
                      type="button"
                      onClick={cerrarVistaPrevia}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-theme-xs font-medium text-gray-500 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                      Cerrar
                    </button>
                  </div>
                  <VistaPreviaDocumento archivo={vistaPrevia} />
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-theme-xs text-gray-400 dark:border-gray-700">
                  Pulse "Ver" en un documento adjunto para previsualizarlo aquí.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Observaciones */}
      {!esTerminal && (
        <div className="mb-5">
          <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
            Observaciones
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={notaSeguimiento}
              onChange={(e) => setNotaSeguimiento(e.target.value)}
              rows={2}
              placeholder="Escriba una observación (opcional)"
              className={`${claseInput} resize-none sm:flex-1`}
            />
            <button
              type="button"
              onClick={() => ejecutarAccion('nota', notaSeguimiento)}
              disabled={!notaSeguimiento.trim() || accionEnCurso !== null}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Acciones de gestión */}
      {!esTerminal && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          {motivoAccion ? (
            <div>
              <p className="mb-2.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Motivo para regresar la solicitud
              </p>
              <label className="mb-2 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Seleccione los campos de la solicitud que están erróneos
              </label>
              <SelectorCamposErroneos
                opciones={opcionesCampos}
                seleccionados={camposErrores}
                onChange={(valores) => {
                  setCamposErrores(valores);
                  if (error) setError('');
                }}
              />
              <textarea
                value={textoMotivo}
                onChange={(e) => {
                  setTextoMotivo(e.target.value);
                  if (error) setError('');
                }}
                rows={2}
                placeholder="Comentario adicional (opcional)…"
                className={`${claseInput} mt-2.5 resize-none`}
              />
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMotivoAccion(null);
                    setCamposErrores([]);
                    setTextoMotivo('');
                    setError('');
                  }}
                  disabled={accionEnCurso !== null}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarMotivo}
                  disabled={accionEnCurso !== null}
                  className="inline-flex items-center justify-center rounded-lg bg-warning-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-warning-700 disabled:opacity-60"
                >
                  {accionEnCurso === 'regresar' ? 'Regresando…' : 'Regresar solicitud'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {(estado === 'PENDIENTE' || estado === 'DEVUELTA') && (
                <button
                  type="button"
                  onClick={() => ejecutarAccion('procesar', 'Solicitud en proceso.')}
                  disabled={accionEnCurso !== null}
                  className={claseBotonAccion(botones.procesar)}
                >
                  {accionEnCurso === 'procesar' ? 'Procesando…' : 'Iniciar proceso'}
                </button>
              )}
              {estado === 'EN PROCESO' && (
                <button
                  type="button"
                  onClick={() => pedirMotivo()}
                  disabled={accionEnCurso !== null}
                  className={claseBotonAccion(botones.regresar)}
                >
                  {accionEnCurso === 'regresar' ? 'Regresando…' : 'Regresar'}
                </button>
              )}
              {estado === 'EN PROCESO' && (
                <button
                  type="button"
                  onClick={() => ejecutarAccion('validar', 'Solicitud validada.')}
                  disabled={accionEnCurso !== null}
                  className={claseBotonAccion(botones.validar)}
                >
                  {accionEnCurso === 'validar' ? 'Validando…' : 'Validar'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {esTerminal && (
        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="button"
            onClick={alCerrar}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            Cerrar
          </button>
        </div>
      )}
    </Modal>
  );
}