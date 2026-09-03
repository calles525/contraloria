/**
 * Vista: Detalle de Solicitud.
 * Encabezado con acciones (PDF, email, imprimir, historial) y tabs.
 */
const DetalleView = {
  tab: 'generales',
  container: null,

  render(id, container) {
    this.container = container;
    const sol = DataStore.getSolicitud(id);
    const user = DataStore.getCurrentUser();
    if (!sol) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Solicitud no encontrada.</p><button class="btn btn-primary btn-sm" data-route="dashboard">Volver</button></div>`;
      return;
    }
    this.sol = sol;

    // Permisos de acción según rol/estado (botones de aprobación según contexto).
    const puedeEditar = sol.estado === 'borrador' && sol.creadorId === user.id;

    container.innerHTML = `
      <div class="card detalle-card">
        <div class="detalle-header">
          <div class="detalle-title">
            <span class="mono detalle-num">${esc(sol.numeroSolicitud)}</span>
            ${estadoBadge(sol.estado)}
            ${prioridadBadge(sol.prioridad)}
          </div>
          <h2>${esc(sol.titulo)}</h2>
          <div class="detalle-meta">
            <span>${avatarHtml(sol.creadorNombre, sol.creadorId)} <strong>${esc(sol.creadorNombre)}</strong></span>
            <span>• Creada: ${DataStore.formatFecha(sol.fechaCreacion)}</span>
            <span>• Origen: ${esc(sol.departamentoOrigenNombre)}</span>
            <span>• Destino: ${esc(sol.departamentoDestinoNombre)}</span>
          </div>
        </div>

        <div class="detalle-actions">
          ${puedeEditar ? `<button class="btn btn-outline btn-sm" data-detalle-editar>Editar</button>` : ''}
          <button class="btn btn-outline btn-sm" data-detalle-pdf>Descargar PDF</button>
          <button class="btn btn-outline btn-sm" data-detalle-email>Enviar por email</button>
          <button class="btn btn-outline btn-sm" data-detalle-imprimir>Imprimir</button>
        </div>

        <div class="tabs" id="detalleTabs">
          <button class="tab active" data-tab="generales">Datos Generales</button>
          <button class="tab" data-tab="especificos">Datos Específicos</button>
          <button class="tab" data-tab="documentos">Documentos (${(sol.documentos || []).length})</button>
          <button class="tab" data-tab="historial">Historial</button>
          <button class="tab" data-tab="comentarios">Comentarios (${(sol.comentarios || []).length})</button>
        </div>
        <div id="detalleBody" class="detalle-body"></div>
      </div>
    `;

    container.querySelector('#detalleTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      this.tab = tab.dataset.tab;
      container.querySelectorAll('#detalleTabs .tab').forEach((t) => t.classList.toggle('active', t === tab));
      this.renderTab(container);
    });

    container.querySelector('[data-detalle-pdf]')?.addEventListener('click', () => this.descargarPdf());
    container.querySelector('[data-detalle-email]')?.addEventListener('click', () => this.enviarEmail());
    container.querySelector('[data-detalle-imprimir]')?.addEventListener('click', () => this.imprimir());
    container.querySelector('[data-detalle-editar]')?.addEventListener('click', () => App.navigate('nueva', null, sol.id));

    this.renderTab(container);
  },

  renderTab(container) {
    const body = container.querySelector('#detalleBody');
    const sol = this.sol;
    if (this.tab === 'generales') {
      body.innerHTML = `
        <div class="detalle-generales">
          <div class="info-field"><span class="rk">Tipo</span><span class="rv">${TIPOS[sol.tipo]}</span></div>
          <div class="info-field"><span class="rk">Descripción</span><span class="rv">${esc(sol.descripcion || '—')}</span></div>
          <div class="info-field"><span class="rk">Prioridad</span><span class="rv">${PRIORIDADES[sol.prioridad]}</span></div>
          <div class="info-field"><span class="rk">Fecha requerida</span><span class="rv">${sol.fechaRequerida ? DataStore.formatFecha(sol.fechaRequerida) : '—'}</span></div>
          <div class="info-field"><span class="rk">Departamento origen</span><span class="rv">${esc(sol.departamentoOrigenNombre)}</span></div>
          <div class="info-field"><span class="rk">Departamento destino</span><span class="rv">${esc(sol.departamentoDestinoNombre)}</span></div>
          <div class="info-field"><span class="rk">Asignado a</span><span class="rv">${sol.asignadoANombre ? esc(sol.asignadoANombre) : 'Sin asignar'}</span></div>
          <div class="info-field"><span class="rk">Fecha envío</span><span class="rv">${sol.fechaEnvio ? DataStore.formatFecha(sol.fechaEnvio) : '—'}</span></div>
          <div class="info-field"><span class="rk">Revisión depto.</span><span class="rv">${sol.fechaRevisionDepartamento ? DataStore.formatFecha(sol.fechaRevisionDepartamento) : '—'}</span></div>
          <div class="info-field"><span class="rk">Aprobación Contraloría</span><span class="rv">${sol.fechaAprobacionContraloria ? DataStore.formatFecha(sol.fechaAprobacionContraloria) : '—'}</span></div>
          <div class="info-field"><span class="rk">Finalización</span><span class="rv">${sol.fechaFinalizacion ? DataStore.formatFecha(sol.fechaFinalizacion) : '—'}</span></div>
          <div class="info-field col-span-2"><span class="rk">Última modificación</span><span class="rv">${DataStore.formatFecha(sol.ultimaModificacion)}</span></div>
        </div>`;
    } else if (this.tab === 'especificos') {
      const campos = TIPO_CAMPOS[sol.tipo] || [];
      const datos = sol.datosEspecificos || {};
      body.innerHTML = campos.length ? `
        <div class="detalle-generales">
          ${campos.map((c) => {
            const val = datos[c.key];
            let mostrar = val;
            if (c.type === 'money') mostrar = formatearMonto(val);
            return `<div class="info-field"><span class="rk">${c.label}</span><span class="rv">${mostrar ? esc(mostrar) : '—'}</span></div>`;
          }).join('')}
        </div>
      ` : `<p class="empty-text">Sin datos específicos para este tipo de solicitud.</p>`;
    } else if (this.tab === 'documentos') {
      const docs = sol.documentos || [];
      body.innerHTML = docs.length ? `
        <div class="doc-list">
          ${docs.map((d, i) => `
            <div class="doc-item">
              <span class="doc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
              <div class="doc-info"><span class="doc-name">${esc(d.nombre)}</span><span class="doc-meta">${esc(d.size)} • ${DataStore.formatFecha(d.fecha)}</span></div>
              <a class="btn btn-outline btn-xs" download="${esc(d.nombre)}">Descargar</a>
            </div>`).join('')}
        </div>
      ` : `<p class="empty-text">Esta solicitud no tiene documentos adjuntos.</p>`;
    } else if (this.tab === 'historial') {
      body.innerHTML = timelineHtml((sol.historial || []).slice().reverse(), { vacio: 'Sin historial.' });
    } else if (this.tab === 'comentarios') {
      body.innerHTML = `
        <div id="comentList"></div>
        <div class="coment-box">
          <textarea id="nuevoComent" rows="3" placeholder="Escriba un comentario..."></textarea>
          <button class="btn btn-primary btn-sm" id="btnComentar">Publicar</button>
        </div>
      `;
      this.renderComentarios(body);
      body.querySelector('#btnComentar').addEventListener('click', () => this.publicarComentario(body));
    }
  },

  renderComentarios(body) {
    const lista = (this.sol.comentarios || []).slice().reverse();
    body.querySelector('#comentList').innerHTML = lista.length ? lista.map((c) => `
      <div class="comentario">
        <div class="coment-head">
          ${avatarHtml(c.usuarioNombre, c.usuarioId)}
          <span class="coment-usuario">${esc(c.usuarioNombre)}</span>
          <span class="coment-fecha">${DataStore.formatFecha(c.fecha)}</span>
        </div>
        <div class="coment-texto">${esc(c.texto)}</div>
      </div>`).join('') : `<p class="empty-text">Sin comentarios.</p>`;
  },

  publicarComentario(body) {
    const texto = body.querySelector('#nuevoComent').value.trim();
    if (!texto) { Toast.show('Escriba un comentario.', 'warning'); return; }
    const user = DataStore.getCurrentUser();
    DataStore.addComentario(this.sol, texto, user);
    body.querySelector('#nuevoComent').value = '';
    this.renderComentarios(body);
    Toast.show('Comentario publicado.');
  },

  descargarPdf() {
    const sol = this.sol;
    if (typeof window.jspdf === 'undefined') { Toast.show('Librería PDF no disponible.', 'error'); return; }
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(16);
    doc.text('Solicitud Interdepartamental', 14, 18);
    doc.setFontSize(11);
    let y = 30;
    const lineas = [
      ['Número', sol.numeroSolicitud],
      ['Título', sol.titulo],
      ['Descripción', sol.descripcion],
      ['Tipo', TIPOS[sol.tipo]],
      ['Prioridad', PRIORIDADES[sol.prioridad]],
      ['Estado', ESTADOS[sol.estado]],
      ['Solicitante', sol.creadorNombre],
      ['Departamento origen', sol.departamentoOrigenNombre],
      ['Departamento destino', sol.departamentoDestinoNombre],
      ['Fecha creación', new Date(sol.fechaCreacion).toLocaleDateString('es-VE')],
    ];
    lineas.forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${k}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v), 60, y, { maxWidth: 130 });
      y += 8;
    });
    doc.save(`${sol.numeroSolicitud}.pdf`);
  },

  enviarEmail() {
    const link = `mailto:?subject=${encodeURIComponent(this.sol.numeroSolicitud + ' - ' + this.sol.titulo)}&body=${encodeURIComponent('Detalle de la solicitud ' + this.sol.numeroSolicitud + ':\n\nTítulo: ' + this.sol.titulo + '\nEstado: ' + ESTADOS[this.sol.estado] + '\n')}`;
    window.location.href = link;
    Toast.show('Abriendo cliente de correo...', 'info');
  },

  imprimir() {
    const sol = this.sol;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${sol.numeroSolicitud}</title>
      <style>body{font-family:sans-serif;padding:30px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style>
      </head><body>
      <h2>${sol.numeroSolicitud} — ${sol.titulo}</h2>
      <table>
        <tr><th>Estado</th><td>${ESTADOS[sol.estado]}</td><th>Prioridad</th><td>${PRIORIDADES[sol.prioridad]}</td></tr>
        <tr><th>Tipo</th><td colspan="3">${TIPOS[sol.tipo]}</td></tr>
        <tr><th>Solicitante</th><td>${sol.creadorNombre}</td><th>Origen</th><td>${sol.departamentoOrigenNombre}</td></tr>
        <tr><th>Destino</th><td colspan="3">${sol.departamentoDestinoNombre}</td></tr>
        <tr><th colspan="4">Descripción</th></tr>
        <tr><td colspan="4">${sol.descripcion}</td></tr>
      </table>
      </body></html>`);
    win.document.close();
    win.print();
  },
};
