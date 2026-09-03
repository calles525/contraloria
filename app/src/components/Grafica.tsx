// Componente envoltorio de ApexCharts con soporte de tema claro/oscuro.
import { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';
import { useTheme } from '../providers/ThemeProvider';
import { reportarError } from '../lib/utils';

export type TipoGrafica =
  | 'area'
  | 'bar'
  | 'line'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'candlestick'
  | 'boxPlot'
  | 'radar'
  | 'polarArea'
  | 'rangeBar'
  | 'rangeArea'
  | 'treemap';

interface GraficaProps {
  tipo: TipoGrafica;
  series: ApexCharts.ApexOptions['series'];
  etiquetas?: string[];
  categorias?: string[];
  colores?: string[];
  opciones?: ApexCharts.ApexOptions;
  altura?: number;
  donut?: boolean;
  leyenda?: 'bottom' | 'top' | 'right' | 'left' | undefined;
}

export const COLORES_GRAFICA = ['#465FFF', '#0ea5e9', '#f59e0b', '#22c55e', '#ef4444'];

export function Grafica({
  tipo,
  series,
  etiquetas,
  categorias,
  colores,
  opciones = {},
  altura = 320,
  donut = false,
  leyenda,
}: GraficaProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const graficaRef = useRef<ApexCharts | null>(null);
  const { modo } = useTheme();

  useEffect(() => {
    if (!contenedorRef.current) return;
    const oscuro = modo === 'dark';
    const textoColor = oscuro ? '#9aa4b2' : '#637381';
    const colorGrilla = oscuro ? '#293650' : '#e7edf3';

    const base: ApexCharts.ApexOptions = {
      chart: {
        type: tipo,
        fontFamily: 'Inter, sans-serif',
        foreColor: textoColor,
        toolbar: { show: false },
        background: 'transparent',
      },
      series: series as ApexCharts.ApexOptions['series'],
      colors: colores ?? COLORES_GRAFICA,
      grid: { borderColor: colorGrilla, strokeDashArray: 3 },
      labels: etiquetas,
    };

    if (donut) {
      base.plotOptions = {
        pie: { donut: { labels: { show: true, total: { show: true, label: 'Total' } } } },
      };
    } else if (categorias) {
      base.xaxis = { categories: categorias };
      base.dataLabels = { enabled: false };
      base.plotOptions = { bar: { borderRadius: 6, columnWidth: '50%' } };
    }

    if (leyenda) base.legend = { position: leyenda };
    if (opciones) {
      base.dataLabels = { ...base.dataLabels, ...opciones.dataLabels };
      if (opciones.plotOptions) base.plotOptions = { ...base.plotOptions, ...opciones.plotOptions };
      if (opciones.tooltip) base.tooltip = opciones.tooltip;
      if (opciones.legend) base.legend = opciones.legend;
    }

    try {
      const instancia = new ApexCharts(contenedorRef.current, base);
      instancia.render();
      graficaRef.current = instancia;
    } catch (err) {
      reportarError('grafica:render', err);
    }

    return () => {
      graficaRef.current?.destroy();
      graficaRef.current = null;
    };
    // series y etiquetas se reconstruyen sólo cuando cambia el modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, tipo]);

  return <div ref={contenedorRef} style={{ height: altura }} />;
}
