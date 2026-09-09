import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerToken, obtenerUsuarioActual, cerrarSesion, Usuario } from '../services/auth';

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  salir: () => void;
}

const SesionContext = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!obtenerToken()) {
      setCargando(false);
      return;
    }

    obtenerUsuarioActual()
      .then(setUsuario)
      .catch(() => {
        cerrarSesion();
        navigate('/login');
      })
      .finally(() => setCargando(false));
  }, [navigate]);

  function salir() {
    cerrarSesion();
    setUsuario(null);
    navigate('/login');
  }

  return (
    <SesionContext.Provider value={{ usuario, cargando, salir }}>
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