import { ReactNode } from 'react';

interface PropsModal {
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
  /** Ancho del modal: 'md' (por defecto), 'lg', 'xl' o 'full' (pantalla completa). */
  ancho?: 'md' | 'lg' | 'xl' | 'full';
}

export default function Modal({ titulo, alCerrar, children, ancho = 'md' }: PropsModal) {
  const claseAncho =
    ancho === 'full'
      ? 'w-full max-w-[calc(100vw-2rem)]'
      : ancho === 'xl'
        ? 'w-full max-w-[calc(100vw-2rem)] lg:max-w-6xl'
        : ancho === 'lg'
          ? 'w-full max-w-[calc(100vw-2rem)] md:max-w-4xl'
          : 'w-full max-w-[calc(100vw-2rem)] md:max-w-2xl';

  return (
    // m-auto en el panel + overlay scrollable: si el contenido es más alto que la
    // pantalla, el scroll llega al tope del modal (título y tabs siempre visibles).
    <div className="fixed inset-0 z-99999 flex overflow-y-auto bg-gray-900/60 p-4">
      <div
        className={`${claseAncho} m-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xl dark:border-gray-800 dark:bg-gray-900 md:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {titulo}
          </h3>
          <button
            type="button"
            onClick={alCerrar}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}