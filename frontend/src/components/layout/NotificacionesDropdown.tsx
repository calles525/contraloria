import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificacionesApi, Notificacion } from '../../services/notificaciones';

interface IconoNotificacion {
  clase: string;
  svg: React.ReactNode;
}

function iconoPorTipo(tipo: string): IconoNotificacion {
  switch (tipo) {
    case 'solicitud_creada':
      return {
        clase: 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400',
        svg: (
          <>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M12 9v6" />
            <path d="M9 12h6" />
          </>
        ),
      };
    case 'solicitud_estado':
      return {
        clase: 'bg-warning-50 text-warning-600 dark:bg-warning-500/[0.12] dark:text-warning-400',
        svg: (
          <>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </>
        ),
      };
    case 'solicitud_archivo':
      return {
        clase: 'bg-success-50 text-success-600 dark:bg-success-500/[0.12] dark:text-success-400',
        svg: (
          <>
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </>
        ),
      };
    default:
      return {
        clase: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300',
        svg: (
          <>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </>
        ),
      };
  }
}

function tiempoRelativo(fecha: string): string {
  const momento = new Date(fecha.replace(' ', 'T')).getTime();
  const minutos = Math.floor((Date.now() - momento) / 60000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
}

export default function NotificacionesDropdown() {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Refresca el total de no leídas de forma periódica para el badge.
  useEffect(() => {
    let activo = true;

    const refrescarBadge = () => {
      notificacionesApi
        .contarNoLeidas()
        .then((total) => {
          if (activo) setNoLeidas(total);
        })
        .catch(() => {});
    };

    refrescarBadge();
    const intervalo = window.setInterval(refrescarBadge, 60000);

    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  // Al abrir el panel se cargan las notificaciones y se marcan como leídas.
  useEffect(() => {
    if (!abierto) return;

    setCargando(true);
    notificacionesApi
      .listar(8)
      .then((respuesta) => {
        setNotificaciones(respuesta.data);
        if (respuesta.noLeidas > 0) {
          setNoLeidas(respuesta.noLeidas);
          notificacionesApi.marcarTodasLeidas().then(() => setNoLeidas(0)).catch(() => {});
        }
      })
      .catch(() => setNotificaciones([]))
      .finally(() => setCargando(false));
  }, [abierto]);

  // Cierra el panel al hacer clic fuera de él.
  useEffect(() => {
    function alClicFuera(event: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((estado) => !estado)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notificaciones"
      >
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2.75C8.54822 2.75 5.75 5.54822 5.75 9V14.5302L4.1187 17.2074C3.92559 17.5167 4.01546 17.9231 4.32486 18.1162C4.43294 18.1839 4.55804 18.2209 4.68562 18.2222H19.3144C19.442 18.2209 19.5671 18.1839 19.6751 18.1162C19.9845 17.9231 20.0744 17.5167 19.8813 17.2074L18.25 14.5302V9C18.25 5.54822 15.4518 2.75 12 2.75ZM12 21.5C10.7578 21.5 9.74283 20.557 9.625 19.3407H14.375C14.2572 20.557 13.2422 21.5 12 21.5Z"
            fill=""
          />
        </svg>

        {noLeidas > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-theme-xs font-semibold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-10 mt-[17px] w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Notificaciones
            </h3>
            <button
              type="button"
              onClick={() => notificacionesApi.marcarTodasLeidas().catch(() => {})}
              className="text-theme-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Marcar todas como leídas
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {cargando ? (
              <p className="px-4 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                Cargando…
              </p>
            ) : notificaciones.length === 0 ? (
              <p className="px-4 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                No hay notificaciones.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {notificaciones.map((notificacion) => {
                  const icono = iconoPorTipo(notificacion.tipo);
                  return (
                    <li key={notificacion.id} className="flex gap-3 px-4 py-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${icono.clase}`}
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          {icono.svg}
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {notificacion.titulo}
                        </p>
                        <p className="mt-0.5 text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">
                          {notificacion.mensaje}
                        </p>
                        <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                          {tiempoRelativo(notificacion.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <Link
              to="/configuracion/bitacora"
              onClick={() => setAbierto(false)}
              className="text-theme-sm block text-center font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Ver bitácora de actividad
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}