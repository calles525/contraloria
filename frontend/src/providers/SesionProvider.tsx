import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerToken, obtenerUsuarioActual, cerrarSesion, guardarToken, Usuario } from '../services/auth';

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  salir: () => void;
  iniciarSesion: (token: string) => void;
}

const SesionContext = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [token, setToken] = useState<string | null>(() => obtenerToken());
  const navigate = useNavigate();

  // Se revalida la sesión cada vez que cambia el token (montaje, login o salida).
  useEffect(() => {
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    obtenerUsuarioActual()
      .then(setUsuario)
      .catch(() => {
        cerrarSesion();
        setToken(null);
        navigate('/login');
      })
      .finally(() => setCargando(false));
  }, [token, navigate]);

  // Guarda el token y dispara la validación inmediata de la sesión.
  // Se marca "cargando" de forma síncrona porque, si no, la ruta protegida se
  // evalúa antes de validar la sesión, ve que no hay usuario y devuelve al
  // login: obliga a pulsar "Ingresar" una segunda vez.
  function iniciarSesion(nuevoToken: string) {
    guardarToken(nuevoToken);
    setCargando(true);
    setToken(nuevoToken);
  }

  function salir() {
    cerrarSesion();
    setToken(null);
    setUsuario(null);
    navigate('/login');
  }

  return (
    <SesionContext.Provider value={{ usuario, cargando, salir, iniciarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de SesionProvider.');
  }
  return contexto;
}