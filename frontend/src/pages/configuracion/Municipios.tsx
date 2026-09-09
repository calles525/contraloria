import CrudPage from '../../components/crud/CrudPage';
import { ConfigCrud } from '../../types/crud';
import { estadosApi } from '../../services/maestros';

const config: ConfigCrud = {
  titulo: 'Municipios',
  descripcion: 'Municipios asociados a su estado correspondiente.',
  rutaApi: '/municipalities',
  campos: [
    {
      nombre: 'state_id',
      etiqueta: 'Estado',
      tipo: 'select',
      requerido: true,
      cargarOpciones: () => estadosApi.opciones(),
    },
    { nombre: 'code', etiqueta: 'Código', tipo: 'texto' },
    { nombre: 'name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  ],
  columnas: [
    { clave: 'name', etiqueta: 'Nombre' },
    { clave: 'state_name', etiqueta: 'Estado' },
  ],
};

export default function Municipios() {
  return <CrudPage config={config} />;
}