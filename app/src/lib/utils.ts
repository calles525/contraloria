// Utilidades: validación, saneamiento y formateo.

export interface ValidadorResultado {
  valido: boolean;
  errores: string[];
}

export const santizarTexto = (v: unknown): string =>
  String(v ?? '').replace(/[<>]/g, '').trim();

export const esEmailValido = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const esRifValido = (v: string): boolean =>
  /^[VEJG]-?\d{8}-?\d$/.test(v.trim());

export const esTelefonoValido = (v: string): boolean =>
  /^(\+?\d{1,3}[- ]?)?\(?\d{3,4}\)?[- ]?\d{7}$/.test(v.trim());

export const esMontoValido = (v: string): boolean => {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return !Number.isNaN(n) && n > 0;
};

export function iniciales(nombre = ''): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

export function formatearFecha(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatearFechaCorta(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearMonto(valor: string | number): string {
  const n = Number(String(valor).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(n)) return String(valor ?? '');
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', maximumFractionDigits: 2 }).format(n);
}

export function diasTranscurridosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// Registra un error no controlado para diagnóstico (capa de observabilidad).
export function reportarError(contexto: string, err: unknown): void {
  console.error(`[SIGID:${contexto}]`, err);
}
