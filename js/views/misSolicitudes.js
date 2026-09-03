/**
 * Vista: Mis Solicitudes.
 * Lista las solicitudes creadas por el usuario con filtros, paginación,
 * acciones por estado y exportación (CSV/Excel/PDF).
 */

const ExportHelpers = {
  columnas: ['numeroSolicitud', 'titulo', 'tipo', 'prioridad', 'estado', 'departamentoOrigenNombre', 'departamentoDestinoNombre', 'creadorNombre', 'fechaCreacion'],

  filas(lista) {
    return lista.map((s) => ({
      numeroSolicitud: s.numeroSolicitud,
      titulo: s.titulo,
      tipo: TIPOS[s.tipo] || s.tipo,
      prioridad: PRIORIDADES[s.prioridad] || s.prioridad,
      estado: ESTADOS[s.estado] || s.estado,
      departamentoOrigenNombre: s.departamentoOrigenNombre,
      departamentoDestinoNombre: s.departamentoDestinoNombre,
      creadorNombre: s.creadorNombre,
      fechaCreacion: new Date(s.fechaCreacion).toLocaleDateString('es-VE'),
    }));
  },

  csv(lista) {
    const datos = this.filas(lista);
    const cab = 'Nº, Título, Tipo, Prioridad, Estado, Origen, Destino, Solicitante, Fecha';
    const body = datos.map((d) =>
      [d.numeroSolicitud, d.titulo, d.tipo, d.prioridad, d.estado, d.departamentoOrigenNombre, d.departamentoDestinoNombre, d.creadorNombre, d.fechaCreacion]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    this.descargar('solicitudes.csv', '\uFEFF' + cab + '\n' + body, 'text/csv');
  },

  excel(lista) {
    if (typeof XLSX === 'undefined') { Toast.show('Librería XLSX no disponible.', 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(this.filas(lista));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
    XLSX.writeFile(wb, 'solicitudes.xlsx');
  },

  pdf(lista) {
    if (typeof window.jspdf === 'undefined') { Toast.show('Librería PDF no disponible.', 'error'); return; }
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(14);
    doc.text('Solicitudes Interdepartamentales', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-VE')}`, 14, 22);
    doc.autoTable({
      head: [['Nº', 'Título', 'Tipo', 'Prioridad', 'Estado', 'Origen', 'Destino']],
      body: this.filas(lista).map((d) => [d.numeroSolicitud, d.titulo, d.tipo, d.prioridad, d.estado, d.departamentoOrigenNombre, d.departamentoDestinoNombre]),
      startY: 28,
      styles: { fontSize: 8 },
    });
    doc.save('solicitudes.pdf');
  },

  descargar(nombre, contenido, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

const MisSolicitudesView = {
  filtros: { estado: '', tipo: '', departamentoDestinoId: '', prioridad: '', buscar: '', desde: '', hasta: '' },
  pageKey: 'mis',

  render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>Mis Solicitudes</h3>
          <div class="head-actions">
            <button class="btn btn-outline btn-sm" id="btnExportar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Exportar</button>
            <button class="btn btn-primary btn-sm" data-route="nueva">+ Nueva Solicitud</button>
          </div>
        </div>
        <div class="filtros" id="filtros"></div>
        <div id="tablaWrap"></div>
        <div class="paginacion-wrap"><div id="paginacion"></div></div>
      </div>
    `;

    this.renderFiltros(container);
    container.querySelector('#btnExportar').addEventListener('click', () => this.menuExportar(container));

    // Delegación global para acciones de fila (ver, editar, eliminar, enviar, pdf).
    container.addEventListener('click', (e) => {
      const ver = e.target.closest('[data-ver]');
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      const enviar = e.target.closest('[data-enviar]');
      const pdf = e.target.closest('[data-pdf]');
      const exportar = e.target.closest('[data-export]');
      if (ver) App.navigate('detalle', ver.dataset.ver);
      if (edit) this.editar(e, Number(edit.dataset.edit));
      if (del) this.eliminar(Number(del.dataset.del));
      if (enviar) this.enviar(Number(enviar.dataset.enviar));
      if (pdf) this.descargarPdf(Number(pdf.dataset.pdf));
      if (exportar) { e.preventDefault(); ExportHelpers[exportar.dataset.export](this.listaActual); }
    });

    this.pagina = 1;
    this.renderTabla(container);
  },

  menuExportar(container) {
    Modal.open(`
      <div class="modal-head"><h3>Exportar solicitudes</h3><button class="icon-btn" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="modal-body">
        <p>Elija el formato de exportación para <strong>${this.listaActual.length}</strong> solicitudes:</p>
        <div class="export-opts" data-fmt="csv">📄 CSV</div>
        <div class="export-opts" data-fmt="excel">📊 Excel</div>
        <div class="export-opts" data-fmt="pdf">📑 PDF</div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" data-close>Cancelar</button></div>
    `).then(() => {});
    // Re-enganchar selects después de abrir
    setTimeout(() => {
      const backdrop = document.querySelector('.modal-backdrop:last-child');
      if (!backdrop) return;
      backdrop.querySelectorAll('.export-opts').forEach((b) => {
        b.addEventListener('click', () => {
          ExportHelpers[b.dataset.fmt](this.listaActual);
          backdrop.remove();
        });
      });
    }, 0);
  },

  filtrosValidos() {
    // Devuelve los filtros de solicitudes (respetando rol: solo sus creadas).
    const user = DataStore.getCurrentUser();
    const base = { ...this.filtros, ...(user.rol === 'solicitante' ? {} : {}) };
    return base;
  },

  obtenerLista() {
    const user = DataStore.getCurrentUser();
    // Solo solicitudes creadas por el usuario.
    let lista = DataStore.getSolicitudes(this.filtros).filter((s) => s.creadorId === user.id && s.activo !== false);
    this.listaActual = lista;
    return lista;
  },

  renderFiltros(container) {
    const estados = Object.entries(ESTADOS);
    const departamentos = DataStore.getDepartamentos();
    container.querySelector('#filtros').innerHTML = `
      <div class="filter-inputs">
        <input id="flBuscar" placeholder="Buscar..." class="filter-control" value="${esc(this.filtros.buscar)}" />
        <select id="flEstado" class="filter-control">
          <option value="">Estado: Todos</option>
          ${estados.map(([k, v]) => `<option value="${k}" ${this.filtros.estado === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select id="flTipo" class="filter-control">
          <option value="">Tipo: Todos</option>
          ${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}" ${this.filtros.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select id="flDestino" class="filter-control">
          <option value="">Destino: Todos</option>
          ${departamentos.map((d) => `<option value="${d.id}" ${String(this.filtros.departamentoDestinoId) === String(d.id) ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}
        </select>
        <select id="flPrioridad" class="filter-control">
          <option value="">Prioridad: Todas</option>
          ${Object.entries(PRIORIDADES).map(([k, v]) => `<option value="${k}" ${this.filtros.prioridad === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" id="flLimpiar">Limpiar</button>
      </div>
    `;
    container.querySelector('#flBuscar').addEventListener('input', (e) => { this.filtros.buscar = e.target.value; this.pagina = 1; this.renderTabla(container); });
    container.querySelector('#flEstado').addEventListener('change', (e) => { this.filtros.estado = e.target.value; this.pagina = 1; this.renderTabla(container); });
    container.querySelector('#flTipo').addEventListener('change', (e) => { this.filtros.tipo = e.target.value; this.pagina = 1; this.renderTabla(container); });
    container.querySelector('#flDestino').addEventListener('change', (e) => { this.filtros.departamentoDestinoId = e.target.value ? Number(e.target.value) : ''; this.pagina = 1; this.renderTabla(container); });
    container.querySelector('#flPrioridad').addEventListener('change', (e) => { this.filtros.prioridad = e.target.value; this.pagina = 1; this.renderTabla(container); });
    container.querySelector('#flLimpiar').addEventListener('click', () => {
      this.filtros = { estado: '', tipo: '', departamentoDestinoId: '', prioridad: '', buscar: '', desde: '', hasta: '' };
      this.pagina = 1;
      this.renderFiltros(container);
      this.renderTabla(container);
    });
  },

  renderTabla(container) {
    const lista = this.obtenerLista();
    const pageSize = this.pageSize || 10;
    const pg = Pagination.page(lista, pageSize, this.pageKey);
    const wrap = container.querySelector('#tablaWrap');
    const user = DataStore.getCurrentUser();

    if (!lista.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No hay solicitudes que coincidan con los filtros.</p><button class="btn btn-primary btn-sm" data-route="nueva">Crear nueva solicitud</button></div>`;
      container.querySelector('#paginacion').innerHTML = '';
      return;
    }

    wrap.innerHTML = `
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Nº</th><th>Título</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Destino</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${pg.slice.map((s) => {
              const puedeEditar = s.estado === 'borrador';
              return `
              <tr>
                <td><span class="mono">${esc(s.numeroSolicitud)}</span></td>
                <td><a class="link" href="#/detalle/${s.id}">${esc(s.titulo)}</a></td>
                <td>${tipoBadge(s.tipo)}</td>
                <td>${prioridadBadge(s.prioridad)}</td>
                <td>${estadoBadge(s.estado)}</td>
                <td>${esc(s.departamentoDestinoNombre)}</td>
                <td>${DataStore.formatFechaCorta(s.fechaCreacion)}</td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn" data-ver="${s.id}" title="Ver"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg></button>
                    ${puedeEditar ? `<button class="icon-btn" data-edit="${s.id}" title="Editar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16.86 4.14l3 3L6 21H3v-3L16.86 4.14z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>` : ''}
                    ${puedeEditar ? `<button class="icon-btn" data-enviar="${s.id}" title="Enviar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>` : ''}
                    ${puedeEditar ? `<button class="icon-btn danger-icon" data-del="${s.id}" title="Eliminar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>` : ''}
                    <button class="icon-btn" data-pdf="${s.id}" title="Descargar PDF"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="table-count">Mostrando ${pg.start + 1}-${pg.start + pg.slice.length} de ${pg.total}</span>
        <div class="page-size">
          <label>Mostrar</label>
          <select id="pageSize">
            <option value="10" ${pg.pageSize === 10 ? 'selected' : ''}>10</option>
            <option value="25" ${pg.pageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${pg.pageSize === 50 ? 'selected' : ''}>50</option>
          </select>
        </div>
      </div>
    `;

    container.querySelector('#paginacion').innerHTML = Pagination.render(this.pageKey, pg.totalPages, pg.page, (p) => {});
    Pagination.init(container.querySelector('#paginacion'), this.pageKey, (p) => {
      this.pagina = p;
      Pagination.state[this.pageKey].page = p;
      this.renderTabla(container);
    });
    container.querySelector('#pageSize').addEventListener('change', (e) => {
      this.pageSize = Number(e.target.value);
      this.pagina = 1;
      this.renderTabla(container);
    });
  },

  // Editar: redirige al wizard con el borrador precargado.
  editar(e, id) {
    e.preventDefault();
    App.navigate('nueva', null, id);
  },

  enviar(id) {
    const sol = DataStore.getSolicitud(id);
    const user = DataStore.getCurrentUser();
    Modal.confirm({
      title: 'Enviar solicitud',
      message: `¿Desea enviar la solicitud ${sol.numeroSolicitud} al departamento ${sol.departamentoDestinoNombre}?`,
      confirmText: 'Enviar',
    }).then((ok) => {
      if (!ok) return;
      const anterior = sol.estado;
      sol.estado = 'enviado';
      sol.fechaEnvio = DataStore.nowISO();
      DataStore.addHistorial(sol, anterior, 'enviado', 'Solicitud enviada.', user);
      DataStore.saveSolicitud(sol);
      Toast.show(`Solicitud ${sol.numeroSolicitud} enviada.`);
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  eliminar(id) {
    const sol = DataStore.getSolicitud(id);
    Modal.confirm({
      title: 'Eliminar solicitud',
      message: `¿Está seguro que desea eliminar la solicitud ${sol.numeroSolicitud}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      DataStore.deleteSolicitud(id);
      Toast.show('Solicitud eliminada.');
      this.renderTabla(this.container || document.getElementById('content'));
    });
  },

  descargarPdf(id) {
    const sol = DataStore.getSolicitud(id);
    if (!sol) return;
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
};
