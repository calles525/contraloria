// Badge y Avatar reutilizables.
import type { ReactNode } from 'react';
import { ESTADO_COLOR, ESTADOS, PRIORIDAD_COLOR, PRIORIDADES } from '../lib/constants';
import type { EstadoSolicitud, Prioridad, TipoSolicitud } from '../lib/types';
import { iniciales } from '../lib/utils';

export type ColorBadge = 'slate' | 'info' | 'warning' | 'success' | 'danger' | 'primary';

const colorAClase: Record<ColorBadge, string> = {
  slate: 'badge-slate',
  info: 'badge-info',
  warning: 'badge-warning',
  success: 'badge-success',
  danger: 'badge-danger',
  primary: 'badge-primary',
};

export function Badge({ color, children }: { color: ColorBadge; children: ReactNode }) {
  return <span className={`badge ${colorAClase[color]}`}>{children}</span>;
}

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const color = (ESTADO_COLOR[estado] ?? 'slate') as ColorBadge;
  return <Badge color={color}>{ESTADOS[estado]}</Badge>;
}

export function PrioridadBadge({ prioridad }: { prioridad: Prioridad }) {
  const color = (PRIORIDAD_COLOR[prioridad] ?? 'slate') as ColorBadge;
  return <Badge color={color}>{PRIORIDADES[prioridad]}</Badge>;
}

export function TipoBadge({ tipo }: { tipo: TipoSolicitud }) {
  return (
    <span className="badge badge-outline">
      {tipo === 'creacion_tercero' ? 'Creación Tercero'
        : tipo === 'registro_producto' ? 'Producto'
        : tipo === 'solicitud_compra' ? 'Compra'
        : tipo === 'viaticos' ? 'Viáticos'
        : 'Otro'}
    </span>
  );
}

const COLORES_AVATAR = [
  'avatar-blue',
  'avatar-green',
  'avatar-orange',
  'avatar-purple',
  'avatar-red',
];

export function Avatar({
  nombre,
  id = 0,
  tamano = 'md',
}: {
  nombre: string;
  id?: number;
  tamano?: 'sm' | 'md' | 'xl';
}) {
  const cls = COLORES_AVATAR[Math.abs(id) % COLORES_AVATAR.length];
  const claseTamano = tamano === 'xl' ? 'avatar-xl' : tamano === 'sm' ? 'avatar-sm' : '';
  return <span className={`avatar ${cls} ${claseTamano}`}>{iniciales(nombre)}</span>;
}
