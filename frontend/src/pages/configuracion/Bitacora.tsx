import { useCallback, useEffect, useState } from 'react';
import { bitacoraApi, RegistroBitacora, OpcionesBitacora } from '../../services/bitacora';

interface Filtros {
  usuario_id: string;
  modulo: string;
  desde: string;
  hasta: string;
  q: string;
}

const FILTROS_INICIALES: Filtros = {
  usuario_id: '',
  modulo: '',
  desde: '',
  hasta: '',
  q: '',
};

const LIMITE = 25;

function clasesBadgeAccion(accion: string): string {
  switch (accion) {
    case 'crear':
    case 'procesar':
    case 'validar':
      return 'bg-success-50 text-success-600 dark:bg-success-500/[0.12] dark:text-success-400';
    case 'actualizar':
    case 'adjuntar':
      return 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400';
    case 'eliminar':
    case 'rechazar':
      return 'bg-error-50 text-error-600 dark:bg-error-500/[0.12] dark:text-error-400';
    case 'regresar':
    case 'quitar':
      return 'bg-warning-50 text-warning-600 dark:bg-warning-500/[0.12] dark:text-warning-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300';
  }
}

function formatearFecha(fecha: string): string {
  const formato = new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return formato.format(new Date(fecha.replace(' ', 'T')));
}

const claseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-white/30';

export default function Bitacora() {
  const [registros, setRegistros] = useState<RegistroBitacora[]>([]);
  const [opciones, setOpciones] = useState<OpcionesBitacora>({ usuarios: [], modulos: [] });
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  const cargarOpciones = useCallback(async () => {
    try {
      const datos = await bitacoraApi.opciones();
      setOpciones(datos);
    } catch {
      // Los filtros quedan vacíos; no bloquea la consulta.
    }
  }, []);

  const cargarRegistros = useCallback(
    async (filtrosActivos: Filtros, paginaActual: number) => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await bitacoraApi.listar({
          ...filtrosActivos,
          pagina: paginaActual,
          limite: LIMITE,
        });
        setRegistros(respuesta.data);
        setTotal(respuesta.total);
        setPagina(respuesta.pagina);
      } catch {
        setError('No se pudieron cargar los registros de la bitácora.');
      } finally {
        setCargando(false);
      }
    },
    []
  );

  useEffect(() => {
    cargarOpciones();
  }, [cargarOpciones]);

  useEffect(() => {
    cargarRegistros(FILTROS_INICIALES, 1);
  }, [cargarRegistros]);

  function aplicarFiltros() {
    cargarRegistros(filtros, 1);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    cargarRegistros(FILTROS_INICIALES, 1);
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            Bitácora de auditoría
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Registro de todas las acciones realizadas por los usuarios del sistema.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          {/* Filtros */}
          <div className="mb-4 grid grid-cols-12 gap-3">
            <div className="col-span-6 md:col-span-3">
              <select
                value={filtros.usuario_id}
                onChange={(e) => setFiltros({ ...filtros, usuario_id: e.target.value })}
                className={claseInput}
              >
                <option value="">Todos los usuarios</option>
                {opciones.usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6 md:col-span-3">
              <select
                value={filtros.modulo}
                onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
                className={claseInput}
              >
                <option value="">Todos los módulos</option>
                {opciones.modulos.map((modulo) => (
                  <option key={modulo} value={modulo}>
                    {modulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6 md:col-span-3">
              <input
                type="date"
                value={filtros.desde}
                onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
                className={claseInput}
                aria-label="Desde"
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <input
                type="date"
                value={filtros.hasta}
                onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
                className={claseInput}
                aria-label="Hasta"
              />
            </div>
            <div className="col-span-12 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={filtros.q}
                onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') aplicarFiltros();
                }}
                placeholder="Buscar por descripción o acción…"
                className={claseInput}
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={aplicarFiltros}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700"
                >
                  <svg
                    className="fill-current"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.25 5.5C3.25 5.08579 3.58579 4.75 4 4.75H16C16.4142 4.75 16.75 5.08579 16.75 5.5C16.75 5.91421 16.4142 6.25 16 6.25H4C3.58579 6.25 3.25 5.91421 3.25 5.5ZM5.75 12C5.75 11.5858 6.08579 11.25 6.5 11.25H13.5C13.9142 11.25 14.25 11.5858 14.25 12C14.25 12.4142 13.9142 12.75 13.5 12.75H6.5C6.08579 12.75 5.75 12.4142 5.75 12ZM8.25 18C8.25 17.5858 8.58579 17.25 9 17.25H11C11.4142 17.25 11.75 17.5858 11.75 18C11.75 18.4142 11.4142 18.75 11 18.75H9C8.58579 18.75 8.25 18.4142 8.25 18Z"
                      fill=""
                    />
                  </svg>
                  Filtrar
                </button>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="w-full overflow-x-auto">
            {cargando ? (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                Cargando…
              </p>
            ) : registros.length === 0 ? (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                No hay registros para los filtros seleccionados.
              </p>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-y border-gray-100 dark:border-gray-800">
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Fecha y hora
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Usuario
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Módulo
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Acción
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Descripción
                      </p>
                    </th>
                    <th className="py-3 text-right">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        IP
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {registros.map((registro) => (
                    <tr key={registro.id}>
                      <td className="py-3 pr-4">
                        <p className="whitespace-nowrap text-theme-sm text-gray-500 dark:text-gray-400">
                          {formatearFecha(registro.created_at)}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-theme-sm text-gray-800 dark:text-white/90">
                          {registro.usuario_nombre}
                        </p>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                          @{registro.username}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-theme-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                          {registro.modulo}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-theme-xs font-medium ${clasesBadgeAccion(
                            registro.accion
                          )}`}
                        >
                          {registro.accion}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                          {registro.descripcion}
                        </p>
                      </td>
                      <td className="py-3">
                        <p className="whitespace-nowrap text-right text-theme-xs text-gray-500 dark:text-gray-400">
                          {registro.ip || '—'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              {total} registro{total === 1 ? '' : 's'} · Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => cargarRegistros(filtros, pagina - 1)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => cargarRegistros(filtros, pagina + 1)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}