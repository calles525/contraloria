/**
 * Vista: Dashboard.
 * Muestra estadísticas según el rol, gráficos ApexCharts y actividad reciente.
 */
const DashboardView = {
  render(container) {
    const user = DataStore.getCurrentUser();
    const todas = DataStore.getSolicitudes({});
    // Visibilidad según rol.
    const lista = App.filtrarPorRol(todas);
    const porEstado = Stats.porEstado(lista);
    const pendientes = (porEstado.en_contraloria || 0) + (porEstado.en_revision_departamento || 0) + (porEstado.enviado || 0);
    const finalizadas = (porEstado.aprobado || 0) + (porEstado.rechazado || 0);
    const tiempoProm = Stats.tiempoPromedioDias(lista);

    container.innerHTML = `
      <div class="grid grid-4 stat-cards" id="statCards"></div>
      <div class="grid grid-2-1">
        <div class="card">
          <div class="card-head"><h3>Solicitudes por Departamento</h3></div>
          <div id="chartDept"></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Distribución por Estado</h3></div>
          <div id="chartEstado"></div>
        </div>
      </div>
      <div class="grid grid-2-1">
        <div class="card">
          <div class="card-head"><h3>Actividad Reciente</h3></div>
          <div id="actividadReciente"></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Prioridad de Solicitudes</h3></div>
          <div id="chartPrioridad"></div>
        </div>
      </div>
    `;

    // Tarjetas de estadísticas según rol.
    this.renderStats(container.querySelector('#statCards'), user, { lista, pendientes, finalizadas, tiempoProm, todas: lista.length, porEstado });

    // GRAFICO: solicitudes por departamento de origen
    const dept = Stats.porDepartamento(lista);
    Charts.render('chartDept', {
      type: 'bar',
      series: [{ name: 'Solicitudes', data: dept.map((d) => d[1]) }],
      xaxis: { categories: dept.map((d) => d[0]) },
      dataLabels: { enabled: false },
      plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    });

    // GRAFICO: distribución por estado (donut)
    const estadosEje = Object.keys(porEstado);
    Charts.render('chartEstado', {
      type: 'donut',
      series: estadosEje.map((k) => porEstado[k]),
      labels: estadosEje.map((k) => ESTADOS[k] || k),
      donut: true,
      legend: { position: 'bottom' },
    });

    // GRAFICO: prioridad
    const prio = Stats.porPrioridad(lista);
    Charts.render('chartPrioridad', {
      type: 'donut',
      series: Object.keys(prio).map((k) => prio[k]),
      labels: Object.keys(prio).map((k) => PRIORIDADES[k] || k),
      donut: true,
      legend: { position: 'bottom' },
      colors: [Charts.colors.danger, Charts.colors.warning, Charts.colors.success],
    });

    // Actividad reciente: unir historial y comentarios, ordenar por fecha.
    const eventos = [];
    lista.forEach((s) => {
      (s.historial || []).forEach((h) => eventos.push({ fecha: h.fecha, usuarioNombre: h.usuarioNombre, texto: h.comentario, estadoNuevo: h.estadoNuevo, num: s.numeroSolicitud }));
      (s.comentarios || []).forEach((c) => eventos.push({ fecha: c.fecha, usuarioNombre: c.usuarioNombre, texto: c.texto, num: s.numeroSolicitud }));
    });
    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const recientes = eventos.slice(0, 8);
    container.querySelector('#actividadReciente').innerHTML = timelineHtml(recientes.map((e) => ({
      ...e,
      comentario: `${e.num || ''} ${e.texto ? '— ' + e.texto : ''}`,
    })), { vacio: 'Aún no hay actividad.' });
  },

  renderStats(el, user, { lista, pendientes, finalizadas, tiempoProm, todas, porEstado }) {
    const cards = [];
    // Tarjetas dependen del rol.
    if (user.rol === 'solicitante') {
      const propias = DataStore.getSolicitudes({}).filter((s) => s.creadorId === user.id);
      cards.push(
        this.card('total', 'Mis Solicitudes', propias.length, '#465FFF'),
        this.card('prog', 'Borradores', propias.filter((s) => s.estado === 'borrador').length, '#64748b'),
        this.card('env', 'En Proceso', propias.filter((s) => ESTADO_GRUPOS.pendientes.includes(s.estado)).length, '#0ea5e9'),
        this.card('ok', 'Finalizadas', propias.filter((s) => ESTADO_GRUPOS.finalizados.includes(s.estado)).length, '#22c55e'),
      );
    } else if (user.rol === 'departamento') {
      const dept = user.departamentoId;
      const recibidas = DataStore.getSolicitudes({ departamentoDestinoId: dept });
      cards.push(
        this.card('total', 'Recibidas', recibidas.length, '#465FFF'),
        this.card('pen', 'Pendientes', recibidas.filter((s) => ESTADO_GRUPOS.pendientes.includes(s.estado)).length, '#f59e0b'),
        this.card('rev', 'En Revisión', recibidas.filter((s) => ESTADO_GRUPOS.enRevision.includes(s.estado)).length, '#0ea5e9'),
        this.card('ok', 'Finalizadas', recibidas.filter((s) => ESTADO_GRUPOS.finalizados.includes(s.estado)).length, '#22c55e'),
      );
    } else if (user.rol === 'contraloria') {
      const enContraloria = DataStore.getSolicitudes({}).filter((s) => s.estado === 'en_contraloria' || s.estado === 'ajustes_requeridos');
      cards.push(
        this.card('wait', 'En Espera', enContraloria.length, '#f59e0b'),
        this.card('month', 'Revisadas este mes', lista.filter((s) => s.fechaAprobacionContraloria || s.fechaFinalizacion).length, '#465FFF'),
        this.card('avg', 'Tiempo Promedio', `${tiempoProm.toFixed(1)} días`, '#0ea5e9'),
        this.card('obs', 'Observaciones', lista.filter((s) => s.estado === 'ajustes_requeridos').length, '#ef4444'),
      );
    } else {
      cards.push(
        this.card('total', 'Total Solicitudes', todas, '#465FFF'),
        this.card('pen', 'Pendientes', pendientes, '#f59e0b'),
        this.card('ok', 'Aprobadas', porEstado && porEstado.aprobado || 0, '#22c55e'),
        this.card('usr', 'Usuarios', DataStore.getUsuarios().length, '#0ea5e9'),
      );
    }
    el.innerHTML = cards.join('');
  },

  card(icon, label, value, color) {
    const icons = {
      total: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.8"/></svg>',
      prog: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      env: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      ok: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5 2a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" stroke-width="1.8"/></svg>',
      wait: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      month: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="1.8"/></svg>',
      avg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" stroke="currentColor" stroke-width="1.8"/></svg>',
      obs: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      pen: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" stroke-width="1.8"/></svg>',
      rev: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 4v5h5M20 20v-5h-5M4.6 9A8 8 0 0119.4 6M19.4 15A8 8 0 014.6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      usr: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="1.8"/></svg>',
    };
    return `
      <div class="stat-card" style="--accent:${color}">
        <div class="stat-icon">${icons[icon] || icons.total}</div>
        <div class="stat-info">
          <span class="stat-label">${esc(label)}</span>
          <span class="stat-value">${value}</span>
        </div>
      </div>`;
  },
};
