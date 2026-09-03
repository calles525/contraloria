// Proveedor de tema (claro / oscuro) con persistencia en localStorage.
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { THEME_KEY } from '../lib/store';

type ModoTema = 'light' | 'dark';

interface ThemeContextValue {
  modo: ModoTema;
  alternar: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

function leerModoInicial(): ModoTema {
  try {
    const guardado = localStorage.getItem(THEME_KEY);
    if (guardado === 'dark' || guardado === 'light') return guardado;
  } catch {
    // Ignorar
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoTema>(leerModoInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modo === 'dark');
    try {
      localStorage.setItem(THEME_KEY, modo);
    } catch {
      // Ignorar
    }
  }, [modo]);

  const alternar = () => setModo((m) => (m === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ modo, alternar }}>{children}</ThemeContext.Provider>;
}
