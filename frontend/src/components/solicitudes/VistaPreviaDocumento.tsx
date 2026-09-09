import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

interface PropsVistaPreviaDocumento {
  archivo: { blob: Blob; nombre: string };
}

const EXTENSION_IMAGEN = /\.(png|jpe?g|webp|gif|bmp)$/i;
const EXTENSION_EXCEL = /\.(xlsx|xls)$/i;

/**
 * Muestra la vista previa de un documento adjunto dentro del modal.
 * Soporta imágenes, PDF, Word (.docx) y Excel (.xlsx/.xls) sin descargarlos.
 */
export default function VistaPreviaDocumento({ archivo }: PropsVistaPreviaDocumento) {
  const { blob, nombre } = archivo;
  const extension = (nombre.split('.').pop() || '').toLowerCase();
  const esImagen = EXTENSION_IMAGEN.test(nombre);
  const esPdf = extension === 'pdf';
  const esWord = extension === 'docx' || extension === 'doc';
  const esExcel = EXTENSION_EXCEL.test(nombre);

  // URL de objeto para mostrar imágenes y PDF (se libera al desmontar).
  const [urlObjeto, setUrlObjeto] = useState<string | null>(null);
  const [contenidoExcel, setContenidoExcel] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const contenedorWord = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let urlCreada: string | null = null;
    if (esImagen || esPdf) {
      urlCreada = URL.createObjectURL(blob);
      setUrlObjeto(urlCreada);
    }
    return () => {
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [blob, esImagen, esPdf]);

  // Renderiza documentos de Word dentro del contenedor.
  useEffect(() => {
    if (!esWord) return;
    setCargando(true);
    setError('');
    renderAsync(blob, contenedorWord.current as HTMLElement, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      useBase64URL: false,
    })
      .then(() => setCargando(false))
      .catch(() => {
        setCargando(false);
        setError(
          'No se pudo previsualizar este documento Word. Use el botón "Descargar" para verlo.'
        );
      });
  }, [blob, esWord]);

  // Convierte documentos de Excel a HTML para mostrarlos en pantalla.
  useEffect(() => {
    if (!esExcel) return;
    setCargando(true);
    setError('');
    blob
      .arrayBuffer()
      .then((buffer) => {
        const libro = XLSX.read(buffer, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        setContenidoExcel(XLSX.utils.sheet_to_html(hoja));
      })
      .catch(() => setError('No se pudo previsualizar este archivo de Excel.'))
      .finally(() => setCargando(false));
  }, [blob, esExcel]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-error-200 bg-error-50 px-4 py-8 text-center dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-theme-sm text-error-600 dark:text-error-500">{error}</p>
      </div>
    );
  }

  if (esImagen && urlObjeto) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]">
        <img
          src={urlObjeto}
          alt={nombre}
          className="mx-auto max-h-[70vh] w-full object-contain"
        />
      </div>
    );
  }

  if (esPdf && urlObjeto) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]">
        <iframe src={urlObjeto} title={nombre} className="h-[70vh] w-full" />
      </div>
    );
  }

  if (esExcel) {
    return (
      <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white/[0.03]">
        {cargando && (
          <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            Cargando vista previa…
          </p>
        )}
        {contenidoExcel && (
          <div
            className="max-h-[70vh] overflow-auto text-theme-xs text-gray-800 dark:text-gray-200"
            // El HTML lo genera SheetJS con estilos propios de tabla.
            dangerouslySetInnerHTML={{ __html: contenidoExcel }}
          />
        )}
      </div>
    );
  }

  if (esWord) {
    return (
      <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white/[0.03]">
        {cargando && (
          <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            Cargando vista previa…
          </p>
        )}
        <div
          ref={contenedorWord}
          className="docx-contenido max-h-[70vh] overflow-auto"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Este tipo de archivo no admite vista previa.
      </p>
    </div>
  );
}