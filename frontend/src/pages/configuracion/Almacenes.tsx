import CrudPage from '../../components/crud/CrudPage';
import BadgeActivo from '../../components/crud/BadgeActivo';
import { ConfigCrud } from '../../types/crud';
import { empresasApi, personasApi } from '../../services/maestros';

const config: ConfigCrud = {
  titulo: 'Almacenes',
  descripcion: 'Almacenes por empresa. Permite asignar un encargado (persona) a cada almacén.',
  rutaApi: '/warehouses',
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
      nombre: 'manager_person_id',
      etiqueta: 'Encargado',
      tipo: 'select',
      requerido: false,
      cargarOpciones: () => personasApi.opciones(),
    },
    { nombre: 'phone', etiqueta: 'Teléfono', tipo: 'texto' },
    { nombre: 'address', etiqueta: 'Dirección', tipo: 'texto', spanCompleto: true },
    { nombre: 'is_active', etiqueta: 'Activo', tipo: 'check' },
  ],
  columnas: [
    {
      clave: 'name',
      etiqueta: 'Nombre',
      render: (registro) => (
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {registro.name}
        </p>
      ),
    },
    { clave: 'company_name', etiqueta: 'Empresa' },
    { clave: 'code', etiqueta: 'Código' },
    {
      clave: 'manager_name',
      etiqueta: 'Encargado',
      render: (registro) => (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          {registro.manager_name || 'Sin asignar'}
        </p>
      ),
    },
    { clave: 'phone', etiqueta: 'Teléfono' },
    {
      clave: 'is_active',
      etiqueta: 'Estado',
      render: (registro) => <BadgeActivo activo={registro.is_active} />,
    },
  ],
};

export default function Almacenes() {
  return <CrudPage config={config} />;
}