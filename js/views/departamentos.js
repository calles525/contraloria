/**
 * Vista: Gestión de Departamentos (solo admin). CRUD completo.
 */
const DepartamentosView = {
  pageKey: 'deptos',
  filtros: { buscar: '' },

  render(container) {
    this.container = container;
    container.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>Gestión de Departamentos</h3>
          <button class="btn btn-primary btn-sm" id="btnNuevo">+ Nuevo Departamento</button>
        </div>
        <div class="filtros"><div class="filter-inputs">
          <input id="flBuscar" placeholder="Buscar departamento..." class="filter-control" value="${esc(this.filtros.buscar)}" />
        </div></div>
        <div id="tablaWrap"></div>
        <div id="paginacionWrap"></div>
      </div>
    `;

    container.querySelector('#btnNuevo').addEventListener('click', () => this.formDepto(null));
    container.querySelector('#flBuscar').addEventListener('input', (e) => { this.filtros.buscar = e.target.value; this.renderTabla(container); });
    container.addEventListener('click', (e) => {
      const editar = e.target.closest('[data-deditar]');
      const eliminar = e.target.closest('[data-deliminar]');
      if (editar) this.formDepto(Number(editar.dataset.deditar));
      if (eliminar) this.eliminar(Number(eliminar.dataset.deliminar));
    });

    this.renderTabla(container);
  },

  obtenerLista() {
    let lista = DataStore.getDepartamentos();
    if (this.filtros.buscar) {
      const q = this.filtros.buscar.toLowerCase();
      lista = lista.filter((d) => d.nombre.toLowerCase().includes(q) || (d.descripcion || '').toLowerCase().includes(q));
    }
    return lista;
  },

  renderTabla(container) {
    const lista = this.obtenerLista();
    const wrap = container.querySelector('#tablaWrap');
    if (!lista.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🏢</div><p>No hay departamentos.</p></div>`;
      container.querySelector('#paginacionWrap').innerHTML = '';
      return;
    }
    const pg = Pagination.page(lista, 10, this.pageKey);
    wrap.innerHTML = `
      <div class="table-scroll">
        <table class="table">
          <thead><tr><th>Departamento</th><th>Descripción</th><th>Responsable</th><th># Usuarios</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${pg.slice.map((d) => {
              const resp = d.responsableId ? DataStore.getUsuario(d.responsableId) : null;
              return `
              <tr>
                <td><strong>${esc(d.nombre)}</strong></td>
                <td>${esc(d.descripcion || '—')}</td>
                <td>${resp ? `<div class="user-cell">${avatarHtml(resp.nombre, resp.id)}<span>${esc(resp.nombre)}</span></div>` : '<span class="muted">Sin responsable</span>'}</td>
                <td>${(d.usuariosIds || []).length}</td>
                <td>${d.activo !== false ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
                <td><div class="row-actions">
                  <button class="icon-btn" data-deditar="${d.id}" title="Editar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16.86 4.14l3 3L6 21H3v-3L16.86 4.14z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
                  <button class="icon-btn danger-icon" data-deliminar="${d.id}" title="Eliminar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.querySelector('#paginacionWrap').innerHTML = Pagination.render(this.pageKey, pg.totalPages, pg.page);
    Pagination.init(container.querySelector('#paginacionWrap'), this.pageKey, (p) => { Pagination.state[this.pageKey].page = p; this.renderTabla(container); });
  },

  formDepto(id) {
    const d = id ? DataStore.getDepartamento(id) : null;
    const usuarios = DataStore.getUsuarios();
    Modal.open(`
      <div class="modal-head"><h3>${d ? 'Editar' : 'Nuevo'} Departamento</h3><button class="icon-btn" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group col-span-2"><label>Nombre <span class="req">*</span></label><input id="dNombre" value="${d ? esc(d.nombre) : ''}" /></div>
          <div class="form-group col-span-2"><label>Descripción</label><textarea id="dDesc" rows="3">${d ? esc(d.descripcion || '') : ''}</textarea></div>
          <div class="form-group col-span-2"><label>Responsable</label>
            <select id="dResp"><option value="">Sin responsable</option>${usuarios.map((us) => `<option value="${us.id}" ${d && d.responsableId === us.id ? 'selected' : ''}>${esc(us.nombre)}</option>`).join('')}</select>
          </div>
          <div class="form-group col-span-2"><label>Miembros del departamento</label>
            <div class="check-grid">${usuarios.map((us) => `<label class="check-item"><input type="checkbox" data-ud="" ${(d && d.usuariosIds || []).includes(us.id) ? 'checked' : ''} value="${us.id}"/> ${esc(us.nombre)}</label>`).join('')}</div>
          </div>
          <div class="form-group col-span-2"><label><input type="checkbox" id="dActivo" ${!d || d.activo !== false ? 'checked' : ''} /> Departamento activo</label></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" data-close>Cancelar</button>
        <button class="btn btn-primary" id="dGuardar">${d ? 'Guardar cambios' : 'Crear departamento'}</button>
      </div>
    `).then(() => {});
    const backdrop = document.querySelector('.modal-backdrop:last-child');
    backdrop.querySelector('#dGuardar').addEventListener('click', () => this.guardarDepto(backdrop, d));
  },

  guardarDepto(backdrop, d) {
    const nombre = backdrop.querySelector('#dNombre').value.trim();
    const desc = backdrop.querySelector('#dDesc').value.trim();
    const resp = Number(backdrop.querySelector('#dResp').value) || null;
    const activo = backdrop.querySelector('#dActivo').checked;
    const usuariosIds = Array.from(backdrop.querySelectorAll('[data-ud]:checked')).map((c) => Number(c.value));

    if (!nombre) { Toast.show('El nombre es obligatorio.', 'error'); return; }
    const dato = d || {};
    dato.nombre = nombre;
    dato.descripcion = desc;
    dato.responsableId = resp;
    dato.usuariosIds = usuariosIds;
    dato.activo = activo;

    DataStore.saveDepartamento(dato);
    Toast.show(d ? 'Departamento actualizado.' : 'Departamento creado.');
    backdrop.remove();
    App.refresh();
  },

  eliminar(id) {
    const d = DataStore.getDepartamento(id);
    Modal.confirm({ title: 'Eliminar departamento', message: `¿Eliminar el departamento "${d.nombre}"?`, confirmText: 'Eliminar', danger: true })
      .then((ok) => {
        if (!ok) return;
        DataStore.deleteDepartamento(id);
        Toast.show('Departamento eliminado.');
        this.renderTabla(this.container || document.getElementById('content'));
      });
  },
};
