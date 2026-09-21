import { useEffect, useMemo, useRef, useState } from 'react';

/** Opción de campo mostrada en el buscador y en los chips. */
export interface OpcionCampo {
  valor: string;
  etiqueta: string;
  /** Valor actual del campo en la solicitud (para ayudar a identificar el dato). */
  valorActual?: string;
}

interface Props {
  opciones: OpcionCampo[];
  seleccionados: string[];
  onChange: (valores: string[]) => void;
  placeholder?: string;
  /** Texto que se muestra cuando no quedan campos por seleccionar. */
  sinResultados?: string;
}

const claseChip =
  'inline-flex items-center gap-1.5 rounded-full border border-error-200 bg-error-50 py-1 pl-2.5 pr-1.5 text-theme-xs font-medium text-error-600 dark:border-error-500/25 dark:bg-error-500/15 dark:text-error-500';

const claseBotonQuitar =
  'flex h-4 w-4 items-center justify-center rounded-full bg-error-100 text-error-600 transition-colors hover:bg-error-200 dark:bg-error-500/25 dark:text-error-500 dark:hover:bg-error-500/35';

/** Select con buscador que agrega campos de la solicitud como chips (campos erróneos). */
export default function SelectorCamposErroneos({
  opciones,
  seleccionados,
  onChange,
  placeholder = 'Buscar campo de la solicitud…',
  sinResultados = 'Sin resultados.',
}: Props) {
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  const disponibles = useMemo(() => {
    const texto = textoBusqueda.trim().toLowerCase();
    return opciones.filter(
      (opcion) =>
        !seleccionados.includes(opcion.valor) &&
        (!texto ||
          opcion.etiqueta.toLowerCase().includes(texto) ||
          opcion.valor.toLowerCase().includes(texto))
    );
  }, [opciones, seleccionados, textoBusqueda]);

  // Cierra el desplegable al hacer clic fuera.
  useEffect(() => {
    function alClicFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  function agregar(opcion: OpcionCampo) {
    if (seleccionados.includes(opcion.valor)) return;
    onChange([...seleccionados, opcion.valor]);
    setTextoBusqueda('');
    setAbierto(true);
  }

  function quitar(valor: string) {
    onChange(seleccionados.filter((seleccionado) => seleccionado !== valor));
  }

  return (
    <div ref={contenedorRef} className="relative">
      {/* Chips + input de búsqueda */}
      <div
        className={`flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-2 transition-colors ${
          abierto
            ? 'border-brand-500 ring-1 ring-brand-500'
            : 'border-gray-300 dark:border-gray-700'
        } dark:bg-gray-800`}
      >
        {seleccionados.map((valor) => {
          const opcion = opciones.find((item) => item.valor === valor);
          if (!opcion) return null;
          return (
            <span key={valor} className={claseChip}>
              {opcion.etiqueta}
              <button
                type="button"
                onClick={() => quitar(valor)}
                className={claseBotonQuitar}
                aria-label={`Quitar ${opcion.etiqueta}`}
              >
                <svg
                  className="fill-current"
                  width="8"
                  height="8"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 8.58579L16.2929 2.29289C16.6834 1.90237 17.3166 1.90237 17.7071 2.29289C18.0976 2.68342 18.0976 3.31658 17.7071 3.70711L11.4142 10L17.7071 16.2929C18.0976 16.6834 18.0976 17.3166 17.7071 17.7071C17.3166 18.0976 16.6834 18.0976 16.2929 17.7071L10 11.4142L3.70711 17.7071C3.31658 18.0976 2.68342 18.0976 2.29289 17.7071C1.90237 17.3166 1.90237 16.6834 2.29289 16.2929L8.58579 10L2.29289 3.70711C1.90237 3.31658 1.90237 2.68342 2.29289 2.29289C2.68342 1.90237 3.31658 1.90237 3.70711 2.29289L10 8.58579Z" />
                </svg>
              </button>
            </span>
          );
        })}
        <input
          value={textoBusqueda}
          onChange={(e) => {
            setTextoBusqueda(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder={seleccionados.length === 0 ? placeholder : ''}
          className="min-w-[140px] flex-1 border-none bg-transparent px-1 py-0.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none dark:text-white/90 dark:placeholder-white/30"
        />
      </div>

      {/* Desplegable con los campos disponibles */}
      {abierto && (
        <div className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
          {disponibles.length === 0 ? (
            <p className="px-3 py-2.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {seleccionados.length === opciones.length && opciones.length > 0
                ? 'Ya seleccionó todos los campos.'
                : sinResultados}
            </p>
          ) : (
            disponibles.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => agregar(opcion)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              >
                <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  {opcion.etiqueta}
                </span>
                {opcion.valorActual && (
                  <span className="max-w-[45%] truncate text-theme-xs text-gray-400 dark:text-gray-500">
                    {opcion.valorActual}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}