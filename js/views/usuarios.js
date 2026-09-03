/**
 * Vista: Gestión de Usuarios (solo admin). CRUD completo.
 */
const UsuariosView = {
  pageKey: 'usuarios',
  filtros: { buscar: '', rol: '', depto: '' },

  render(container) {
    this.container = container;
    container.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>Gestión de Usuarios</h3>
          <button class="btn btn-primary btn-sm" id="btnNuevo">+ Nuevo Usuario</button>
        </div>
        <div class="filtros"><div class="filter-inputs">
          <input id="flBuscar" placeholder="Buscar por nombre o email..." class="filter-control" value="${esc(this.filtros.buscar)}" />
          <select id="flRol" class="filter-control"><option value="">Rol: Todos</option>${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${this.filtros.rol === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <select id="flDepto" class="filter-control"><option value="">Departamento: Todos</option>${DataStore.getDepartamentos().map((d) => `<option value="${d.id}" ${String(this.filtros.depto) === String(d.id) ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select>
        </div></div>
        <div id="tablaWrap"></div>
        <div id="paginacionWrap"></div>
      </div>
    `;

    container.querySelector('#btnNuevo').addEventListener('click', () => this.formUsuario(null));
    container.querySelector('#flBuscar').addEventListener('input', (e) => { this.filtros.buscar = e.target.value; this.renderTabla(container); });
    container.querySelector('#flRol').addEventListener('change', (e) => { this.filtros.rol = e.target.value; this.renderTabla(container); });
    container.querySelector('#flDepto').addEventListener('change', (e) => { this.filtros.depto = e.target.value ? Number(e.target.value) : ''; this.renderTabla(container); });

    container.addEventListener('click', (e) => {
      const editar = e.target.closest('[data-ueditar]');
      const eliminar = e.target.closest('[data-ueliminar]');
      if (editar) this.formUsuario(Number(editar.dataset.ueditar));
      if (eliminar) this.eliminar(Number(eliminar.dataset.ueliminar));
    });

    this.renderTabla(container);
  },

  obtenerLista() {
    let lista = DataStore.getUsuarios();
    if (this.filtros.buscar) {
      const q = this.filtros.buscar.toLowerCase();
      lista = lista.filter((u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (this.filtros.rol) lista = lista.filter((u) => u.rol === this.filtros.rol);
    if (this.filtros.depto) lista = lista.filter((u) => u.departamentoId === this.filtros.depto);
    return lista;
  },

  renderTabla(container) {
    const lista = this.obtenerLista();
    const wrap = container.querySelector('#tablaWrap');
    if (!lista.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><p>No hay usuarios que coincidan.</p></div>`;
      container.querySelector('#paginacionWrap').innerHTML = '';
      return;
    }
    const pg = Pagination.page(lista, 10, this.pageKey);
    wrap.innerHTML = `
      <div class="table-scroll">
        <table class="table">
          <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Departamento</th><th>Cargo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${pg.slice.map((u) => `
              <tr>
                <td><div class="user-cell">${avatarHtml(u.nombre, u.id)}<span>${esc(u.nombre)}</span></div></td>
                <td>${esc(u.email)}</td>
                <td><span class="badge badge-outline">${ROLES[u.rol] || u.rol}</span></td>
                <td>${esc(u.departamentoNombre)}</td>
                <td>${esc(u.cargo || '—')}</td>
                <td>${u.activo !== false ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
                <td><div class="row-actions">
                  <button class="icon-btn" data-ueditar="${u.id}" title="Editar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16.86 4.14l3 3L6 21H3v-3L16.86 4.14z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
                  <button class="icon-btn danger-icon" data-ueliminar="${u.id}" title="Eliminar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
                </div></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.querySelector('#paginacionWrap').innerHTML = Pagination.render(this.pageKey, pg.totalPages, pg.page);
    Pagination.init(container.querySelector('#paginacionWrap'), this.pageKey, (p) => { Pagination.state[this.pageKey].page = p; this.renderTabla(container); });
  },

  formUsuario(id) {
    const u = id ? DataStore.getUsuario(id) : null;
    const deptos = DataStore.getDepartamentos();
    Modal.open(`
      <div class="modal-head"><h3>${u ? 'Editar' : 'Nuevo'} Usuario</h3><button class="icon-btn" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Nombre <span class="req">*</span></label><input id="uNombre" value="${u ? esc(u.nombre) : ''}" /></div>
          <div class="form-group"><label>Email <span class="req">*</span></label><input id="uEmail" type="email" value="${u ? esc(u.email) : ''}" /></div>
          <div class="form-group"><label>Rol <span class="req">*</span></label>
            <select id="uRol">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${u && u.rol === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label>Departamento <span class="req">*</span></label>
            <select id="uDepto"><option value="">Seleccione</option>${deptos.map((d) => `<option value="${d.id}" ${u && u.departamentoId === d.id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label>Cargo</label><input id="uCargo" value="${u ? esc(u.cargo || '') : ''}" /></div>
          <div class="form-group"><label>Contraseña ${u ? '(dejar en blanco para no cambiar)' : ''} <span class="req">*</span></label><input id="uPass" type="password" /></div>
          <div class="form-group col-span-2"><label><input type="checkbox" id="uActivo" ${!u || u.activo !== false ? 'checked' : ''} /> Usuario activo</label></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" data-close>Cancelar</button>
        <button class="btn btn-primary" id="uGuardar">${u ? 'Guardar cambios' : 'Crear usuario'}</button>
      </div>
    `).then(() => {});
    const backdrop = document.querySelector('.modal-backdrop:last-child');
    backdrop.querySelector('#uGuardar').addEventListener('click', () => this.guardarUsuario(backdrop, u));
  },

  guardarUsuario(backdrop, u) {
    const nombre = backdrop.querySelector('#uNombre').value.trim();
    const email = backdrop.querySelector('#uEmail').value.trim();
    const rol = backdrop.querySelector('#uRol').value;
    const deptoId = Number(backdrop.querySelector('#uDepto').value);
    const cargo = backdrop.querySelector('#uCargo').value.trim();
    const pass = backdrop.querySelector('#uPass').value;
    const activo = backdrop.querySelector('#uActivo').checked;

    const errores = [];
    if (!Validators.required(nombre)) errores.push('El nombre es obligatorio.');
    if (!Validators.email(email)) errores.push('Email inválido.');
    if (!deptoId) errores.push('Seleccione un departamento (obligatorio).');
    if (!u && !pass) errores.push('La contraseña es obligatoria para nuevos usuarios.');
    if (errores.length) { Toast.show(errores[0], 'error'); return; }

    const dato = u || {};
    dato.nombre = nombre;
    dato.email = email;
    dato.rol = rol;
    dato.departamentoId = deptoId;
    dato.cargo = cargo;
    dato.activo = activo;
    if (pass) dato.password = pass;

    // Restricción: no permitir desactivar el usuario actual.
    if (u && u.id === DataStore.getCurrentUser().id && !activo) {
      Toast.show('No puedes desactivar tu propia cuenta.', 'error');
      return;
    }

    DataStore.saveUsuario(dato);
    Toast.show(u ? 'Usuario actualizado.' : 'Usuario creado.');
    backdrop.remove();
    this.renderTabla(this.container || document.getElementById('content'));
  },

  eliminar(id) {
    const u = DataStore.getUsuario(id);
    if (u.id === DataStore.getCurrentUser().id) { Toast.show('No puedes eliminar tu propia cuenta.', 'error'); return; }
    Modal.confirm({ title: 'Eliminar usuario', message: `¿Eliminar a ${u.nombre}?`, confirmText: 'Eliminar', danger: true })
      .then((ok) => {
        if (!ok) return;
        DataStore.deleteUsuario(id);
        Toast.show('Usuario eliminado.');
        this.renderTabla(this.container || document.getElementById('content'));
      });
  },
};
