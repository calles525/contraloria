import CrudPage from '../../components/crud/CrudPage';
import { ConfigCrud } from '../../types/crud';
import { estadosApi, municipiosApi } from '../../services/maestros';

const config: ConfigCrud = {
  titulo: 'Ciudades',
  descripcion: 'Ciudades asociadas a su municipio y estado.',
  rutaApi: '/cities',
  campos: [
    {
      nombre: 'state_id',
      etiqueta: 'Estado (filtro)',
      tipo: 'select',
      requerido: false,
      cargarOpciones: () => estadosApi.opciones(),
    },
    {
      nombre: 'municipality_id',
      etiqueta: 'Municipio',
      tipo: 'select',
      requerido: true,
      dependeDe: 'state_id',
      cargarOpciones: (valores) =>
        municipiosApi.opciones(valores.state_id ? String(valores.state_id) : ''),
    },
    { nombre: 'code', etiqueta: 'Código', tipo: 'texto' },
    { nombre: 'name', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  ],
  columnas: [
    { clave: 'name', etiqueta: 'Nombre' },
    { clave: 'municipality_name', etiqueta: 'Municipio' },
    { clave: 'state_name', etiqueta: 'Estado' },
  ],
};

export default function Ciudades() {
  return <CrudPage config={config} />;
}