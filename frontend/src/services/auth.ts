import api from './api';
import { TOKEN_KEY } from '../config';

export interface Persona {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
  birth_date: string;
  phone: string | null;
}

export interface Usuario {
  id: number;
  username: string;
  email: string | null;
  permisos: string[];
  person: Persona;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export function guardarToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { username, password });
  return data;
}

export async function obtenerUsuarioActual(): Promise<Usuario> {
  const { data } = await api.get<{ user: Usuario }>('/auth/me');
  return data.user;
}

export interface UbicacionUsuario {
  company_id: number;
  company: string;
  cost_center_id: number;
  cost_center: string;
  department_id: number;
  department: string;
}

export interface RespuestaUbicacion {
  ubicacion: UbicacionUsuario | null;
  solicitante: string | null;
}

/** Devuelve la empresa/sede/departamento asociados al usuario logueado. */
export async function obtenerUbicacionUsuario(): Promise<RespuestaUbicacion> {
  const { data } = await api.get<RespuestaUbicacion>('/auth/ubicacion');
  return data;
}
