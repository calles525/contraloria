import CrudPage from '../../components/crud/CrudPage';
import { ConfigCrud } from '../../types/crud';

const config: ConfigCrud = {
  titulo: 'Empresas',
  descripcion: 'Gestión de empresas (razones sociales) del sistema.',
  rutaApi: '/companies',
  campos: [
    { nombre: 'ruc', etiqueta: 'RUC', tipo: 'texto', requerido: true, placeholder: 'J-12345678-9' },
    { nombre: 'legal_name', etiqueta: 'Razón social', tipo: 'texto', requerido: true },
    { nombre: 'trade_name', etiqueta: 'Nombre comercial', tipo: 'texto' },
    { nombre: 'address', etiqueta: 'Dirección', tipo: 'texto', spanCompleto: true },
    { nombre: 'phone', etiqueta: 'Teléfono', tipo: 'texto' },
    { nombre: 'email', etiqueta: 'Email', tipo: 'email' },
  ],
  columnas: [
    { clave: 'ruc', etiqueta: 'RUC' },
    { clave: 'legal_name', etiqueta: 'Razón social' },
    { clave: 'trade_name', etiqueta: 'Nombre comercial' },
    { clave: 'phone', etiqueta: 'Teléfono' },
    { clave: 'email', etiqueta: 'Email' },
  ],
};

export default function Empresas() {
  return <CrudPage config={config} />;
}