import { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'claro' | 'oscuro';

interface ContextoTema {
  tema: Tema;
  alternarTema: () => void;
}

const TemaContext = createContext<ContextoTema | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = localStorage.getItem('tema');
    if (guardado === 'oscuro' || guardado === 'claro') {
      return guardado;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  });

  useEffect(() => {
    const raiz = document.documentElement;
    if (tema === 'oscuro') {
      raiz.classList.add('dark');
    } else {
      raiz.classList.remove('dark');
    }
    localStorage.setItem('tema', tema);
  }, [tema]);

  function alternarTema() {
    setTema((anterior) => (anterior === 'oscuro' ? 'claro' : 'oscuro'));
  }

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>{children}</TemaContext.Provider>
  );
}

export function useTema(): ContextoTema {
  const contexto = useContext(TemaContext);
  if (!contexto) {
    throw new Error('useTema debe usarse dentro de TemaProvider.');
  }
  return contexto;
}