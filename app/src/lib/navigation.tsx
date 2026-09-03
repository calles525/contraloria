// Configuración de navegación del sidebar según el rol.
import type { ReactNode } from 'react';
import type { Rol } from '../lib/types';

export interface ItemNav {
  id: string;
  nombre: string;
  ruta: string;
  icono: string;
}

export const NAV: ItemNav[] = [
  { id: 'dashboard', nombre: 'Dashboard', ruta: '/dashboard', icono: 'dashboard' },
  { id: 'nueva', nombre: 'Nueva Solicitud', ruta: '/nueva', icono: 'nueva' },
  { id: 'mis-solicitudes', nombre: 'Mis Solicitudes', ruta: '/mis-solicitudes', icono: 'list' },
  { id: 'recibidas', nombre: 'Solicitudes Recibidas', ruta: '/recibidas', icono: 'inbox' },
  { id: 'contraloria', nombre: 'Panel de Contraloría', ruta: '/contraloria', icono: 'shield' },
  { id: 'reportes', nombre: 'Reportes', ruta: '/reportes', icono: 'chart' },
  { id: 'usuarios', nombre: 'Usuarios', ruta: '/usuarios', icono: 'users' },
  { id: 'departamentos', nombre: 'Departamentos', ruta: '/departamentos', icono: 'building' },
  { id: 'perfil', nombre: 'Mi Perfil', ruta: '/perfil', icono: 'profile' },
];

export const MENU_POR_ROL: Record<Rol, string[]> = {
  solicitante: ['dashboard', 'nueva', 'mis-solicitudes', 'perfil'],
  departamento: ['dashboard', 'mis-solicitudes', 'recibidas', 'perfil'],
  contraloria: ['dashboard', 'mis-solicitudes', 'contraloria', 'perfil'],
  admin: ['dashboard', 'nueva', 'mis-solicitudes', 'recibidas', 'contraloria', 'reportes', 'usuarios', 'departamentos', 'perfil'],
};

export const ICONOS_NAV: Record<string, ReactNode> = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  nueva: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  list: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  inbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 3v18h18M7 15l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 21h18M5 21V5l7 4 7-4v16M9 9h.01M9 13h.01M15 9h.01M15 13h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
};
