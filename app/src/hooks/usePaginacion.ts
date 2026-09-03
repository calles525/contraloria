// Hook de paginación reutilizable.
import { useMemo, useState } from 'react';

interface ResultadoPaginacion<T> {
  pagina: number;
  tamanoPagina: number;
  total: number;
  totalPages: number;
  inicio: number;
  fin: number;
  datos: T[];
  cambiarPagina: (p: number) => void;
  cambiarTamano: (n: number) => void;
  reiniciar: () => void;
}

export function usePaginacion<T>(items: T[], tamanoPorDefecto = 10): ResultadoPaginacion<T> {
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(tamanoPorDefecto);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / tamanoPagina));
  const paginaSegura = Math.min(pagina, totalPages);

  const { inicio, fin, datos } = useMemo(() => {
    const inicioCalc = (paginaSegura - 1) * tamanoPagina;
    const finCalc = Math.min(inicioCalc + tamanoPagina, total);
    return { inicio: inicioCalc, fin: finCalc, datos: items.slice(inicioCalc, finCalc) };
  }, [items, paginaSegura, tamanoPagina, total]);

  const cambiarPagina = (p: number) => setPagina(Math.max(1, Math.min(p, totalPages)));
  const cambiarTamano = (n: number) => {
    setTamanoPagina(n);
    setPagina(1);
  };
  const reiniciar = () => setPagina(1);

  return { pagina: paginaSegura, tamanoPagina, total, totalPages, inicio, fin, datos, cambiarPagina, cambiarTamano, reiniciar };
}
