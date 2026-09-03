import { useMemo } from 'react';
import { useApp } from '../providers/AppProvider';
import { store } from '../lib/store';
import { ESTADO_GRUPOS, ESTADOS, PRIORIDADES } from '../lib/constants';
import { porDepartamento, porEstado, porPrioridad, tiempoPromedioDias } from '../lib/stats';
import { usePageTitle } from '../hooks/usePageTitle';
import { Grafica } from '../components/Grafica';
import { Timeline } from '../components/Timeline';

const ICONOS_CARTA: Record<string, string> = {
  total: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  prog: 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  env: 'M4 6h16M4 12h10M4 18h16',
  ok: 'M9 12l2 2 4-4m5 2a8 8 0 11-16 0 8 8 0 0116 0z',
  wait: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  month: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  avg: 'M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z',
  obs: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  pen: 'M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z',
  rev: 'M4 4v5h5M20 20v-5h-5M4.6 9A8 8 0 0119.4 6M19.4 15A8 8 0 014.6 18',
  usr: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

function CartaStat({ icono, etiqueta, valor, color }: { icono: string; etiqueta: string; valor: string | number; color: string }) {
  return (
    <div className="stat-card" style={{ ['--accent' as never]: color }}>
      <div className="stat-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d={ICONOS_CARTA[icono]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="stat-info">
        <span className="stat-label">{etiqueta}</span>
        <span className="stat-value">{valor}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { usuario, version } = useApp();

  const datos = useMemo(() => {
    if (!usuario) return null;
    const todas = store.getSolicitudes({});
    let lista = todas;
    if (usuario.rol === 'solicitante') lista = todas.filter((s) => s.creadorId === usuario.id);
    else if (usuario.rol === 'departamento')
      lista = todas.filter((s) => s.departamentoDestinoId === usuario.departamentoId || s.departamentoOrigenId === usuario.departamentoId);
    else if (usuario.rol === 'contraloria')
      lista = todas.filter((s) => ['en_contraloria', 'ajustes_requeridos', 'aprobado', 'rechazado'].includes(s.estado));

    const est = porEstado(lista);
    const pendientes = (est.en_contraloria ?? 0) + (est.en_revision_departamento ?? 0) + (est.enviado ?? 0);

    const eventos: Array<{ fecha: string; usuarioNombre: string; comentario: string; estadoNuevo?: string; num: string }> = [];
    for (const s of lista) {
      for (const h of s.historial)
        eventos.push({ fecha: h.fecha, usuarioNombre: h.usuarioNombre, comentario: h.comentario ?? '', estadoNuevo: h.estadoNuevo ?? undefined, num: s.numeroSolicitud });
    }
    eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    let cartas: Array<{ icono: string; etiqueta: string; valor: string | number; color: string }> = [];
    if (usuario.rol === 'solicitante') {
      cartas = [
        { icono: 'total', etiqueta: 'Mis Solicitudes', valor: todas.length, color: '#465FFF' },
        { icono: 'prog', etiqueta: 'Borradores', valor: todas.filter((s) => s.estado === 'borrador').length, color: '#64748b' },
        { icono: 'env', etiqueta: 'En Proceso', valor: todas.filter((s) => ESTADO_GRUPOS.pendientes.includes(s.estado)).length, color: '#0ea5e9' },
        { icono: 'ok', etiqueta: 'Finalizadas', valor: todas.filter((s) => ESTADO_GRUPOS.finalizados.includes(s.estado)).length, color: '#22c55e' },
      ];
    } else if (usuario.rol === 'departamento') {
      const recibidas = store.getSolicitudes({ departamentoDestinoId: usuario.departamentoId });
      cartas = [
        { icono: 'total', etiqueta: 'Recibidas', valor: recibidas.length, color: '#465FFF' },
        { icono: 'pen', etiqueta: 'Pendientes', valor: recibidas.filter((s) => ESTADO_GRUPOS.pendientes.includes(s.estado)).length, color: '#f59e0b' },
        { icono: 'rev', etiqueta: 'En Revisión', valor: recibidas.filter((s) => ESTADO_GRUPOS.enRevision.includes(s.estado)).length, color: '#0ea5e9' },
        { icono: 'ok', etiqueta: 'Finalizadas', valor: recibidas.filter((s) => ESTADO_GRUPOS.finalizados.includes(s.estado)).length, color: '#22c55e' },
      ];
    } else if (usuario.rol === 'contraloria') {
      const enEspera = todas.filter((s) => s.estado === 'en_contraloria' || s.estado === 'ajustes_requeridos').length;
      cartas = [
        { icono: 'wait', etiqueta: 'En Espera', valor: enEspera, color: '#f59e0b' },
        { icono: 'month', etiqueta: 'Revisadas', valor: todas.filter((s) => s.fechaAprobacionContraloria || s.fechaFinalizacion).length, color: '#465FFF' },
        { icono: 'avg', etiqueta: 'Tiempo Promedio', valor: `${tiempoPromedioDias(lista).toFixed(1)} días`, color: '#0ea5e9' },
        { icono: 'obs', etiqueta: 'Observaciones', valor: todas.filter((s) => s.estado === 'ajustes_requeridos').length, color: '#ef4444' },
      ];
    } else {
      cartas = [
        { icono: 'total', etiqueta: 'Total Solicitudes', valor: todas.length, color: '#465FFF' },
        { icono: 'pen', etiqueta: 'Pendientes', valor: pendientes, color: '#f59e0b' },
        { icono: 'ok', etiqueta: 'Aprobadas', valor: est.aprobado ?? 0, color: '#22c55e' },
        { icono: 'usr', etiqueta: 'Usuarios', valor: store.getUsuarios().length, color: '#0ea5e9' },
      ];
    }

    return { lista, cartas, dept: porDepartamento(lista), est, prio: porPrioridad(lista), eventos: eventos.slice(0, 8) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, version]);

  if (!usuario || !datos) return null;

  const deptNombres = datos.dept.map((d) => d[0]);
  const deptValores = datos.dept.map((d) => d[1]);
  const estadosNombres = Object.keys(datos.est);
  const estadosValores = estadosNombres.map((k) => datos.est[k]);
  const prioNombres = Object.keys(datos.prio);
  const prioValores = prioNombres.map((k) => datos.prio[k]);

  return (
    <div>
      <div className="grid grid-4">{datos.cartas.map((c, i) => <CartaStat key={i} {...c} />)}</div>
      <div className="grid grid-2-1">
        <div className="card">
          <div className="card-head"><h3>Solicitudes por Departamento</h3></div>
          <Grafica tipo="bar" series={[{ name: 'Solicitudes', data: deptValores }]} categorias={deptNombres} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Distribución por Estado</h3></div>
          <Grafica tipo="donut" donut series={estadosValores} etiquetas={estadosNombres.map((k) => ESTADOS[k as keyof typeof ESTADOS] ?? k)} leyenda="bottom" />
        </div>
      </div>
      <div className="grid grid-2-1">
        <div className="card">
          <div className="card-head"><h3>Actividad Reciente</h3></div>
          <Timeline
            items={datos.eventos.map((e) => ({
              fecha: e.fecha,
              usuarioNombre: e.usuarioNombre,
              comentario: `${e.num} ${e.comentario ? '— ' + e.comentario : ''}`,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-head"><h3>Prioridad</h3></div>
          <Grafica
            tipo="donut"
            donut
            series={prioValores}
            etiquetas={prioNombres.map((k) => PRIORIDADES[k as keyof typeof PRIORIDADES] ?? k)}
            colores={['#ef4444', '#f59e0b', '#22c55e']}
            leyenda="bottom"
          />
        </div>
      </div>
    </div>
  );
}
