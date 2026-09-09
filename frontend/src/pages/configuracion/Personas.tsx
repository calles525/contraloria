import CrudPage from '../../components/crud/CrudPage';
import { ConfigCrud } from '../../types/crud';

const config: ConfigCrud = {
  titulo: 'Personas',
  descripcion: 'Registro de personas (funcionarios) del sistema.',
  rutaApi: '/persons',
  campos: [
    { nombre: 'first_name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { nombre: 'last_name', etiqueta: 'Apellido', tipo: 'texto', requerido: true },
    {
      nombre: 'id_number',
      etiqueta: 'Cédula',
      tipo: 'texto',
      requerido: true,
      placeholder: 'V-12345678',
    },
    { nombre: 'birth_date', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
    { nombre: 'phone', etiqueta: 'Teléfono', tipo: 'texto' },
  ],
  columnas: [
    {
      clave: 'nombre_completo',
      etiqueta: 'Nombre completo',
      render: (registro) => (
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {registro.full_name}
        </p>
      ),
    },
    { clave: 'id_number', etiqueta: 'Cédula' },
    { clave: 'birth_date', etiqueta: 'Nacimiento' },
    { clave: 'phone', etiqueta: 'Teléfono' },
  ],
};

export default function Personas() {
  return <CrudPage config={config} />;
}