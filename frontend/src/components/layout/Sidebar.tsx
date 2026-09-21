import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSesion } from '../../providers/SesionProvider';

interface PropsSidebar {
  colapsado: boolean;
  movilAbierto: boolean;
  alCerrarMovil: () => void;
}

const itemsConfiguracion = [
  {
    to: '/configuracion/empresas',
    etiqueta: 'Empresas',
    permiso: 'empresas',
    icono: (
      <>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </>
    ),
  },
  {
    to: '/configuracion/estados',
    etiqueta: 'Estados',
    permiso: 'estados',
    icono: (
      <>
        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0Z" />
        <path d="M15 5.764v15" />
        <path d="M9 3.236v15" />
      </>
    ),
  },
  {
    to: '/configuracion/municipios',
    etiqueta: 'Municipios',
    permiso: 'municipios',
    icono: (
      <>
        <path d="M3 22h18" />
        <path d="M4 22V8.764a2 2 0 0 1 1.106-1.789l7-3.5a2 2 0 0 1 1.788 0l7 3.5A2 2 0 0 1 22 8.764V22" />
        <path d="M12 22v-7" />
        <path d="M9 22v-4" />
        <path d="M15 22v-4" />
      </>
    ),
  },
  {
    to: '/configuracion/ciudades',
    etiqueta: 'Ciudades',
    permiso: 'ciudades',
    icono: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    to: '/configuracion/centros-costos',
    etiqueta: 'Centros de costo',
    permiso: 'centros_costo',
    icono: (
      <>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </>
    ),
  },
  {
    to: '/configuracion/departamentos',
    etiqueta: 'Departamentos',
    permiso: 'departamentos',
    icono: (
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    ),
  },
  {
    to: '/configuracion/almacenes',
    etiqueta: 'Almacenes',
    permiso: 'almacenes',
    icono: (
      <>
        <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73Z" />
        <path d="M12 22V12" />
        <path d="m3.3 7 8.7 5 8.7-5" />
      </>
    ),
  },
  {
    to: '/configuracion/personas',
    etiqueta: 'Personas',
    permiso: 'personas',
    icono: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    to: '/configuracion/usuarios',
    etiqueta: 'Usuarios',
    permiso: 'usuarios',
    icono: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    to: '/configuracion/encargados-departamentos',
    etiqueta: 'Encargados de departamentos',
    permiso: 'encargados_departamentos',
    icono: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
  },
  {
    to: '/configuracion/permisos',
    etiqueta: 'Permisos',
    permiso: 'permisos',
    icono: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    to: '/configuracion/bitacora',
    etiqueta: 'Bitácora',
    permiso: 'bitacora',
    icono: (
      <>
        <path d="M15 12h-5" />
        <path d="M15 8h-5" />
        <path d="M19 17V5a2 2 0 0 0-2-2H4" />
        <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
      </>
    ),
  },
];

const itemsSolicitudes = [
  {
    to: '/solicitudes/gestionar',
    etiqueta: 'Creación de solicitudes',
    permiso: 'crear_solicitudes',
    icono: (
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
  },
  {
    to: '/solicitudes/gestion',
    etiqueta: 'Gestión de solicitudes',
    permiso: 'gestionar_solicitudes',
    icono: (
      <>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" />
        <path d="m9 14 2 2 4-4" />
      </>
    ),
  },
];

export default function Sidebar({ colapsado, movilAbierto, alCerrarMovil }: PropsSidebar) {
  const ubicacion = useLocation();
  const { usuario } = useSesion();
  const permisos = usuario?.permisos ?? [];
  const enConfiguracion = ubicacion.pathname.startsWith('/configuracion');
  const enSolicitudes = ubicacion.pathname.startsWith('/solicitudes');
  const [configuracionManual, setConfiguracionManual] = useState(false);
  const [solicitudesManual, setSolicitudesManual] = useState(false);
  const configuracionAbierto = enConfiguracion || configuracionManual || movilAbierto;
  const solicitudesAbierto = enSolicitudes || solicitudesManual || movilAbierto;

  // Solo se muestran los sub-ítems cuyo permiso tiene el usuario autenticado.
  const itemsPermitidos = itemsConfiguracion.filter((item) => !item.permiso || permisos.includes(item.permiso));
  const itemsSolicitudPermitidos = itemsSolicitudes.filter((item) =>
    permisos.includes(item.permiso)
  );

  const clasesSidebar = [
    'sidebar fixed left-0 top-0 z-9999 flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-black lg:static lg:translate-x-0',
    movilAbierto ? 'translate-x-0' : '-translate-x-full',
    colapsado ? 'lg:w-[90px]' : '',
  ].join(' ');

  return (
    <aside className={clasesSidebar}>
      {/* Encabezado del sidebar */}
      <div
        className={`sidebar-header flex items-center gap-2 pt-8 pb-7 ${
          colapsado ? 'lg:justify-center' : 'justify-between'
        }`}
      >
        <NavLink to="/" onClick={alCerrarMovil} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <svg
              className="fill-white"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C11.5858 2 11.25 2.33579 11.25 2.75V12C11.25 12.4142 11.5858 12.75 12 12.75H21.25C21.6642 12.75 22 12.4142 22 12C22 6.47715 17.5228 2 12 2ZM12.75 11.25V3.53263C13.2645 3.57761 13.7659 3.66843 14.25 3.80098C15.6929 4.19606 16.9827 4.96184 18.0104 5.98959C19.0382 7.01734 19.8039 8.30707 20.199 9.75C20.3316 10.2341 20.4224 10.7355 20.4674 11.25H12.75ZM2 12C2 7.25083 5.31065 3.27489 9.75 2.25415V3.80099C6.14748 4.78734 3.5 8.0845 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C15.9155 20.5 19.2127 17.8525 20.199 14.25H21.7459C20.7251 18.6894 16.7492 22 12 22C6.47715 22 2 17.5229 2 12Z"
                fill=""
              />
            </svg>
          </span>
          <span
            className={`text-title-sm font-bold text-gray-800 dark:text-white/90 ${
              colapsado ? 'lg:hidden' : ''
            }`}
          >
            Contraloría
          </span>
        </NavLink>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav>
          {/* Grupo MENU */}
          <div>
            <h3 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
              <span className={colapsado ? 'menu-group-title lg:hidden' : 'menu-group-title'}>
                Menu
              </span>
              <svg
                className={`mx-auto h-6 w-6 fill-current ${
                  colapsado ? 'menu-group-icon hidden lg:block' : 'hidden'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99915 10.2451C6.96564 10.2451 7.74915 11.0286 7.74915 11.9951V12.0051C7.74915 12.9716 6.96564 13.7551 5.99915 13.7551C5.03265 13.7551 4.24915 12.9716 4.24915 12.0051V11.9951C4.24915 11.0286 5.03265 10.2451 5.99915 10.2451ZM17.9991 10.2451C18.9656 10.2451 19.7491 11.0286 19.7491 11.9951V12.0051C19.7491 12.9716 18.9656 13.7551 17.9991 13.7551C17.0326 13.7551 16.2491 12.9716 16.2491 12.0051V11.9951C16.2491 11.0286 17.0326 10.2451 17.9991 10.2451ZM13.7491 11.9951C13.7491 11.0286 12.9656 10.2451 11.9991 10.2451C11.0326 10.2451 10.2491 11.0286 10.2491 11.9951V12.0051C10.2491 12.9716 11.0326 13.7551 11.9991 13.7551C12.9656 13.7551 13.7491 12.9716 13.7491 12.0051V11.9951Z"
                  fill=""
                />
              </svg>
            </h3>

            <ul className="mb-6 flex flex-col gap-1">
              <li>
                <NavLink
                  to="/"
                  end
                  onClick={alCerrarMovil}
                  className={({ isActive }) =>
                    `menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <svg
                        className={isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z"
                          fill=""
                        />
                      </svg>
                      <span
                        className={`menu-item-text ${colapsado ? 'lg:hidden' : ''}`}
                      >
                        Dashboard
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Grupo Configuración (solo si hay al menos un módulo permitido) */}
          {itemsPermitidos.length > 0 && (
          <div>
            <h3 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
              <span className={colapsado ? 'menu-group-title lg:hidden' : 'menu-group-title'}>
                Administración
              </span>
              <svg
                className={`mx-auto h-6 w-6 fill-current ${
                  colapsado ? 'menu-group-icon hidden lg:block' : 'hidden'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99915 10.2451C6.96564 10.2451 7.74915 11.0286 7.74915 11.9951V12.0051C7.74915 12.9716 6.96564 13.7551 5.99915 13.7551C5.03265 13.7551 4.24915 12.9716 4.24915 12.0051V11.9951C4.24915 11.0286 5.03265 10.2451 5.99915 10.2451ZM17.9991 10.2451C18.9656 10.2451 19.7491 11.0286 19.7491 11.9951V12.0051C19.7491 12.9716 18.9656 13.7551 17.9991 13.7551C17.0326 13.7551 16.2491 12.9716 16.2491 12.0051V11.9951C16.2491 11.0286 17.0326 10.2451 17.9991 10.2451ZM13.7491 11.9951C13.7491 11.0286 12.9656 10.2451 11.9991 10.2451C11.0326 10.2451 10.2491 11.0286 10.2491 11.9951V12.0051C10.2491 12.9716 11.0326 13.7551 11.9991 13.7551C12.9656 13.7551 13.7491 12.9716 13.7491 12.0051V11.9951Z"
                  fill=""
                />
              </svg>
            </h3>

            <ul className="mb-6 flex flex-col gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setConfiguracionManual((abierto) => !abierto)}
                  className={`menu-item group w-full ${
                    configuracionAbierto ? 'menu-item-active' : 'menu-item-inactive'
                  }`}
                >
                  <svg
                    className={
                      configuracionAbierto
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z"
                      fill=""
                    />
                  </svg>
                  <span className={`menu-item-text ${colapsado ? 'lg:hidden' : ''}`}>
                    Configuración
                  </span>
                  <svg
                    className={`menu-item-arrow stroke-current ${
                      configuracionAbierto
                        ? 'menu-item-arrow-active'
                        : 'menu-item-arrow-inactive'
                    } ${colapsado ? 'lg:hidden' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 7.39584L10.0001 12.6042L15.2084 7.39585"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className={configuracionAbierto ? 'block' : 'hidden'}>
                  <ul
                    className={`menu-dropdown mt-2 flex flex-col gap-1 pl-9 ${
                      colapsado ? 'lg:hidden' : ''
                    }`}
                  >
                    {itemsPermitidos.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={alCerrarMovil}
                          className={({ isActive }) =>
                            `menu-dropdown-item group ${
                              isActive
                                ? 'menu-dropdown-item-active'
                                : 'menu-dropdown-item-inactive'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <svg
                                className={
                                  isActive
                                    ? 'stroke-brand-500 dark:stroke-brand-400'
                                    : 'stroke-gray-500 group-hover:stroke-gray-700 dark:stroke-gray-400 dark:group-hover:stroke-gray-300'
                                }
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                {item.icono}
                              </svg>
                              {item.etiqueta}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </div>
          )}
          {/* Grupo Solicitud (solo si hay al menos un módulo permitido) */}
          {itemsSolicitudPermitidos.length > 0 && (
          <div>
            <h3 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
              <span className={colapsado ? 'menu-group-title lg:hidden' : 'menu-group-title'}>
                Solicitud
              </span>
              <svg
                className={`mx-auto h-6 w-6 fill-current ${
                  colapsado ? 'menu-group-icon hidden lg:block' : 'hidden'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99915 10.2451C6.96564 10.2451 7.74915 11.0286 7.74915 11.9951V12.0051C7.74915 12.9716 6.96564 13.7551 5.99915 13.7551C5.03265 13.7551 4.24915 12.9716 4.24915 12.0051V11.9951C4.24915 11.0286 5.03265 10.2451 5.99915 10.2451ZM17.9991 10.2451C18.9656 10.2451 19.7491 11.0286 19.7491 11.9951V12.0051C19.7491 12.9716 18.9656 13.7551 17.9991 13.7551C17.0326 13.7551 16.2491 12.9716 16.2491 12.0051V11.9951C16.2491 11.0286 17.0326 10.2451 17.9991 10.2451ZM13.7491 11.9951C13.7491 11.0286 12.9656 10.2451 11.9991 10.2451C11.0326 10.2451 10.2491 11.0286 10.2491 11.9951V12.0051C10.2491 12.9716 11.0326 13.7551 11.9991 13.7551C12.9656 13.7551 13.7491 12.9716 13.7491 12.0051V11.9951Z"
                  fill=""
                />
              </svg>
            </h3>

            <ul className="mb-6 flex flex-col gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSolicitudesManual((abierto) => !abierto)}
                  className={`menu-item group w-full ${
                    solicitudesAbierto ? 'menu-item-active' : 'menu-item-inactive'
                  }`}
                >
                  <svg
                    className={
                      solicitudesAbierto
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M14 2.5H6.5C5.11929 2.5 4 3.61929 4 5V19C4 20.3807 5.11929 21.5 6.5 21.5H17.5C18.8807 21.5 20 20.3807 20 19V8L14 2.5ZM14 4.5L18 8.5H14V4.5Z"
                      fill=""
                    />
                  </svg>
                  <span className={`menu-item-text ${colapsado ? 'lg:hidden' : ''}`}>
                    Solicitud
                  </span>
                  <svg
                    className={`menu-item-arrow stroke-current ${
                      solicitudesAbierto
                        ? 'menu-item-arrow-active'
                        : 'menu-item-arrow-inactive'
                    } ${colapsado ? 'lg:hidden' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 7.39584L10.0001 12.6042L15.2084 7.39585"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className={solicitudesAbierto ? 'block' : 'hidden'}>
                  <ul
                    className={`menu-dropdown mt-2 flex flex-col gap-1 pl-9 ${
                      colapsado ? 'lg:hidden' : ''
                    }`}
                  >
                    {itemsSolicitudPermitidos.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={alCerrarMovil}
                          className={({ isActive }) =>
                            `menu-dropdown-item group ${
                              isActive
                                ? 'menu-dropdown-item-active'
                                : 'menu-dropdown-item-inactive'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <svg
                                className={
                                  isActive
                                    ? 'stroke-brand-500 dark:stroke-brand-400'
                                    : 'stroke-gray-500 group-hover:stroke-gray-700 dark:stroke-gray-400 dark:group-hover:stroke-gray-300'
                                }
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                {item.icono}
                              </svg>
                              {item.etiqueta}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </div>
          )}

          {/* Grupo Notificaciones (visible para todos los usuarios) */}
          <div>
            <h3 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
              <span className={colapsado ? 'menu-group-title lg:hidden' : 'menu-group-title'}>
                Notificaciones
              </span>
              <svg
                className={`mx-auto h-6 w-6 fill-current ${
                  colapsado ? 'menu-group-icon hidden lg:block' : 'hidden'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99915 10.2451C6.96564 10.2451 7.74915 11.0286 7.74915 11.9951V12.0051C7.74915 12.9716 6.96564 13.7551 5.99915 13.7551C5.03265 13.7551 4.24915 12.9716 4.24915 12.0051V11.9951C4.24915 11.0286 5.03265 10.2451 5.99915 10.2451ZM17.9991 10.2451C18.9656 10.2451 19.7491 11.0286 19.7491 11.9951V12.0051C19.7491 12.9716 18.9656 13.7551 17.9991 13.7551C17.0326 13.7551 16.2491 12.9716 16.2491 12.0051V11.9951C16.2491 11.0286 17.0326 10.2451 17.9991 10.2451ZM13.7491 11.9951C13.7491 11.0286 12.9656 10.2451 11.9991 10.2451C11.0326 10.2451 10.2491 11.0286 10.2491 11.9951V12.0051C10.2491 12.9716 11.0326 13.7551 11.9991 13.7551C12.9656 13.7551 13.7491 12.9716 13.7491 12.0051V11.9951Z"
                  fill=""
                />
              </svg>
            </h3>

            <ul className="mb-6 flex flex-col gap-1">
              <li>
                <NavLink
                  to="/configuracion/notificaciones"
                  onClick={alCerrarMovil}
                  className={({ isActive }) =>
                    `menu-item group ${isActive ? 'menu-item-active' : 'menu-item-inactive'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <svg
                        className={
                          isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                        }
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                      <span className={`menu-item-text ${colapsado ? 'lg:hidden' : ''}`}>
                        Configuración de Evolution
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
}