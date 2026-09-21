import { useEffect, useState } from 'react';
import { useSesion } from '../providers/SesionProvider';
import { dashboardApi, type ResumenDashboard } from '../services/dashboard';
import { departamentosApi } from '../services/maestros';
import { GraficaBarras, GraficaBarrasApiladas, GraficaDonut } from '../components/ui/Graficas';
import {
  CATEGORIAS,
  ESTADOS_SOLICITUD,
  ESTILO_ESTADO,
  ESTILO_TIPO,
} from '../types/solicitudes';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const fechaLocal = new Date(fecha);
  if (Number.isNaN(fechaLocal.getTime())) return '—';
  return fechaLocal.toLocaleDateString('es-VE');
}

/** Convierte '2026-09' en 'sep 26' para los ejes mensuales. */
function formatearMes(mes: string): string {
  const [anio, numero] = mes.split('-');
  const nombres = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const indice = Number(numero) - 1;
  const nombre = nombres[indice] ?? mes;
  return `${nombre} ${String(anio).slice(2)}`;
}

// Paleta principal para las gráficas (coherente con el template TailAdmin).
const PALETA = ['#465FFF', '#22C55E', '#F8A845', '#F04438', '#7A5AF8', '#0EC5CF', '#9CB9FF', '#FF8A65'];

const COLORES_ESTADO: Record<string, string> = {
  PENDIENTE: '#F8A845',
  'EN PROCESO': '#465FFF',
  DEVUELTA: '#9CA3AF',
  RECHAZADA: '#F04438',
  VALIDADA: '#22C55E',
};

const claseSelect =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90';

/** Encabezado de cada sección de gráfica. */
function TituloSeccion({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-title-sm font-bold text-gray-800 dark:text-white/90">{titulo}</h2>
      {sub && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { usuario } = useSesion();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros del panel (afectan todas las métricas y gráficas).
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  const [departamentos, setDepartamentos] = useState<{ value: number; label: string }[]>([]);

  // Catálogo de departamentos para el filtro.
  useEffect(() => {
    let activo = true;
    departamentosApi
      .listar()
      .then((filas) => {
        if (!activo) return;
        setDepartamentos(
          filas
            .map((d) => ({ value: Number(d.id), label: String(d.name) }))
            .filter((d) => Number.isInteger(d.value) && d.value > 0 && d.label)
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      })
      .catch(() => {
        // Si no se pueden cargar los departamentos, el filtro queda vacío.
      });
    return () => {
      activo = false;
    };
  }, []);

  // Carga del resumen (se repite al cambiar los filtros).
  useEffect(() => {
    let activo = true;
    setCargando(true);

    dashboardApi
      .resumen({
        estado: filtroEstado || undefined,
        categoria: filtroCategoria || undefined,
        department_id: filtroDepartamento ? Number(filtroDepartamento) : undefined,
      })
      .then((datos) => {
        if (activo) setResumen(datos);
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar el resumen del sistema.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [filtroEstado, filtroCategoria, filtroDepartamento]);

  // Datos derivados para las métricas y el texto de resumen.
  const total = resumen?.totales.solicitudes ?? 0;
  const pendientes = resumen?.porEstado.PENDIENTE ?? 0;
  const enProceso = resumen?.gestion.enProceso ?? 0;
  const validadas = resumen?.porEstado.VALIDADA ?? 0;
  const conErrores = resumen?.gestion.conErrores ?? 0;
  const corregidas = resumen?.gestion.corregidas ?? 0;
  const noCorregidas = resumen?.gestion.noCorregidas ?? 0;
  const sinErrores = resumen?.gestion.sinErrores ?? 0;
  const tasaDevolucion = total ? Math.round((conErrores / total) * 100) : 0;
  const efectividad = total ? Math.round(((sinErrores + corregidas) / total) * 100) : 0;

  const plural = (n: number) => (n === 1 ? 'solicitud' : 'solicitudes');

  const textoResumen = resumen
    ? `El total de ${plural(total)} es de ${total}, de las cuales ${pendientes} ${
        pendientes === 1 ? 'está pendiente' : 'están pendientes'
      }, ${enProceso} ${enProceso === 1 ? 'está en proceso' : 'están en proceso'} y ${validadas} ${
        validadas === 1 ? 'validada' : 'validadas'
      }. ${conErrores} ${plural(conErrores)} fueron devueltas en algún momento (tasa de devolución del ${tasaDevolucion}%), de las que ${corregidas} ${
        corregidas === 1 ? 'fue corregida' : 'fueron corregidas'
      } y ${noCorregidas} siguen sin corregirse. La efectividad de gestión es del ${efectividad}%.`
    : '';

  const metricasRapidas = resumen
    ? [
        { etiqueta: 'Total de solicitudes', valor: String(total), color: 'text-brand-600 dark:text-brand-400', fondo: 'bg-brand-50 dark:bg-brand-500/15', icono: 'M6 2h9l4 4v16H6V2Zm8 1.5V7h3.5L14 3.5Z' },
        { etiqueta: 'Pendientes', valor: String(pendientes), color: 'text-warning-600 dark:text-warning-500', fondo: 'bg-warning-50 dark:bg-warning-500/15', icono: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 3a1 1 0 0 1 1 1v4.6l2.8 1.68a1 1 0 1 1-1 1.73l-3.3-2A1 1 0 0 1 11 14V8a1 1 0 0 1 1-1Z' },
        { etiqueta: 'En proceso', valor: String(enProceso), color: 'text-brand-600 dark:text-brand-400', fondo: 'bg-brand-50 dark:bg-brand-500/15', icono: 'M13 2 3 14h7l-1 8 10-12h-7l1-8Z' },
        { etiqueta: 'Devueltas', valor: String(conErrores), color: 'text-warning-600 dark:text-warning-500', fondo: 'bg-warning-50 dark:bg-warning-500/15', icono: 'M10 5 3 12l7 7v-4h8v-6h-8V5Z' },
        { etiqueta: 'Corregidas', valor: String(corregidas), color: 'text-success-600 dark:text-success-500', fondo: 'bg-success-50 dark:bg-success-500/15', icono: 'm9 16.2-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5L9 16.2Z' },
        { etiqueta: '% Efectividad', valor: `${efectividad}%`, color: 'text-success-600 dark:text-success-500', fondo: 'bg-success-50 dark:bg-success-500/15', icono: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z' },
      ]
    : [];

  // Serie para las barras apiladas mensuales por estado.
  const meses = resumen
    ? resumen.porMesEstado
        .map((f) => f.mes)
        .filter((mes, indice, todos) => todos.indexOf(mes) === indice)
    : [];
  const seriesApiladas = resumen
    ? ESTADOS_SOLICITUD.map((estado) => ({
        nombre: estado,
        color: COLORES_ESTADO[estado],
        datos: meses.map(
          (mes) => resumen.porMesEstado.find((f) => f.mes === mes && f.estado === estado)?.total ?? 0
        ),
      })).filter((serie) => serie.datos.some((n) => n > 0))
    : [];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Encabezado y filtros */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            RESUMEN DE GESTIÓN DE SOLICITUDES
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Bienvenido, {usuario?.person.first_name} {usuario?.person.last_name}. Indicadores del
            Sistema de Contraloría.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={claseSelect}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_SOLICITUD.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={claseSelect}
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              Departamento
            </label>
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className={claseSelect}
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((departamento) => (
                <option key={departamento.value} value={departamento.value}>
                  {departamento.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {cargando && !resumen && (
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            Cargando resumen del sistema...
          </div>
        </div>
      )}

      {error && (
        <div className="col-span-12">
          <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-theme-sm font-medium text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500">
            {error}
          </div>
        </div>
      )}

      {resumen && (
        <>
          {/* Columna izquierda: resumen de texto y métricas rápidas */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex h-full flex-col gap-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <TituloSeccion
                  titulo="Resumen general"
                  sub="Análisis automático del estado de las solicitudes."
                />
                <p className="text-theme-sm leading-6 text-gray-700 dark:text-gray-300">
                  {textoResumen}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <TituloSeccion
                  titulo="Métricas rápidas"
                  sub="Indicadores clave del proceso."
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {metricasRapidas.map((metrica) => (
                    <div
                      key={metrica.etiqueta}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${metrica.fondo}`}
                      >
                        <svg
                          className={`h-5 w-5 ${metrica.color}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d={metrica.icono} />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          {metrica.etiqueta}
                        </p>
                        <p className="text-title-sm font-bold text-gray-800 dark:text-white/90">
                          {metrica.valor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: gráficas */}
          <div className="col-span-12 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Distribución por estado */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <TituloSeccion titulo="Distribución por estado" sub="Estado actual de las solicitudes." />
                {total === 0 ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin solicitudes.</p>
                ) : (
                  <GraficaDonut
                    series={ESTADOS_SOLICITUD.map((estado) => resumen.porEstado[estado] ?? 0)}
                    labels={ESTADOS_SOLICITUD}
                    colores={ESTADOS_SOLICITUD.map((estado) => COLORES_ESTADO[estado])}
                  />
                )}
              </div>

              {/* Solicitudes por departamento (barras horizontales) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <TituloSeccion titulo="Por departamento" sub="Solicitudes por área." />
                {resumen.porDepartamento.length === 0 ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin solicitudes.</p>
                ) : (
                  <GraficaBarras
                    horizontal
                    series={resumen.porDepartamento.map((d) => d.total)}
                    labels={resumen.porDepartamento.map((d) => d.departamento)}
                    colores={[PALETA[0]]}
                  />
                )}
              </div>

              {/* Solicitudes por tipo (barras horizontales) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <TituloSeccion titulo="Por tipo de solicitud" sub="Crear, actualizar, activar o desactivar." />
                {resumen.porTipo.length === 0 ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin solicitudes.</p>
                ) : (
                  <GraficaBarras
                    horizontal
                    series={resumen.porTipo.map((t) => t.total)}
                    labels={resumen.porTipo.map((t) => t.tipo)}
                    colores={[PALETA[4]]}
                  />
                )}
              </div>

              {/* Evolución mensual apilada por estado */}
              <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:col-span-3 md:p-6">
                <TituloSeccion
                  titulo="Evolución de solicitudes por mes"
                  sub="Barras apiladas por estado a lo largo del tiempo."
                />
                {meses.length === 0 ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin solicitudes.</p>
                ) : (
                  <GraficaBarrasApiladas
                    categorias={meses.map(formatearMes)}
                    series={seriesApiladas}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Últimas solicitudes */}
          <div className="col-span-12">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <TituloSeccion
                titulo="Últimas solicitudes"
                sub="Las solicitudes más recientes del sistema."
              />
              {resumen.ultimas.length === 0 ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                  Aún no hay solicitudes registradas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-4 py-3 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          N.º
                        </th>
                        <th className="px-4 py-3 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Solicitante
                        </th>
                        <th className="px-4 py-3 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.ultimas.map((solicitud) => (
                        <tr
                          key={solicitud.id}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                            {solicitud.numero}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-theme-xs font-medium ${ESTILO_TIPO[solicitud.tipo_solicitud]}`}
                            >
                              {solicitud.tipo_solicitud}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                            {solicitud.categoria}
                          </td>
                          <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                            {solicitud.solicitante_nombre}
                          </td>
                          <td className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                            {formatearFechaCorta(solicitud.fecha_solicitud)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-theme-xs font-medium ${ESTILO_ESTADO[solicitud.estado]}`}
                            >
                              {solicitud.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}