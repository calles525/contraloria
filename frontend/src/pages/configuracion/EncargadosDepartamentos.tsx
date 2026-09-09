import { useCallback, useEffect, useState } from 'react';
import { departamentosApi, personasApi } from '../../services/maestros';
import { Departamento } from '../../types/maestros';
import { OpcionSelect } from '../../types/maestros';

const claseSelect =
  'w-full min-w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90';

export default function EncargadosDepartamentos() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [personas, setPersonas] = useState<OpcionSelect[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});
  const [cambios, setCambios] = useState<Record<number, string>>({});

  /** Elimina el mensaje (de éxito o error) asociado a un departamento. */
  function limpiarMensaje(departamentoId: number) {
    setMensajes((actual) => {
      const copia = { ...actual };
      delete copia[String(departamentoId)];
      return copia;
    });
  }

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [departamentosData, personasData] = await Promise.all([
        departamentosApi.listar(),
        personasApi.opciones(),
      ]);
      setDepartamentos(departamentosData);
      setPersonas(personasData);
    } catch {
      setMensajes({ global: 'No se pudieron cargar los datos.' });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  function seleccionar(departamentoId: number, valor: string) {
    setCambios((actual) => ({ ...actual, [departamentoId]: valor }));
    limpiarMensaje(departamentoId);
  }

  async function guardar(departamento: Departamento) {
    const personaId = cambios[departamento.id];
    if (personaId === undefined) return;

    setGuardandoId(departamento.id);
    limpiarMensaje(departamento.id);

    try {
      const encargado = personaId === '' ? null : Number(personaId);
      await departamentosApi.actualizar(departamento.id, { manager_person_id: encargado });
      await cargarDatos();
      setCambios((actual) => {
        const { [departamento.id]: _, ...resto } = actual;
        return resto;
      });
      setMensajes((actual) => ({
        ...actual,
        [departamento.id]: 'Encargado guardado.',
      }));
    } catch (err: any) {
      setMensajes((actual) => ({
        ...actual,
        [departamento.id]: err?.response?.data?.message || 'No se pudo guardar el encargado.',
      }));
    } finally {
      setGuardandoId(null);
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            Encargados de departamentos
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Asigne la persona encargada de cada departamento. Use «Sin asignar» para desasignar.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="mb-4">
            <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Asignación
            </h3>
          </div>

          {mensajes.global && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
              {mensajes.global}
            </div>
          )}

          <div className="w-full overflow-x-auto">
            {cargando ? (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                Cargando…
              </p>
            ) : departamentos.length === 0 ? (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                No hay departamentos registrados.
              </p>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-y border-gray-100 dark:border-gray-800">
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Departamento
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Empresa
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Encargado actual
                      </p>
                    </th>
                    <th className="py-3 text-left">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Nuevo encargado
                      </p>
                    </th>
                    <th className="py-3 text-right">
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Acción
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {departamentos.map((departamento) => (
                    <tr key={departamento.id}>
                      <td className="py-3">
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {departamento.name}
                        </p>
                        {departamento.cost_center_name && (
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                            {departamento.cost_center_name}
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                          {departamento.company_name}
                        </p>
                      </td>
                      <td className="py-3">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                          {departamento.manager_name || 'Sin asignar'}
                        </p>
                      </td>
                      <td className="py-3">
                        <select
                          value={
                            cambios[departamento.id] ??
                            (departamento.manager_person_id
                              ? String(departamento.manager_person_id)
                              : '')
                          }
                          onChange={(e) => seleccionar(departamento.id, e.target.value)}
                          className={claseSelect}
                        >
                          <option value="">Sin asignar</option>
                          {personas.map((persona) => (
                            <option key={persona.value} value={persona.value}>
                              {persona.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            disabled={cambios[departamento.id] === undefined || guardandoId !== null}
                            onClick={() => guardar(departamento)}
                            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-theme-xs font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-50"
                          >
                            {guardandoId === departamento.id ? 'Guardando…' : 'Guardar'}
                          </button>
                          {mensajes[departamento.id] && (
                            <p className="text-theme-xs text-success-600 dark:text-success-500">
                              {mensajes[departamento.id]}
                            </p>
                          )}
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
    </div>
  );
}