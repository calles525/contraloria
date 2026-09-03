/**
 * Vista: Mi Perfil.
 * Muestra los datos del usuario conectado y permite editar nombre, cargo y contraseña.
 */
const PerfilView = {
  render(container) {
    const user = DataStore.getCurrentUser();
    const dept = DataStore.getDepartamento(user.departamentoId);
    container.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><h3>Mi Perfil</h3></div>
          <div class="perfil-head">
            <span class="avatar avatar-xl avatar-blue">${iniciales(user.nombre)}</span>
            <div>
              <h3>${esc(user.nombre)}</h3>
              <p class="muted">${ROLES[user.rol]} • ${esc(user.cargo || '—')}</p>
            </div>
          </div>
          <div class="detalle-generales">
            <div class="info-field"><span class="rk">Email</span><span class="rv">${esc(user.email)}</span></div>
            <div class="info-field"><span class="rk">Departamento</span><span class="rv">${dept ? esc(dept.nombre) : '—'}</span></div>
            <div class="info-field"><span class="rk">Rol</span><span class="rv">${ROLES[user.rol]}</span></div>
            <div class="info-field"><span class="rk">Cargo</span><span class="rv">${esc(user.cargo || '—')}</span></div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Editar mis datos</h3></div>
          <div class="form-grid">
            <div class="form-group col-span-2"><label>Nombre completo</label><input id="pNombre" value="${esc(user.nombre)}" /></div>
            <div class="form-group col-span-2"><label>Cargo</label><input id="pCargo" value="${esc(user.cargo || '')}" /></div>
            <div class="form-group col-span-2"><label>Nueva contraseña (dejar en blanco para no cambiar)</label><input id="pPass" type="password" /></div>
            <div class="form-group col-span-2"><label>Confirmar contraseña</label><input id="pPass2" type="password" /></div>
            <div class="form-group col-span-2"><button class="btn btn-primary" id="pGuardar">Guardar cambios</button></div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#pGuardar').addEventListener('click', () => this.guardar());
  },

  guardar() {
    const user = DataStore.getCurrentUser();
    const nombre = $id('pNombre').value.trim();
    const cargo = $id('pCargo').value.trim();
    const pass = $id('pPass').value;
    const pass2 = $id('pPass2').value;

    if (!nombre) { Toast.show('El nombre es obligatorio.', 'error'); return; }
    if (pass && pass.length < 4) { Toast.show('La contraseña debe tener al menos 4 caracteres.', 'error'); return; }
    if (pass !== pass2) { Toast.show('Las contraseñas no coinciden.', 'error'); return; }

    user.nombre = nombre;
    user.cargo = cargo;
    if (pass) user.password = pass;
    DataStore.saveUsuario({ ...user });
    Toast.show('Perfil actualizado.');
    App.refresh();
  },
};
