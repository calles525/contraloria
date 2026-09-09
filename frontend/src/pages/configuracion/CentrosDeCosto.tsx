import CrudPage from '../../components/crud/CrudPage';
import BadgeActivo from '../../components/crud/BadgeActivo';
import { ConfigCrud } from '../../types/crud';
import {
  empresasApi,
  estadosApi,
  municipiosApi,
  ciudadesApi,
} from '../../services/maestros';

const config: ConfigCrud = {
  titulo: 'Centros de costo',
  descripcion: 'Centros de costo asociados a una empresa y su ubicación.',
  rutaApi: '/cost-centers',
  campos: [
    {
      nombre: 'company_id',
      etiqueta: 'Empresa',
      tipo: 'select',
      requerido: true,
      spanCompleto: true,
      cargarOpciones: () => empresasApi.opciones(),
    },
    { nombre: 'code', etiqueta: 'Código', tipo: 'texto' },
    { nombre: 'name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    {
      nombre: 'state_id',
      etiqueta: 'Estado',
      tipo: 'select',
      requerido: false,
      cargarOpciones: () => estadosApi.opciones(),
    },
    {
      nombre: 'municipality_id',
      etiqueta: 'Municipio',
      tipo: 'select',
      requerido: false,
      dependeDe: 'state_id',
      cargarOpciones: (valores) =>
        municipiosApi.opciones(valores.state_id ? String(valores.state_id) : ''),
    },
    {
      nombre: 'city_id',
      etiqueta: 'Ciudad',
      tipo: 'select',
      requerido: false,
      dependeDe: 'municipality_id',
      cargarOpciones: (valores) =>
        ciudadesApi.opciones(
          valores.state_id ? String(valores.state_id) : '',
          valores.municipality_id ? String(valores.municipality_id) : ''
        ),
    },
    { nombre: 'address', etiqueta: 'Dirección', tipo: 'texto', spanCompleto: true },
    { nombre: 'phone', etiqueta: 'Teléfono', tipo: 'texto' },
    { nombre: 'email', etiqueta: 'Email', tipo: 'email' },
    { nombre: 'is_active', etiqueta: 'Activo', tipo: 'check' },
  ],
  columnas: [
    { clave: 'name', etiqueta: 'Nombre' },
    { clave: 'company_name', etiqueta: 'Empresa' },
    { clave: 'code', etiqueta: 'Código' },
    { clave: 'phone', etiqueta: 'Teléfono' },
    {
      clave: 'is_active',
      etiqueta: 'Estado',
      render: (registro) => <BadgeActivo activo={registro.is_active} />,
    },
  ],
};

export default function CentrosDeCosto() {
  return <CrudPage config={config} />;
}