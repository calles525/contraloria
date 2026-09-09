import { ReactNode } from 'react';
import { OpcionSelect } from './maestros';

export type TipoCampo = 'texto' | 'email' | 'numero' | 'fecha' | 'area' | 'select' | 'check' | 'password';

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  placeholder?: string;
  /** Opciones estáticas para campos tipo select. */
  opciones?: OpcionSelect[];
  /** Carga opciones dinámicas según los valores actuales del formulario. */
  cargarOpciones?: (valores: Record<string, unknown>) => Promise<OpcionSelect[]>;
  /** Nombre del campo del que depende (select en cascada). */
  dependeDe?: string;
  /** Oculta el campo al editar (ej: contraseña). */
  ocultarAlEditar?: boolean;
  /** Solo es obligatorio al crear (ej: contraseña inicial). */
  requeridoSoloCrear?: boolean;
  /** Ocupa el ancho completo del formulario. */
  spanCompleto?: boolean;
}

export interface ColumnaTabla {
  clave: string;
  etiqueta: string;
  render?: (registro: Record<string, any>) => ReactNode;
}

export interface ConfigCrud {
  titulo: string;
  descripcion?: string;
  rutaApi: string;
  campos: CampoFormulario[];
  columnas: ColumnaTabla[];
  tieneEstadoActivo?: boolean;
}