import { useEffect, useState } from 'react';
import { CampoFormulario } from '../../types/crud';
import { OpcionSelect } from '../../types/maestros';
import { useOpciones } from './useOpciones';

interface PropsCrudFormulario {
  campos: CampoFormulario[];
  valoresIniciales: Record<string, unknown>;
  alEnviar: (valores: Record<string, unknown>) => void;
  cancelar: () => void;
  cargando: boolean;
  editando: boolean;
}

const claseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-white/30';

export default function CrudFormulario({
  campos,
  valoresIniciales,
  alEnviar,
  cancelar,
  cargando,
  editando,
}: PropsCrudFormulario) {
  const [valores, setValores] = useState<Record<string, unknown>>(valoresIniciales);
  const [error, setError] = useState('');
  const { opcionesDe, recargarDependientes, cargandoClaves } = useOpciones(campos);

  useEffect(() => {
    setValores(valoresIniciales);
  }, [valoresIniciales]);

  async function manejarCampo(nombre: string, valor: unknown) {
    setValores((actual) => ({ ...actual, [nombre]: valor }));
    await recargarDependientes(nombre, { ...valores, [nombre]: valor });
  }

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();

    const invalidos = campos.filter(
      (campo) =>
        campo.requerido &&
        !(campo.requeridoSoloCrear && editando) &&
        (valores[campo.nombre] === undefined ||
          valores[campo.nombre] === null ||
          valores[campo.nombre] === '')
    );

    if (invalidos.length > 0) {
      const nombres = invalidos.map((c) => c.etiqueta).join(', ');
      setError(`Campos obligatorios: ${nombres}.`);
      return;
    }

    const enviar = valores as Record<string, unknown>;
    alEnviar(enviar);
  }

  function renderCampo(campo: CampoFormulario) {
    const valor = valores[campo.nombre] ?? '';
    const opciones: OpcionSelect[] = opcionesDe(campo);

    switch (campo.tipo) {
      case 'area':
        return (
          <textarea
            value={valor as string}
            onChange={(e) => manejarCampo(campo.nombre, e.target.value)}
            placeholder={campo.placeholder}
            rows={3}
            className={`${claseInput} resize-none`}
          />
        );
      case 'numero':
        return (
          <input
            type="number"
            value={valor as number | string}
            onChange={(e) => manejarCampo(campo.nombre, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={campo.placeholder}
            className={claseInput}
          />
        );
      case 'fecha':
        return (
          <input
            type="date"
            value={valor as string}
            onChange={(e) => manejarCampo(campo.nombre, e.target.value)}
            className={claseInput}
          />
        );
      case 'select':
        return (
          <select
            value={valor as string}
            onChange={(e) => manejarCampo(campo.nombre, e.target.value)}
            className={claseInput}
          >
            <option value="">{campo.placeholder || 'Seleccione una opción'}</option>
            {opciones.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
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
              onChange={(e) => manejarCampo(campo.nombre, e.target.checked ? 1 : 0)}
              className="h-4 w-4 rounded border-gray-300 accent-brand-500"
            />
            <span className="text-theme-sm text-gray-700 dark:text-gray-400">
              Activo
            </span>
          </label>
        );
      case 'password':
        return (
          <input
            type="password"
            value={valor as string}
            onChange={(e) => manejarCampo(campo.nombre, e.target.value)}
            placeholder={campo.placeholder || '••••••••'}
            className={claseInput}
          />
        );
      default:
        return (
          <input
            type={campo.tipo === 'email' ? 'email' : 'text'}
            value={valor as string}
            onChange={(e) => manejarCampo(campo.nombre, e.target.value)}
            placeholder={campo.placeholder}
            className={claseInput}
          />
        );
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="flex flex-col">
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <div
            key={campo.nombre}
            className={campo.spanCompleto ? 'sm:col-span-2' : ''}
          >
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              {campo.etiqueta}
              {campo.requerido && !(campo.requeridoSoloCrear && editando) && (
                <span className="text-error-500"> *</span>
              )}
              {!campo.requerido && <span className="text-gray-400"> (opcional)</span>}
              {campo.requeridoSoloCrear && editando && (
                <span className="text-gray-400"> (opcional al editar)</span>
              )}
            </label>
            {renderCampo(campo)}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={cancelar}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando || cargandoClaves.length > 0}
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-60"
        >
          {cargando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}