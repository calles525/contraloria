// Validaciones específicas del dominio (solicitudes, usuarios, departamentos).
import { TIPO_CAMPOS } from './constants';
import type { CampoEspecifico, TipoSolicitud } from './types';
import {
  esEmailValido,
  esMontoValido,
  esRifValido,
  esTelefonoValido,
  santizarTexto,
} from './utils';

export interface DatosGeneralesInput {
  tipo: TipoSolicitud;
  titulo: string;
  descripcion: string;
  prioridad: string;
  departamentoDestinoId: number | '';
  fechaRequerida?: string;
}

export function validarDatosGenerales(input: DatosGeneralesInput): string[] {
  const errores: string[] = [];
  if (!input.departamentoDestinoId) errores.push('Seleccione el departamento destino.');
  if (!santizarTexto(input.titulo)) errores.push('El título es obligatorio.');
  if (!santizarTexto(input.descripcion)) errores.push('La descripción es obligatoria.');
  if (input.titulo.trim().length < 3) errores.push('El título debe tener al menos 3 caracteres.');
  if (input.titulo.trim().length > 200) errores.push('El título no puede superar los 200 caracteres.');
  return errores;
}

function validarCampoValor(campo: CampoEspecifico, valor: string | undefined): string | null {
  if (!campo.required) return null;
  const v = (valor ?? '').trim();
  if (!v) return `El campo "${campo.label}" es obligatorio.`;
  switch (campo.type) {
    case 'email':
      return esEmailValido(v) ? null : `El campo "${campo.label}" debe ser un email válido.`;
    case 'rif':
      return esRifValido(v) ? null : `El campo "${campo.label}" debe tener formato RIF (ej: J-12345678-9).`;
    case 'phone':
      return esTelefonoValido(v) ? null : `El campo "${campo.label}" debe ser un teléfono válido (ej: 0412-5551234).`;
    case 'money':
      return esMontoValido(v) ? null : `El campo "${campo.label}" debe ser un monto válido (mayor a 0).`;
    default:
      return null;
  }
}

export function validarDatosEspecificos(
  tipo: TipoSolicitud,
  datos: Record<string, string>,
): string[] {
  const campos = TIPO_CAMPOS[tipo] ?? [];
  const errores: string[] = [];
  for (const campo of campos) {
    const err = validarCampoValor(campo, datos[campo.key]);
    if (err) errores.push(err);
  }
  return errores;
}

export interface UsuarioInput {
  nombre: string;
  email: string;
  rol: string;
  departamentoId: number | '';
  cargo?: string;
  password?: string;
  esNuevo: boolean;
}

export function validarUsuario(input: UsuarioInput): string[] {
  const errores: string[] = [];
  if (!santizarTexto(input.nombre)) errores.push('El nombre es obligatorio.');
  if (!esEmailValido(input.email)) errores.push('Email inválido.');
  if (!input.departamentoId) errores.push('Seleccione un departamento (obligatorio).');
  if (input.esNuevo && !input.password) errores.push('La contraseña es obligatoria para nuevos usuarios.');
  else if (!input.esNuevo && input.password && input.password.length < 4)
    errores.push('La contraseña debe tener al menos 4 caracteres.');
  return errores;
}

export function validarDepartamento(nombre: string): string[] {
  const errores: string[] = [];
  if (!santizarTexto(nombre)) errores.push('El nombre es obligatorio.');
  return errores;
}
