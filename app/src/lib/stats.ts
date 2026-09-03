// Agregaciones estadísticas sobre solicitudes.
import type { Solicitud } from './types';

export function porEstado(lista: Solicitud[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of lista) map[s.estado] = (map[s.estado] ?? 0) + 1;
  return map;
}

export function porDepartamento(lista: Solicitud[]): Array<[string, number]> {
  const map: Record<string, number> = {};
  for (const s of lista) {
    const nombre = s.departamentoOrigenNombre || '—';
    map[nombre] = (map[nombre] ?? 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

export function porPrioridad(lista: Solicitud[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of lista) map[s.prioridad] = (map[s.prioridad] ?? 0) + 1;
  return map;
}

export function porTipo(lista: Solicitud[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of lista) map[s.tipo] = (map[s.tipo] ?? 0) + 1;
  return map;
}

export function tiempoPromedioDias(lista: Solicitud[]): number {
  const finalizadas = lista.filter(
    (s) => s.fechaCreacion && (s.estado === 'aprobado' || s.estado === 'rechazado') && s.fechaFinalizacion,
  );
  if (!finalizadas.length) return 0;
  const total = finalizadas.reduce(
    (acc, s) => acc + (new Date(s.fechaFinalizacion as string).getTime() - new Date(s.fechaCreacion).getTime()) / 86400000,
    0,
  );
  return total / finalizadas.length;
}
