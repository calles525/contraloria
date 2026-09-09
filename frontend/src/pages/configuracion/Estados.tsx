import CrudPage from '../../components/crud/CrudPage';
import { ConfigCrud } from '../../types/crud';

const config: ConfigCrud = {
  titulo: 'Estados',
  descripcion: 'Catálogo de estados (entidades federales).',
  rutaApi: '/states',
  campos: [
    { nombre: 'code', etiqueta: 'Código', tipo: 'texto', requerido: true, placeholder: 'VE-A' },
    { nombre: 'name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { nombre: 'iso', etiqueta: 'ISO', tipo: 'texto', placeholder: 'VE' },
  ],
  columnas: [
    { clave: 'code', etiqueta: 'Código' },
    { clave: 'name', etiqueta: 'Nombre' },
    { clave: 'iso', etiqueta: 'ISO' },
  ],
};

export default function Estados() {
  return <CrudPage config={config} />;
}