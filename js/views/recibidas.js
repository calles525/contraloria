/**
 * Vista: Solicitudes Recibidas (solo para rol 'departamento').
 * Tabs: Todas | Pendientes | En revisión | Finalizadas.
 * Acciones: Tomar, Aprobar (→contraloría), Rechazar, Solicitar Ajustes, Reasignar.
 */
const RecibidasView = {
  tab: 'pendientes',
  pageKey: 'recibidas',

  render(container) {
    this.container = container;
    const user = DataStore.getCurrentUser();
    const recibidas = DataStore.getSolicitudes({ departamentoDestinoId: user.departamentoId });

    container.innerHTML = `
      <div class="card">
        <div class="card-head"><h3>Solicitudes Recibidas</h3></div>

        <div class="tabs" id="tabs">
          <button class="tab" data-tab="todas">Todas (${recibidas.length})</button>
          <button class="tab active" data-tab="pendientes">Pendientes (${recibidas.filter((s) => ESTADO_GRUPOS.pendientes.includes(s.estado)).length})</button>
          <button class="tab" data-tab="enrevision">En revisión (${recibidas.filter((s) => ESTADO_GRUPOS.enRevision.includes(s.estado)).length})</button>
          <button class="tab" data-tab="finalizadas">Finalizadas (${recibidas.filter((s) => ESTADO_GRUPOS.finalizados.includes(s.estado)).length})</button>
        </div>

        <div id="tablaWrap"></div>
        <div id="paginacionWrap"></div>
      </div>
    `;

    container.querySelector('#tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      this.tab = tab.dataset.tab;
      container.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
      this.renderTabla(container);
    });

    // Delegación de acciones de la fila.
    container.addEventListener('click', (e) => {
      const tomar = e.target.closest('[data-tomar]');
      const aprobar = e.target.closest('[data-aprobar]');
      const rechazar = e.target.closest('[data-rechazar]');
      const ajustes = e.target.closest('[data-ajustes]');
      const reasignar = e.target.closest('[data-reasignar]');
      const ver = e.target.closest('[data-ver]');
      if (ver) App.navigate('detalle', ver.dataset.ver);
      if (tomar) this.tomar(Number(tomar.dataset.tomar));
      if (aprobar) this.aprobar(Number(aprobar.dataset.aprobar));
      if (rechazar) this.rechazar(Number(rechazar.dataset.rechazar));
      if (ajustes) this.ajustes(Number(ajustes.dataset.ajustes));
      if (reasignar) this.reasignar(Number(reasignar.dataset.reasignar), e);
    });

    this.renderTabla(container);
  },

  obtenerLista() {
    const user = DataStore.getCurrentUser();
    let lista = DataStore.getSolicitudes({ departamentoDestinoId: user.departamentoId });
    if (this.tab === 'pendientes') lista = lista.filter((s) => ESTADO_GRUPOS.pendientes.includes(s.estado));
    else if (this.tab === 'enrevision') lista = lista.filter((s) => ESTADO_GRUPOS.enRevision.includes(s.estado));
    else if (this.tab === 'finalizadas') lista = lista.filter((s) => ESTADO_GRUPOS.finalizados.includes(s.estado));
    return lista;
  },

  renderTabla(container) {
    const lista = this.obtenerLista();
    const wrap = container.querySelector('#tablaWrap');
    if (!lista.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📬</div><p>No hay solicitudes recibidas en esta pestaña.</p></div>`;
      container.querySelector('#paginacionWrap').innerHTML = '';
      return;
    }

    const pg = Pagination.page(lista, 10, this.pageKey);
    wrap.innerHTML = `
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr><th>Nº</th><th>Solicitante</th><th>Origen</th><th>Título</th><th>Fecha</th><th>Estado</th><th>Asignado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${pg.slice.map((s) => {
              const noAsignada = !s.asignadoA;
              return `
              <tr>
                <td><span class="mono">${esc(s.numeroSolicitud)}</span></td>
                <td><div class="user-cell">${avatarHtml(s.creadorNombre, s.creadorId)}<span>${esc(s.creadorNombre)}</span></div></td>
                <td>${esc(s.departamentoOrigenNombre)}</td>
                <td><a class="link" href="#/detalle/${s.id}">${esc(s.titulo)}</a></td>
                <td>${DataStore.formatFechaCorta(s.fechaCreacion)}</td>
                <td>${estadoBadge(s.estado)}</td>
                <td>${s.asignadoANombre ? esc(s.asignadoANombre) : '<span class="muted">—</span>'}</td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn" data-ver="${s.id}" title="Ver"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg></button>
                    ${noAsignada && (s.estado === 'enviado') ? `<button class="btn btn-outline btn-xs" data-tomar="${s.id}">Tomar</button>` : ''}
                    ${(s.estado === 'enviado' || s.estado === 'ajustes_requeridos' || s.estado === 'en_revision_departamento') ? `<button class="btn btn-success btn-xs" data-aprobar="${s.id}">Aprobar</button>` : ''}
                    ${(s.estado === 'enviado' || s.estado === 'ajustes_requeridos' || s.estado === 'en_revision_departamento') ? `<button class="btn btn-danger btn-xs" data-rechazar="${s.id}">Rechazar</button>` : ''}
                    ${s.estado === 'enviado' || s.estado === 'ajustes_requeridos' ? `<button class="btn btn-outline btn-xs" data-ajustes="${s.id}">Ajustes</button>` : ''}
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

  tomar(id) {
    const sol = DataStore.getSolicitud(id);
    const user = DataStore.getCurrentUser();
    Modal.confirm({
      title: 'Tomar solicitud',
      message: `¿Desea asignarse la solicitud ${sol.numeroSolicitud} a su cuenta?`,
      confirmText: 'Tomar',
    }).then((ok) => {
      if (!ok) return;
      const anterior = sol.estado;
      sol.estado = 'en_revision_departamento';
      sol.asignadoA = user.id;
      sol.asignadoANombre = user.nombre;
      DataStore.addHistorial(sol, anterior, 'en_revision_departamento', `Solicitud tomada por ${user.nombre}.`, user);
      DataStore.saveSolicitud(sol);
      Toast.show('Solicitud asignada a tu cuenta.');
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  aprobar(id) {
    const sol = DataStore.getSolicitud(id);
    const user = DataStore.getCurrentUser();
    Modal.confirm({
      title: 'Aprobar y enviar a Contraloría',
      message: `¿Desea aprobar la solicitud ${sol.numeroSolicitud} y enviarla a Contraloría para su aprobación definitiva?`,
      confirmText: 'Aprobar',
    }).then((ok) => {
      if (!ok) return;
      const anterior = sol.estado;
      sol.estado = 'en_contraloria';
      sol.fechaRevisionDepartamento = DataStore.nowISO();
      DataStore.addHistorial(sol, anterior, 'en_contraloria', 'Aprobada por el departamento, enviada a Contraloría.', user);
      DataStore.saveSolicitud(sol);
      Toast.show('Solicitud aprobada y enviada a Contraloría.');
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  rechazar(id) {
    const sol = DataStore.getSolicitud(id);
    Modal.confirm({
      title: 'Rechazar solicitud',
      message: `¿Desea rechazar la solicitud ${sol.numeroSolicitud}? Se requiere un comentario.`,
      confirmText: 'Rechazar',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      this.agregarComentarioYAccion(sol, 'rechazado', 'Solicitud rechazada.');
    });
  },

  ajustes(id) {
    const sol = DataStore.getSolicitud(id);
    Modal.confirm({
      title: 'Solicitar ajustes',
      message: `¿Desea solicitar ajustes a la solicitud ${sol.numeroSolicitud}? El solicitante deberá corregirla.`,
      confirmText: 'Solicitar ajustes',
    }).then((ok) => {
      if (!ok) return;
      this.agregarComentarioYAccion(sol, 'ajustes_requeridos', 'Ajustes requeridos por el departamento.');
    });
  },

  agregarComentarioYAccion(sol, nuevoEstado, mensaje) {
    const container = this.container || document.getElementById('content');
    Modal.open(`
      <div class="modal-head"><h3>Comentario obligatorio</h3><button class="icon-btn" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="modal-body">
        <textarea id="modalComentario" rows="4" placeholder="Escriba el comentario para justificar esta acción..."></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" data-close>Cancelar</button>
        <button class="btn btn-primary" id="modalConfirmar">Confirmar</button>
      </div>
    `).then(() => {});
    const backdrop = document.querySelector('.modal-backdrop:last-child');
    backdrop.querySelector('#modalConfirmar').addEventListener('click', () => {
      const texto = backdrop.querySelector('#modalComentario').value.trim();
      if (!texto) { Toast.show('El comentario es obligatorio.', 'warning'); return; }
      const user = DataStore.getCurrentUser();
      const anterior = sol.estado;
      sol.estado = nuevoEstado;
      DataStore.addHistorial(sol, anterior, nuevoEstado, texto, user);
      DataStore.saveSolicitud(sol);
      Toast.show(mensaje);
      backdrop.remove();
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  reasignar(id, e) {
    e.preventDefault();
    const container = this.container || document.getElementById('content');
    const sol = DataStore.getSolicitud(id);
    const user = DataStore.getCurrentUser();
    const deptUser = DataStore.getUsuarios().filter((u) => u.departamentoId === user.departamentoId && u.activo);
    Modal.open(`
      <div class="modal-head"><h3>Reasignar solicitud</h3><button class="icon-btn" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="modal-body">
        <label>Asignar a</label>
        <select id="reasignarA" class="w-full">
          ${deptUser.map((u) => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary" id="reasignarOk">Reasignar</button></div>
    `).then(() => {});
    const backdrop = document.querySelector('.modal-backdrop:last-child');
    backdrop.querySelector('#reasignarOk').addEventListener('click', () => {
      const nuevoId = Number(backdrop.querySelector('#reasignarA').value);
      const nuevo = DataStore.getUsuario(nuevoId);
      if (sol.asignadoA !== nuevoId) {
        DataStore.addHistorial(sol, sol.estado, sol.estado, `Solicitud reasignada de ${sol.asignadoANombre || 'sin asignar'} a ${nuevo.nombre}.`, user);
      }
      sol.asignadoA = nuevoId;
      sol.asignadoANombre = nuevo.nombre;
      DataStore.saveSolicitud(sol);
      Toast.show('Solicitud reasignada.');
      backdrop.remove();
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },
};
