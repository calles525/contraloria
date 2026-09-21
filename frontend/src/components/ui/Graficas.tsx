import { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

// ---------------------------------------------------------------------------
// Gráficas del panel principal basadas en ApexCharts (la misma librería que
// usa el template TailAdmin). Los estilos de leyenda, tooltip y texto se
// definen en index.css para mantener la coherencia en claro y oscuro.
// ---------------------------------------------------------------------------

interface PropsGrafica {
  series: number[];
  labels: string[];
  colores: string[];
  altura?: number;
}

export function GraficaDonut({ series, labels, colores, altura = 260 }: PropsGrafica) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    if (series.length === 0 || series.every((n) => n === 0)) return;

    const grafica = new ApexCharts(contenedor, {
      series,
      labels,
      colors: colores,
      chart: {
        type: 'donut',
        height: altura,
        fontFamily: 'Outfit, sans-serif',
        toolbar: { show: false },
      },
      legend: {
        position: 'bottom',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        // Leyenda clara: "Nombre: valor".
        formatter: (nombre: string, opciones: unknown) => {
          const o = opciones as { seriesIndex?: number; w?: { globals?: { series?: number[] } } };
          const valor = o?.w?.globals?.series?.[o?.seriesIndex ?? 0] ?? 0;
          return `${nombre}: ${valor}`;
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
          },
        },
      },
      // Cada segmento muestra su porcentaje (tipo Power BI).
      dataLabels: {
        enabled: true,
        formatter: (valor: number) => `${Math.round(valor)}%`,
      },
      stroke: { width: 2 },
      tooltip: { theme: 'dark' },
    });

    grafica.render();
    return () => {
      grafica.destroy();
    };
  }, [series, labels, colores, altura]);

  return <div ref={contenedorRef} />;
}

interface PropsGraficaBarras {
  series: number[];
  labels: string[];
  colores: string[];
  altura?: number;
  /** Barras horizontales (para listas tipo ranking). */
  horizontal?: boolean;
}

export function GraficaBarras({
  series,
  labels,
  colores,
  altura,
  horizontal = false,
}: PropsGraficaBarras) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    if (series.length === 0 || series.every((n) => n === 0)) return;

    const alturaEfectiva = altura ?? (horizontal ? labels.length * 38 + 70 : 260);

    const grafica = new ApexCharts(contenedor, {
      series: [{ name: 'Solicitudes', data: series }],
      chart: {
        type: 'bar',
        height: alturaEfectiva,
        fontFamily: 'Outfit, sans-serif',
        toolbar: { show: false },
      },
      colors: colores,
      plotOptions: {
        bar: {
          horizontal,
          borderRadius: 4,
          columnWidth: '55%',
          barHeight: '60%',
        },
      },
      // El valor de cada barra queda visible.
      dataLabels: {
        enabled: true,
        style: { fontSize: '11px', fontWeight: 600 },
      },
      legend: { show: false },
      grid: {
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        categories: labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        title: { style: { fontSize: '0px' } },
      },
      tooltip: { theme: 'dark' },
    });

    grafica.render();
    return () => {
      grafica.destroy();
    };
  }, [series, labels, colores, altura, horizontal]);

  return <div ref={contenedorRef} />;
}

interface SerieApilada {
  nombre: string;
  datos: number[];
  color: string;
}

interface PropsBarrasApiladas {
  /** Etiquetas del eje X (meses). */
  categorias: string[];
  series: SerieApilada[];
  altura?: number;
}

/** Barras verticales apiladas: una categoría (serie) por estado. */
export function GraficaBarrasApiladas({ categorias, series, altura = 280 }: PropsBarrasApiladas) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    if (categorias.length === 0 || series.every((s) => s.datos.every((n) => n === 0))) return;

    const grafica = new ApexCharts(contenedor, {
      series: series.map((s) => ({ name: s.nombre, data: s.datos })),
      chart: {
        type: 'bar',
        height: altura,
        stacked: true,
        fontFamily: 'Outfit, sans-serif',
        toolbar: { show: false },
      },
      colors: series.map((s) => s.color),
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: '55%' },
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
      },
      grid: {
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        categories: categorias,
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        title: { style: { fontSize: '0px' } },
      },
      tooltip: { theme: 'dark' },
    });

    grafica.render();
    return () => {
      grafica.destroy();
    };
  }, [categorias, series, altura]);

  return <div ref={contenedorRef} />;
}