import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/layout/AppLayout';
import { SesionProvider, useSesion } from './providers/SesionProvider';

import Empresas from './pages/configuracion/Empresas';
import Estados from './pages/configuracion/Estados';
import Municipios from './pages/configuracion/Municipios';
import Ciudades from './pages/configuracion/Ciudades';
import CentrosDeCosto from './pages/configuracion/CentrosDeCosto';
import Departamentos from './pages/configuracion/Departamentos';
import Personas from './pages/configuracion/Personas';
import Usuarios from './pages/configuracion/Usuarios';
import Almacenes from './pages/configuracion/Almacenes';
import EncargadosDepartamentos from './pages/configuracion/EncargadosDepartamentos';
import Permisos from './pages/configuracion/Permisos';
import Bitacora from './pages/configuracion/Bitacora';
import Notificaciones from './pages/configuracion/Notificaciones';
import GestionarSolicitudes from './pages/solicitudes/GestionarSolicitudes';
import GestionSolicitudes from './pages/solicitudes/GestionSolicitudes';

function RutaProtegida({ children }: { children: JSX.Element }) {
  const { cargando, usuario } = useSesion();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      </div>
    );
  }

  return usuario ? children : <Navigate to="/login" replace />;
}

/** Restringe una ruta a usuarios que tengan el permiso indicado. */
function RequierePermiso({ permiso, children }: { permiso: string; children: JSX.Element }) {
  const { usuario } = useSesion();
  const permisos = usuario?.permisos ?? [];

  if (permisos.includes(permiso)) {
    return children;
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="configuracion/empresas" element={<Empresas />} />
            <Route path="configuracion/estados" element={<Estados />} />
            <Route path="configuracion/municipios" element={<Municipios />} />
            <Route path="configuracion/ciudades" element={<Ciudades />} />
            <Route path="configuracion/centros-costos" element={<CentrosDeCosto />} />
            <Route path="configuracion/departamentos" element={<Departamentos />} />
            <Route path="configuracion/almacenes" element={<Almacenes />} />
            <Route path="configuracion/encargados-departamentos" element={<EncargadosDepartamentos />} />
            <Route path="configuracion/permisos" element={<Permisos />} />
            <Route
              path="configuracion/bitacora"
              element={
                <RequierePermiso permiso="bitacora">
                  <Bitacora />
                </RequierePermiso>
              }
            />
            <Route path="configuracion/personas" element={<Personas />} />
            <Route path="configuracion/usuarios" element={<Usuarios />} />
            <Route path="configuracion/notificaciones" element={<Notificaciones />} />
            <Route
              path="solicitudes/gestionar"
              element={
                <RequierePermiso permiso="crear_solicitudes">
                  <GestionarSolicitudes />
                </RequierePermiso>
              }
            />
            <Route
              path="solicitudes/gestion"
              element={
                <RequierePermiso permiso="gestionar_solicitudes">
                  <GestionSolicitudes />
                </RequierePermiso>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}