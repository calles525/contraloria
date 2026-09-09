import CrudPage from '../../components/crud/CrudPage';
import BadgeActivo from '../../components/crud/BadgeActivo';
import { ConfigCrud } from '../../types/crud';
import { empresasApi, centrosCostoApi, personasApi } from '../../services/maestros';

const config: ConfigCrud = {
  titulo: 'Departamentos',
  descripcion: 'Departamentos organizacionales asociados a una empresa y centro de costo.',
  rutaApi: '/departments',
  campos: [
    {
      nombre: 'company_id',
      etiqueta: 'Empresa',
      tipo: 'select',
      requerido: true,
      spanCompleto: true,
      cargarOpciones: () => empresasApi.opciones(),
    },
    {
      nombre: 'cost_center_id',
      etiqueta: 'Centro de costo',
      tipo: 'select',
      requerido: true,
      dependeDe: 'company_id',
      cargarOpciones: (valores) =>
        centrosCostoApi.opciones(valores.company_id ? String(valores.company_id) : ''),
    },
    { nombre: 'name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    {
      nombre: 'manager_person_id',
      etiqueta: 'Encargado',
      tipo: 'select',
      requerido: false,
      cargarOpciones: () => personasApi.opciones(),
    },
    { nombre: 'description', etiqueta: 'Descripción', tipo: 'area', spanCompleto: true },
    { nombre: 'is_active', etiqueta: 'Activo', tipo: 'check' },
  ],
  columnas: [
    { clave: 'name', etiqueta: 'Nombre' },
    { clave: 'company_name', etiqueta: 'Empresa' },
    { clave: 'cost_center_name', etiqueta: 'Centro de costo' },
    { clave: 'manager_name', etiqueta: 'Encargado' },
    {
      clave: 'is_active',
      etiqueta: 'Estado',
      render: (registro) => <BadgeActivo activo={registro.is_active} />,
    },
  ],
};

export default function Departamentos() {
  return <CrudPage config={config} />;
}