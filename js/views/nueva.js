/**
 * Vista: Nueva Solicitud (wizard de 3 pasos).
 * Paso 1: datos generales | Paso 2: datos específicos | Paso 3: documentos y revisión.
 */
const NuevaView = {
  // Formulario en construcción (borrador/borrador enviado).
  form: null,
  documentos: [],
  paso: 1,
  esBorrador: false,
  // drag & drop
  dragCounter: 0,

  reset() {
    this.form = {
      tipo: 'creacion_tercero',
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fechaRequerida: '',
      departamentoDestinoId: '',
      datosEspecificos: {},
    };
    this.documentos = [];
    this.paso = 1;
    this.esBorrador = false;
  },

  render(container) {
    this.reset();
    this.renderPaso1(container);
  },

  // Carga un borrador existente para edición.
  precargarBorrador(id) {
    const sol = DataStore.getSolicitud(id);
    const container = document.getElementById('content');
    if (!sol || sol.estado !== 'borrador') { App.navigate('mis-solicitudes'); return; }
    this.form = {
      tipo: sol.tipo,
      titulo: sol.titulo,
      descripcion: sol.descripcion,
      prioridad: sol.prioridad,
      fechaRequerida: sol.fechaRequerida,
      departamentoDestinoId: sol.departamentoDestinoId,
      datosEspecificos: sol.datosEspecificos || {},
    };
    this.documentos = sol.documentos || [];
    this.paso = 1;
    this.esBorrador = true;
    this.edicionId = id;
    this.renderPaso1(container);
  },

  renderPaso1(container) {
    const departamentos = DataStore.getDepartamentos().filter((d) => d.activo);
    const user = DataStore.getCurrentUser();
    container.innerHTML = `
      <div class="card">
        <div class="wizard-steps" id="wizardSteps">
          <div class="ws-step active" data-step="1"><span>1</span>Datos Generales</div>
          <div class="ws-step" data-step="2"><span>2</span>Datos Específicos</div>
          <div class="ws-step" data-step="3"><span>3</span>Documentos y Revisión</div>
        </div>

        <div class="wizard-body">
          <h3>Paso 1: Datos Generales</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Tipo de solicitud <span class="req">*</span></label>
              <select id="fTipo">${Object.keys(TIPOS).map((t) => `<option value="${t}">${TIPOS[t]}</option>`).join('')}</select>
            </div>
            <div class="form-group">
              <label>Departamento destino <span class="req">*</span></label>
              <select id="fDepto" class="disabled-placeholder">
                <option value="">Seleccione departamento</option>
                ${departamentos.map((d) => `<option value="${d.id}">${esc(d.nombre)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group col-span-2">
              <label>Título <span class="req">*</span></label>
              <input id="fTitulo" placeholder="Título descriptivo de la solicitud" value="${esc(this.form.titulo)}" />
            </div>
            <div class="form-group col-span-2">
              <label>Descripción <span class="req">*</span></label>
              <textarea id="fDesc" rows="3" placeholder="Describe el detalle general de la solicitud">${esc(this.form.descripcion)}</textarea>
            </div>
            <div class="form-group">
              <label>Prioridad <span class="req">*</span></label>
              <select id="fPrioridad">
                <option value="alta" ${this.form.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                <option value="media" ${this.form.prioridad === 'media' ? 'selected' : ''}>Media</option>
                <option value="baja" ${this.form.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha requerida</label>
              <input type="date" id="fFecha" value="${this.form.fechaRequerida}" />
            </div>
          </div>
        </div>

        <div class="wizard-actions">
          <button class="btn btn-outline" id="btnCancelar">Cancelar</button>
          <button class="btn btn-outline" id="btnGuardarBorrador">Guardar Borrador</button>
          <button class="btn btn-primary" id="btnSiguiente">Continuar <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
    `;
    this.bindPaso1(container);
  },

  bindPaso1(container) {
    this.container = container;
    container.querySelector('#btnCancelar').addEventListener('click', () => App.navigate('dashboard'));
    container.querySelector('#btnGuardarBorrador').addEventListener('click', () => this.guardarBorrador());
    container.querySelector('#btnSiguiente').addEventListener('click', () => this.irPaso2());
  },

  // Valida y almacena el paso 1, luego avanza.
  irPaso2() {
    const c = this.container;
    const form = this.form;
    form.tipo = c.querySelector('#fTipo').value;
    form.departamentoDestinoId = Number(c.querySelector('#fDepto').value);
    form.titulo = c.querySelector('#fTitulo').value.trim();
    form.descripcion = c.querySelector('#fDesc').value.trim();
    form.prioridad = c.querySelector('#fPrioridad').value;
    form.fechaRequerida = c.querySelector('#fFecha').value;

    const losErrores = [];
    if (!form.departamentoDestinoId) losErrores.push('Seleccione el departamento destino.');
    if (!Validators.required(form.titulo)) losErrores.push('El título es obligatorio.');
    if (!Validators.required(form.descripcion)) losErrores.push('La descripción es obligatoria.');

    if (losErrores.length) {
      Toast.show(losErrores[0], 'error');
      return;
    }
    this.renderPaso2(document.getElementById('content'));
  },

  guardarBorrador() {
    const c = this.container;
    const form = this.form;
    form.tipo = c.querySelector('#fTipo').value;
    form.departamentoDestinoId = Number(c.querySelector('#fDepto').value) || null;
    form.titulo = c.querySelector('#fTitulo').value.trim();
    form.descripcion = c.querySelector('#fDesc').value.trim();
    form.prioridad = c.querySelector('#fPrioridad').value;
    form.fechaRequerida = c.querySelector('#fFecha').value;

    const user = DataStore.getCurrentUser();
    let sol;
    if (this.edicionId) {
      sol = DataStore.getSolicitud(this.edicionId);
    } else {
      sol = {
        creadorId: user.id, creadorNombre: user.nombre,
        departamentoOrigenId: user.departamentoId, departamentoOrigenNombre: user.departamentoNombre,
        asignadoA: null, asignadoANombre: '',
        activo: true,
      };
    }
    Object.assign(sol, {
      tipo: form.tipo, titulo: form.titulo, descripcion: form.descripcion,
      prioridad: form.prioridad, fechaRequerida: form.fechaRequerida,
      departamentoDestinoId: form.departamentoDestinoId,
      departamentoDestinoNombre: form.departamentoDestinoId ? (DataStore.getDepartamento(form.departamentoDestinoId)?.nombre || '') : '',
      estado: 'borrador',
      datosEspecificos: form.datosEspecificos || {},
    });
    const ultimo = (sol.historial || []).length ? sol.historial[sol.historial.length - 1].estadoNuevo : null;
    if (!this.edicionId) DataStore.addHistorial(sol, null, 'borrador', 'Solicitud creada (borrador).', user);
    else if (ultimo !== 'borrador') DataStore.addHistorial(sol, ultimo, 'borrador', 'Solicitud guardada como borrador.', user);
    DataStore.saveSolicitud(sol);
    Toast.show('Borrador guardado correctamente.');
    App.navigate('mis-solicitudes');
  },

  renderPaso2(container) {
    const campos = TIPO_CAMPOS[this.form.tipo] || [];
    container.innerHTML = `
      <div class="card">
        <div class="wizard-steps" id="wizardSteps">
          <div class="ws-step done" data-step="1"><span>✓</span>Datos Generales</div>
          <div class="ws-step active" data-step="2"><span>2</span>Datos Específicos</div>
          <div class="ws-step" data-step="3"><span>3</span>Documentos y Revisión</div>
        </div>
        <div class="wizard-body">
          <h3>Paso 2: Datos Específicos — ${TIPOS[this.form.tipo]}</h3>
          <div class="form-grid" id="camposEspecificos">
            ${campos.map((c) => {
              const val = this.form.datosEspecificos[c.key] || '';
              if (c.type === 'textarea') {
                return `<div class="form-group col-span-2"><label>${c.label} ${c.required ? '<span class="req">*</span>' : ''}</label><textarea id="ce_${c.key}" rows="3">${esc(val)}</textarea></div>`;
              }
              if (c.type === 'select') {
                return `<div class="form-group"><label>${c.label} ${c.required ? '<span class="req">*</span>' : ''}</label><select id="ce_${c.key}">${c.options.map((o) => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
              }
              let inputType = c.type;
              if (c.type === 'money') inputType = 'number';
              return `<div class="form-group"><label>${c.label} ${c.required ? '<span class="req">*</span>' : ''}</label><input id="ce_${c.key}" type="${inputType === 'rif' || inputType === 'phone' || inputType === 'money' ? 'text' : inputType}" value="${esc(val)}" placeholder="${c.label}" /></div>`;
            }).join('')}
          </div>
        </div>
        <div class="wizard-actions">
          <button class="btn btn-outline" id="btnVolver"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0l5 5m-5-5l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Volver</button>
          <button class="btn btn-primary" id="btnPaso2Siguiente">Continuar <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
    `;
    container.querySelector('#btnVolver').addEventListener('click', () => this.renderPaso1(container));
    container.querySelector('#btnPaso2Siguiente').addEventListener('click', () => this.irPaso3(container));
  },

  irPaso3(container) {
    const datos = {};
    container.querySelectorAll('[id^="ce_"]').forEach((inp) => {
      datos[inp.id.replace('ce_', '')] = inp.value.trim();
    });
    const errores = validarCamposEspecificos(this.form.tipo, datos);
    if (errores.length) {
      // Mostrar errores acumulados en un toast (primero).
      errores.forEach((e, i) => i === 0 && Toast.show(e, 'error'));
      return;
    }
    this.form.datosEspecificos = datos;
    this.renderPaso3(container);
  },

  renderPaso3(container) {
    const user = DataStore.getCurrentUser();
    const depto = DataStore.getDepartamento(this.form.departamentoDestinoId);
    container.innerHTML = `
      <div class="card">
        <div class="wizard-steps" id="wizardSteps">
          <div class="ws-step done" data-step="1"><span>✓</span>Datos Generales</div>
          <div class="ws-step done" data-step="2"><span>✓</span>Datos Específicos</div>
          <div class="ws-step active" data-step="3"><span>3</span>Documentos y Revisión</div>
        </div>
        <div class="wizard-body">
          <h3>Paso 3: Documentos y Revisión</h3>

          <div class="dropzone" id="dropzone">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 8l5-5 5 5M12 3v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <p>Arrastra y suelta documentos aquí, o</p>
            <label class="btn btn-outline" for="fileInput">Elegir archivos</label>
            <input type="file" id="fileInput" multiple class="hidden" />
          </div>
          <div id="docList" class="doc-list"></div>

          <div class="resumen">
            <h4>Resumen de la solicitud</h4>
            <div class="resumen-grid">
              <div><span class="rk">Tipo</span><span class="rv">${TIPOS[this.form.tipo]}</span></div>
              <div><span class="rk">Destino</span><span class="rv">${depto ? depto.nombre : '—'}</span></div>
              <div><span class="rk">Título</span><span class="rv">${esc(this.form.titulo)}</span></div>
              <div><span class="rk">Prioridad</span><span class="rv">${PRIORIDADES[this.form.prioridad]}</span></div>
              <div><span class="rk">Fecha requerida</span><span class="rv">${this.form.fechaRequerida || '—'}</span></div>
              <div><span class="rk">Solicitante</span><span class="rv">${esc(user.nombre)} (${esc(user.departamentoNombre)})</span></div>
            </div>
          </div>
        </div>
        <div class="wizard-actions">
          <button class="btn btn-outline" id="btnVolver2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0l5 5m-5-5l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Volver</button>
          <button class="btn btn-primary" id="btnEnviar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Enviar Solicitud</button>
        </div>
      </div>
    `;

    this.renderDocList(container);
    this.bindStep3(container);
  },

  renderDocList(container) {
    const list = container.querySelector('#docList');
    if (!this.documentos.length) {
      list.innerHTML = `<p class="empty-text">Sin documentos adjuntos.</p>`;
      return;
    }
    list.innerHTML = this.documentos.map((d, i) => `
      <div class="doc-item">
        <span class="doc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
        <div class="doc-info"><span class="doc-name">${esc(d.nombre)}</span><span class="doc-meta">${esc(d.size)}</span></div>
        <button class="icon-btn doc-remove" data-i="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </div>`).join('');
    list.querySelectorAll('.doc-remove').forEach((b) =>
      b.addEventListener('click', () => {
        this.documentos.splice(Number(b.dataset.i), 1);
        this.renderDocList(container);
      })
    );
  },

  bindStep3(container) {
    container.querySelector('#btnVolver2').addEventListener('click', () => this.renderPaso2(container));
    container.querySelector('#btnEnviar').addEventListener('click', () => this.enviar());

    // Drag & drop
    const dz = container.querySelector('#dropzone');
    const fileInput = container.querySelector('#fileInput');
    ['dragenter', 'dragover'].forEach((ev) =>
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); })
    );
    ['dragleave', 'drop'].forEach((ev) =>
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dragover'); })
    );
    dz.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      Array.from(files).forEach((f) => this.addFile(f));
      this.renderDocList(container);
    });
    fileInput.addEventListener('change', () => {
      Array.from(fileInput.files).forEach((f) => this.addFile(f));
      fileInput.value = '';
      this.renderDocList(container);
    });
  },

  addFile(file) {
    const size = file.size > 1048576 ? (file.size / 1048576).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB';
    this.documentos.push({ nombre: file.name, size, fecha: new Date().toISOString() });
  },

  enviar() {
    const user = DataStore.getCurrentUser();
    let sol;
    if (this.edicionId) {
      sol = DataStore.getSolicitud(this.edicionId);
      Object.assign(sol, {
        tipo: this.form.tipo, titulo: this.form.titulo, descripcion: this.form.descripcion,
        prioridad: this.form.prioridad, fechaRequerida: this.form.fechaRequerida,
        departamentoDestinoId: this.form.departamentoDestinoId,
        departamentoDestinoNombre: DataStore.getDepartamento(this.form.departamentoDestinoId)?.nombre || '',
        datosEspecificos: this.form.datosEspecificos || {},
        documentos: this.documentos,
      });
    } else {
      sol = {
        tipo: this.form.tipo, titulo: this.form.titulo, descripcion: this.form.descripcion,
        prioridad: this.form.prioridad, fechaRequerida: this.form.fechaRequerida,
        departamentoDestinoId: this.form.departamentoDestinoId,
        departamentoDestinoNombre: DataStore.getDepartamento(this.form.departamentoDestinoId)?.nombre || '',
        estado: 'enviado',
        creadorId: user.id, creadorNombre: user.nombre,
        departamentoOrigenId: user.departamentoId, departamentoOrigenNombre: user.departamentoNombre,
        asignadoA: null, asignadoANombre: '',
        datosEspecificos: this.form.datosEspecificos || {},
        documentos: this.documentos,
        activo: true,
      };
    }
    const fecha = DataStore.nowISO();
    if (!this.edicionId) {
      sol.fechaEnvio = fecha;
      DataStore.addHistorial(sol, null, 'enviado', 'Solicitud enviada al departamento destino.', user);
    } else {
      const anterior = sol.estado || 'borrador';
      sol.estado = 'enviado';
      sol.fechaEnvio = sol.fechaEnvio || fecha;
      DataStore.addHistorial(sol, anterior, 'enviado', 'Solicitud enviada al departamento destino.', user);
    }
    DataStore.saveSolicitud(sol);
    Toast.show(`Solicitud ${sol.numeroSolicitud} enviada correctamente.`);
    App.navigate('mis-solicitudes');
  },
};
