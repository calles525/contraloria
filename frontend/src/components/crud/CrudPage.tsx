import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from './Modal';
import CrudFormulario from './CrudFormulario';
import { ConfigCrud } from '../../types/crud';
import { listarRecurso } from './useOpciones';
import { confirmarEliminacion, notificarExito, notificarError } from '../../utils/sweetalert';

interface PropsCrudPage {
  config: ConfigCrud;
}

export default function CrudPage({ config }: PropsCrudPage) {
  const [registros, setRegistros] = useState<Record<string, any>[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargandoFormulario, setCargandoFormulario] = useState(false);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Record<string, any> | null>(null);

  const cargarRegistros = useCallback(async () => {
    setCargandoLista(true);
    try {
      const datos = await listarRecurso(config.rutaApi);
      setRegistros(datos);
      setError('');
    } catch {
      setError('No se pudieron cargar los registros.');
    } finally {
      setCargandoLista(false);
    }
  }, [config.rutaApi]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  function abrirNuevo() {
    setError('');
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(registro: Record<string, any>) {
    setError('');
    setEditando(registro);
    setModalAbierto(true);
  }

  async function manejarEnviar(valores: Record<string, unknown>) {
    setCargandoFormulario(true);
    setError('');
    try {
      if (editando) {
        await api.put(`${config.rutaApi}/${editando.id}`, valores);
      } else {
        await api.post(config.rutaApi, valores);
      }
      setModalAbierto(false);
      await cargarRegistros();
      notificarExito('Registro guardado correctamente.');
    } catch (err: any) {
      notificarError(
        err?.response?.data?.message || 'No se pudo guardar el registro. Verifique los datos.'
      );
    } finally {
      setCargandoFormulario(false);
    }
  }

  async function manejarEliminar(id: number) {
    const confirmar = await confirmarEliminacion(
      'Eliminar registro',
      '¿Desea eliminar este registro? Esta acción no se puede deshacer.'
    );
    if (!confirmar) return;

    setError('');
    try {
      await api.delete(`${config.rutaApi}/${id}`);
      await cargarRegistros();
      notificarExito('Registro eliminado.');
    } catch {
      notificarError('No se pudo eliminar el registro. Puede estar en uso por otros datos.');
    }
  }

  const valoresIniciales = (() => {
    const iniciales: Record<string, unknown> = {};
    if (editando) {
      for (const campo of config.campos) {
        if (campo.ocultarAlEditar) continue;
        iniciales[campo.nombre] = editando[campo.nombre] ?? '';
      }
    } else {
      for (const campo of config.campos) {
        iniciales[campo.nombre] = campo.tipo === 'check' ? 1 : '';
      }
    }
    return iniciales;
  })();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            {config.titulo}
          </h1>
          {config.descripcion && (
            <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
              {config.descripcion}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Listado
            </h3>
            <button
              type="button"
              onClick={abrirNuevo}
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
              Crear
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
              {error}
            </div>
          )}

          <div className="w-full overflow-x-auto">
            {cargandoLista ? (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                Cargando…
              </p>
            ) : registros.length === 0 ? (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                No hay registros aún.
              </p>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-y border-gray-100 dark:border-gray-800">
                    {config.columnas.map((columna) => (
                      <th key={columna.clave} className="py-3 text-left">
                        <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          {columna.etiqueta}
                        </p>
                      </th>
                    ))}
                    <th className="py-3 text-right">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Acciones
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {registros.map((registro) => (
                    <tr key={registro.id}>
                      {config.columnas.map((columna) => (
                        <td key={columna.clave} className="py-3">
                          <div className="flex items-center">
                            {columna.render ? (
                              columna.render(registro)
                            ) : (
                              <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                                {String(registro[columna.clave] ?? '—')}
                              </p>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(registro)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                          >
                            <svg
                              className="fill-gray-500 dark:fill-gray-400"
                              width="16"
                              height="16"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M16.3536 1.64645C16.5488 1.45118 16.8054 1.33333 17.0749 1.33333H18.5C19.0523 1.33333 19.5 1.78105 19.5 2.33333V3.75842C19.5 4.02775 19.3821 4.28432 19.1869 4.47956L6.88719 16.7792C6.74363 16.9228 6.56477 17.0259 6.36816 17.0787L2.70711 18C2.42011 18.0681 2.11756 17.9722 1.90556 17.7602C1.69356 17.5482 1.59762 17.2456 1.66571 16.9586L2.58698 13.2976C2.63978 13.1009 2.7429 12.9221 2.88646 12.7785L15.1861 0.478929C15.2224 0.442678 15.2706 0.421879 15.3212 0.421221L16.2629 0.405821L16.3536 1.64645Z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => manejarEliminar(registro.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-error-200 bg-white px-3 py-1.5 text-theme-xs font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500 dark:hover:bg-error-500/15"
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
                                d="M7.5 2.5C7.04441 2.5 6.62323 2.72667 6.38296 3.09708L5.7245 4.125H3.75C3.33579 4.125 3 4.46079 3 4.875C3 5.28921 3.33579 5.625 3.75 5.625H5.25H14.75H16.25C16.6642 5.625 17 5.28921 17 4.875C17 4.46079 16.6642 4.125 16.25 4.125H14.2755L13.617 3.09708C13.3768 2.72667 12.9556 2.5 12.5 2.5H7.5ZM6.25 5.625L6.6875 4.79167C6.74199 4.69556 6.84326 4.625 6.95535 4.625H13.0446C13.1567 4.625 13.258 4.69556 13.3125 4.79167L13.75 5.625H6.25ZM5.5 6.875H14.5V15.875C14.5 16.4273 14.0523 16.875 13.5 16.875H6.5C5.94771 16.875 5.5 16.4273 5.5 15.875V6.875Z"
                                fill=""
                              />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modalAbierto && (
        <Modal
          titulo={editando ? `Editar ${config.titulo}` : `Crear ${config.titulo}`}
          alCerrar={() => setModalAbierto(false)}
        >
          <CrudFormulario
            campos={config.campos}
            valoresIniciales={valoresIniciales}
            alEnviar={manejarEnviar}
            cancelar={() => setModalAbierto(false)}
            cargando={cargandoFormulario}
            editando={Boolean(editando)}
          />
        </Modal>
      )}
    </div>
  );
}