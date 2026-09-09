import CrudPage from '../../components/crud/CrudPage';
import BadgeActivo from '../../components/crud/BadgeActivo';
import { ConfigCrud } from '../../types/crud';

const config: ConfigCrud = {
  titulo: 'Permisos',
  descripcion: 'Catálogo de permisos del sistema. Se asignan a cada usuario desde el módulo de usuarios.',
  rutaApi: '/permissions',
  campos: [
    {
      nombre: 'code',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      placeholder: 'ej: almacenes',
      spanCompleto: true,
    },
    { nombre: 'name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { nombre: 'description', etiqueta: 'Descripción', tipo: 'texto', spanCompleto: true },
    { nombre: 'is_active', etiqueta: 'Activo', tipo: 'check' },
  ],
  columnas: [
    {
      clave: 'name',
      etiqueta: 'Permiso',
      render: (registro) => (
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {registro.name}
        </p>
      ),
    },
    { clave: 'code', etiqueta: 'Código' },
    { clave: 'description', etiqueta: 'Descripción' },
    {
      clave: 'is_active',
      etiqueta: 'Estado',
      render: (registro) => <BadgeActivo activo={registro.is_active} />,
    },
  ],
};

export default function Permisos() {
  return <CrudPage config={config} />;
}