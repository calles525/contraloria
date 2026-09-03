// Proveedor de autenticación y datos de la aplicación.
// Expone al usuario actual, operaciones de login/logout y acceso al store.
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { store } from '../lib/store';
import type { Usuario } from '../lib/types';

interface AppContextValue {
  usuario: Usuario | null;
  login: (email: string, password: string) => Usuario | null;
  logout: () => void;
  recargarDatos: () => void;
  version: number;
}

const AppContext = createContext<AppContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => store.getUsuarioActual());
  const [version, setVersion] = useState(0);

  const login = useCallback((email: string, password: string): Usuario | null => {
    const u = store.login(email, password);
    setUsuario(u);
    setVersion((v) => v + 1);
    return u;
  }, []);

  const logout = useCallback(() => {
    store.logout();
    setUsuario(null);
    setVersion((v) => v + 1);
  }, []);

  const recargarDatos = useCallback(() => {
    setUsuario(store.getUsuarioActual());
    setVersion((v) => v + 1);
  }, []);

  return (
    <AppContext.Provider value={{ usuario, login, logout, recargarDatos, version }}>
      {children}
    </AppContext.Provider>
  );
}
