import { useMemo, useState } from 'react';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { store } from '../lib/store';
import { porDepartamento, porEstado, porPrioridad, porTipo, tiempoPromedioDias } from '../lib/stats';
import { ESTADOS, PRIORIDADES, TIPOS } from '../lib/constants';
import { usePageTitle } from '../hooks/usePageTitle';
import { Grafica } from '../components/Grafica';
import { exportarCSV, exportarExcel, exportarPDF } from '../lib/exportExcel';
import type { EstadoSolicitud } from '../lib/types';

export default function Reportes() {
  usePageTitle('Reportes');
  const { version } = useApp();
  const { mostrar } = useToast();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const todas = useMemo(() => {
    let lista = store.getSolicitudes({});
    if (desde) lista = lista.filter((s) => new Date(s.fechaCreacion) >= new Date(desde));
    if (hasta) lista = lista.filter((s) => new Date(s.fechaCreacion) <= new Date(hasta));
    return lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta, version]);

  const porEst = porEstado(todas);
  const porDept = porDepartamento(todas);
  const porPrio = porPrioridad(todas);
  const porTip = porTipo(todas);

  const totalFinalizadas = todas.filter((s) => s.estado === 'aprobado' || s.estado === 'rechazado').length;
  const aprobacion = todas.length ? Math.round((porEst.aprobado ?? 0) / todas.length * 100) : 0;

  const exportar = (formato: 'csv' | 'excel' | 'pdf') => {
    if (formato === 'csv') exportarCSV(todas);
    else if (formato === 'excel') exportarExcel(todas);
    else exportarPDF(todas);
    mostrar('Reporte exportado con éxito.');
  };

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h3>Reportes e indicadores</h3>
          <div className="head-actions export-menu">
            <button className="export-opts" onClick={() => exportar('excel')}>Exportar Excel</button>
            <button className="export-opts" onClick={() => exportar('csv')}>Exportar CSV</button>
            <button className="export-opts" onClick={() => exportar('pdf')}>Exportar PDF</button>
          </div>
        </div>
        <div className="filtros">
          <div className="filter-inputs">
            <label className="filter-label">Desde</label>
            <input type="date" className="filter-control" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <label className="filter-label">Hasta</label>
            <input type="date" className="filter-control" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Total</span><span className="stat-value">{todas.length}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Aprobadas</span><span className="stat-value">{porEst.aprobado ?? 0}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Rechazadas</span><span className="stat-value">{porEst.rechazado ?? 0}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">% Aprobación</span><span className="stat-value">{aprobacion}%</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Finalizadas</span><span className="stat-value">{totalFinalizadas}</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">Tiempo prom. (días)</span><span className="stat-value">{tiempoPromedioDias(todas).toFixed(1)}</span></div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><h3>Solicitudes por Estado</h3></div>
          <Grafica
            tipo="bar"
            series={[{ name: 'Solicitudes', data: Object.keys(porEst).map((k) => porEst[k as EstadoSolicitud]) }]}
            categorias={Object.keys(porEst).map((k) => ESTADOS[k as EstadoSolicitud] ?? k)}
          />
        </div>
        <div className="card">
          <div className="card-head"><h3>Por Prioridad</h3></div>
          <Grafica
            tipo="donut"
            donut
            series={Object.keys(porPrio).map((k) => porPrio[k])}
            etiquetas={Object.keys(porPrio).map((k) => PRIORIDADES[k as keyof typeof PRIORIDADES] ?? k)}
            colores={['#ef4444', '#f59e0b', '#22c55e']}
            leyenda="bottom"
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><h3>Por Departamento</h3></div>
          <Grafica
            tipo="bar"
            series={[{ name: 'Solicitudes', data: porDept.map((d) => d[1]) }]}
            categorias={porDept.map((d) => d[0])}
          />
        </div>
        <div className="card">
          <div className="card-head"><h3>Por Tipo</h3></div>
          <Grafica
            tipo="donut"
            donut
            series={Object.keys(porTip).map((k) => porTip[k])}
            etiquetas={Object.keys(porTip).map((k) => TIPOS[k as keyof typeof TIPOS] ?? k)}
            leyenda="bottom"
          />
        </div>
      </div>
    </div>
  );
}
