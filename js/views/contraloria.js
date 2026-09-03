/**
 * Vista: Panel de Contraloría (rol 'contraloria' y visible para 'admin').
 * Tarjetas resumen + tabla de solicitudes en contraloría con acciones.
 */
const ContraloriaView = {
  filtros: { departamentoOrigenId: '', prioridad: '' },
  pageKey: 'contraloria',

  render(container) {
    this.container = container;
    const user = DataStore.getCurrentUser();
    const todas = DataStore.getSolicitudes({});
    const enEspera = todas.filter((s) => s.estado === 'en_contraloria' || s.estado === 'ajustes_requeridos');
    const revisadasMes = todas.filter((s) => {
      const f = s.fechaAprobacionContraloria || s.fechaFinalizacion;
      if (!f) return false;
      const d = new Date(f); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const tp = Stats.tiempoPromedioDias(todas);

    container.innerHTML = `
      <div class="grid grid-4 stat-cards" id="contraloriaCards"></div>
      <div class="card">
        <div class="card-head"><h3>Solicitudes en Contraloría</h3></div>
        <div class="filtros" id="filtros"></div>
        <div id="tablaWrap"></div>
        <div id="paginacionWrap"></div>
      </div>
    `;

    container.querySelector('#contraloriaCards').innerHTML = [
      DashboardViewSk.card('wait', 'En espera', enEspera.length, 'delay', '#f59e0b'),
      DashboardViewSk.card('month', 'Revisadas este mes', revisadasMes.length, 'month', '#465FFF'),
      DashboardViewSk.card('avg', 'Tiempo promedio', `${tp.toFixed(1)} días`, 'avg', '#0ea5e9'),
      DashboardViewSk.card('obs', 'Observaciones', todas.filter((s) => s.estado === 'ajustes_requeridos').length, 'obs', '#ef4444'),
    ].join('');

    this.renderFiltros(container);

    // Acciones delegadas.
    container.addEventListener('click', (e) => {
      const aprobar = e.target.closest('[data-caprobar]');
      const rechazar = e.target.closest('[data-crechazar]');
      const devolver = e.target.closest('[data-cdevolver]');
      const info = e.target.closest('[data-cinfo]');
      const observar = e.target.closest('[data-cobservar]');
      const ver = e.target.closest('[data-ver]');
      if (ver) App.navigate('detalle', ver.dataset.ver);
      if (aprobar) this.aprobarDefinitiva(Number(aprobar.dataset.caprobar));
      if (rechazar) this.rechazarDefinitiva(Number(rechazar.dataset.crechazar));
      if (devolver) this.devolver(Number(devolver.dataset.cdevolver));
      if (info) this.solicitarInfo(Number(info.dataset.cinfo));
      if (observar) this.observar(Number(observar.dataset.cobservar));
    });

    this.renderTabla(container);
  },

  obtenerLista() {
    let lista = DataStore.getSolicitudes({ estado: 'en_contraloria' });
    // Adicionalmente, las que están 'ajustes_requeridos' también las ve contraloría.
    lista = lista.concat(DataStore.getSolicitudes({ estado: 'ajustes_requeridos' }));
    if (this.filtros.departamentoOrigenId) lista = lista.filter((s) => s.departamentoOrigenId === this.filtros.departamentoOrigenId);
    if (this.filtros.prioridad) lista = lista.filter((s) => s.prioridad === this.filtros.prioridad);
    return lista;
  },

  renderFiltros(container) {
    const deptos = DataStore.getDepartamentos().filter((d) => d.nombre !== 'Contraloría');
    container.querySelector('#filtros').innerHTML = `
      <div class="filter-inputs">
        <select id="flDepto" class="filter-control">
          <option value="">Departamento origen: Todos</option>
          ${deptos.map((d) => `<option value="${d.id}" ${String(this.filtros.departamentoOrigenId) === String(d.id) ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}
        </select>
        <select id="flPri" class="filter-control">
          <option value="">Prioridad: Todas</option>
          ${Object.entries(PRIORIDADES).map(([k, v]) => `<option value="${k}" ${this.filtros.prioridad === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" id="flLimpiar">Limpiar</button>
      </div>
    `;
    container.querySelector('#flDepto').addEventListener('change', (e) => { this.filtros.departamentoOrigenId = e.target.value ? Number(e.target.value) : ''; this.renderTabla(container); });
    container.querySelector('#flPri').addEventListener('change', (e) => { this.filtros.prioridad = e.target.value; this.renderTabla(container); });
    container.querySelector('#flLimpiar').addEventListener('click', () => { this.filtros = { departamentoOrigenId: '', prioridad: '' }; this.renderFiltros(container); this.renderTabla(container); });
  },

  renderTabla(container) {
    const lista = this.obtenerLista();
    const wrap = container.querySelector('#tablaWrap');
    if (!lista.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>No hay solicitudes en espera de revisión de Contraloría.</p></div>`;
      container.querySelector('#paginacionWrap').innerHTML = '';
      return;
    }
    const pg = Pagination.page(lista, 10, this.pageKey);
    wrap.innerHTML = `
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr><th>Nº</th><th>Solicitante</th><th>Origen</th><th>Título</th><th>Prioridad</th><th>Tiempo espera</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${pg.slice.map((s) => {
              const tEsp = Math.floor((new Date() - new Date(s.fechaEnvio || s.fechaCreacion)) / 86400000);
              return `
              <tr>
                <td><span class="mono">${esc(s.numeroSolicitud)}</span></td>
                <td><div class="user-cell">${avatarHtml(s.creadorNombre, s.creadorId)}<span>${esc(s.creadorNombre)}</span></div></td>
                <td>${esc(s.departamentoOrigenNombre)}</td>
                <td><a class="link" href="#/detalle/${s.id}">${esc(s.titulo)}</a></td>
                <td>${prioridadBadge(s.prioridad)}</td>
                <td><span class="badge ${tEsp > 5 ? 'badge-danger' : 'badge-slate'}">${tEsp} d</span></td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn" data-ver="${s.id}" title="Ver"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg></button>
                    <button class="btn btn-success btn-xs" data-caprobar="${s.id}">Aprobar</button>
                    <button class="btn btn-danger btn-xs" data-crechazar="${s.id}">Rechazar</button>
                    <button class="btn btn-outline btn-xs" data-cdevolver="${s.id}">Devolver</button>
                    <button class="btn btn-outline btn-xs" data-cinfo="${s.id}">Info</button>
                    <button class="btn btn-outline btn-xs" data-cobservar="${s.id}">Observar</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.querySelector('#paginacionWrap').innerHTML = Pagination.render(this.pageKey, pg.totalPages, pg.page);
    Pagination.init(container.querySelector('#paginacionWrap'), this.pageKey, (p) => {
      Pagination.state[this.pageKey].page = p;
      this.renderTabla(container);
    });
  },

  conComentario(sol, titulo, accion, nuevoEstado, mensajeFinal, esDanger) {
    const container = this.container || document.getElementById('content');
    Modal.open(`
      <div class="modal-head"><h3>${esc(titulo)}</h3><button class="icon-btn" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="modal-body">
        <textarea id="modalComentario" rows="4" placeholder="Comentario obligatorio para esta acción..."></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" data-close>Cancelar</button>
        <button class="btn ${esDanger ? 'btn-danger' : 'btn-primary'}" id="modalConfirmar">${esc(accion)}</button>
      </div>
    `).then(() => {});
    const backdrop = document.querySelector('.modal-backdrop:last-child');
    backdrop.querySelector('#modalConfirmar').addEventListener('click', () => {
      const texto = backdrop.querySelector('#modalComentario').value.trim();
      if (!texto) { Toast.show('El comentario es obligatorio.', 'warning'); return; }
      const user = DataStore.getCurrentUser();
      const anterior = sol.estado;
      sol.estado = nuevoEstado;
      if (nuevoEstado === 'aprobado') sol.fechaAprobacionContraloria = DataStore.nowISO();
      sol.fechaFinalizacion = (nuevoEstado === 'aprobado' || nuevoEstado === 'rechazado') ? DataStore.nowISO() : sol.fechaFinalizacion;
      DataStore.addHistorial(sol, anterior, nuevoEstado, texto, user);
      DataStore.saveSolicitud(sol);
      Toast.show(mensajeFinal);
      backdrop.remove();
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  aprobarDefinitiva(id) {
    const sol = DataStore.getSolicitud(id);
    Modal.confirm({
      title: 'Aprobación definitiva',
      message: `¿Desea aprobar definitivamente la solicitud ${sol.numeroSolicitud}?`,
      confirmText: 'Aprobar definitivamente',
    }).then((ok) => {
      if (!ok) return;
      const user = DataStore.getCurrentUser();
      const anterior = sol.estado;
      sol.estado = 'aprobado';
      sol.fechaAprobacionContraloria = DataStore.nowISO();
      sol.fechaFinalizacion = DataStore.nowISO();
      DataStore.addHistorial(sol, anterior, 'aprobado', 'Aprobada definitivamente por Contraloría.', user);
      DataStore.saveSolicitud(sol);
      Toast.show('Solicitud aprobada definitivamente.');
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  rechazarDefinitiva(id) {
    const sol = DataStore.getSolicitud(id);
    this.conComentario(sol, 'Rechazar definitivamente', 'Rechazar', 'rechazado', 'Solicitud rechazada definitivamente.', true);
  },

  devolver(id) {
    const sol = DataStore.getSolicitud(id);
    this.conComentario(sol, 'Devolver al departamento', 'Devolver', 'en_revision_departamento', 'Solicitud devuelta al departamento.', false);
  },

  solicitarInfo(id) {
    const sol = DataStore.getSolicitud(id);
    this.conComentario(sol, 'Solicitar información adicional', 'Solicitar', 'en_contraloria', 'Se solicitó información adicional.', false);
  },

  observar(id) {
    const sol = DataStore.getSolicitud(id);
    this.conComentario(sol, 'Marcar como observado', 'Observar', 'ajustes_requeridos', 'Solicitud marcada como observada.', false);
  },
};

// Tarjetas del panel (reutiliza la lógica visual de dashboard).
const DashboardViewSk = {
  icons: {
    wait: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    month: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="1.8"/></svg>',
    avg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" stroke="currentColor" stroke-width="1.8"/></svg>',
    obs: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  },
  card(icon, label, value, cls, color) {
    return `
      <div class="stat-card" style="--accent:${color}">
        <div class="stat-icon">${this.icons[icon] || ''}</div>
        <div class="stat-info">
          <span class="stat-label">${esc(label)}</span>
          <span class="stat-value">${value}</span>
        </div>
      </div>`;
  },
};
