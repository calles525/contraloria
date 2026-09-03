// Enrutador principal con carga diferida y guardas por rol.
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LayoutComponent } from './components/LayoutComponent';
import { useApp } from './providers/AppProvider';
import { MENU_POR_ROL } from './lib/navigation';
import { Spinner } from './components/Abstracciones';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NuevaSolicitud = lazy(() => import('./pages/NuevaSolicitud'));
const MisSolicitudes = lazy(() => import('./pages/MisSolicitudes'));
const Recibidas = lazy(() => import('./pages/Recibidas'));
const Contraloria = lazy(() => import('./pages/Contraloria'));
const Detalle = lazy(() => import('./pages/Detalle'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Departamentos = lazy(() => import('./pages/Departamentos'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Reportes = lazy(() => import('./pages/Reportes'));

function RutaProtegida({ itemId, children }: { itemId: string; children: React.ReactNode }) {
  const { usuario } = useApp();
  if (!usuario) return <Navigate to="/login" replace />;
  const permitidas = MENU_POR_ROL[usuario.rol] ?? [];
  if (!permitidas.includes(itemId)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function App() {
  const { usuario } = useApp();
  const ubicacion = useLocation();

  return (
    <Suspense fallback={<Spinner etiqueta="Cargando mÃ³dulo..." />}>
      <Routes>
        <Route
          path="/login"
          element={usuario ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          element={
            usuario ? (
              <LayoutComponent />
            ) : (
              <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
            )
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nueva" element={<NuevaSolicitud />} />
          <Route path="/mis-solicitudes" element={<MisSolicitudes />} />
          <Route
            path="/recibidas"
            element={
<RutaProtegida itemId="recibidas">
                <Recibidas />
              </RutaProtegida>
            }
          />
          <Route
            path="/contraloria"
            element={
              <RutaProtegida itemId="contraloria">
                <Contraloria />
              </RutaProtegida>
            }
          />
          <Route path="/reportes" element={<RutaProtegida itemId="reportes"><Reportes /></RutaProtegida>} />
          <Route path="/usuarios" element={<RutaProtegida itemId="usuarios"><Usuarios /></RutaProtegida>} />
          <Route path="/departamentos" element={<RutaProtegida itemId="departamentos"><Departamentos /></RutaProtegida>} />
          <Route path="/detalle/:id" element={<Detalle />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

