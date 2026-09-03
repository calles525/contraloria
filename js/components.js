/**
 * Componentes de UI reutilizables: toasts, modales, badges, gráficos,
 * tablas, timeline y utilidades visuales.
 */

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------------------------
const Toast = {
  show(message, type = 'success', title) {
    const cont = document.getElementById('toastContainer');
    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 11v5m0-8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${esc(title)}</div>` : ''}
        <div class="toast-message">${esc(message)}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
    cont.appendChild(el);
    const remove = () => el.remove();
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 4000);
  },
};

// ---------------------------------------------------------------------------
// MODAL DE CONFIRMACIÓN / DIÁLOGO GENÉRICO
// ---------------------------------------------------------------------------
const Modal = {
  root: null,

  init() {
    this.root = document.getElementById('modalRoot');
  },

  // Modal de confirmación. Devuelve una Promise<boolean>.
  confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
    return new Promise((resolve) => {
      const el = crearEl('div', 'modal-backdrop');
      el.innerHTML = `
        <div class="modal">
          <div class="modal-head">
            <h3>${esc(title)}</h3>
            <button class="icon-btn modal-close-x" data-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
          </div>
          <div class="modal-body">${esc(message || '')}</div>
          <div class="modal-foot">
            <button class="btn btn-outline" data-close>${esc(cancelText)}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${esc(confirmText)}</button>
          </div>
        </div>`;
      this.root.appendChild(el);
      el.querySelectorAll('[data-close]').forEach((b) =>
        b.addEventListener('click', () => { el.remove(); resolve(false); })
      );
      el.querySelector('[data-confirm]').addEventListener('click', () => { el.remove(); resolve(true); });
      el.addEventListener('click', (e) => {
        if (e.target === el) { el.remove(); resolve(false); }
      });
    });
  },

  // Modal con contenido HTML personalizado. Cierra y resuelve al cerrar.
  open(html) {
    return new Promise((resolve) => {
      const el = crearEl('div', 'modal-backdrop');
      el.innerHTML = `<div class="modal modal-lg">${html}</div>`;
      this.root.appendChild(el);
      el.addEventListener('click', (e) => {
        if (e.target === el || e.target.closest('[data-close]')) {
          el.remove();
          resolve();
        }
      });
    });
  },

  closeAll() {
    this.root.innerHTML = '';
  },
};

// ---------------------------------------------------------------------------
// BADGES
// ---------------------------------------------------------------------------
function estadoBadge(estado) {
  return `<span class="badge ${badgeColor(ESTADO_COLOR[estado] || 'slate')}">${esc(ESTADOS[estado] || estado)}</span>`;
}

function prioridadBadge(prioridad) {
  const dot = prioridad === 'alta' ? '●' : prioridad === 'media' ? '●' : '●';
  return `<span class="badge ${badgeColor(PRIORIDAD_COLOR[prioridad] || 'slate')}">${dot} ${esc(PRIORIDADES[prioridad] || prioridad)}</span>`;
}

function tipoBadge(tipo) {
  return `<span class="badge badge-outline">${esc(TIPOS[tipo] || tipo)}</span>`;
}

// Avatar circular con iniciales y color derivado del id.
function avatarHtml(nombre, id) {
  const colors = ['avatar-blue', 'avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-red'];
  const cls = colors[Math.abs(id || 0) % colors.length];
  return `<span class="avatar ${cls}">${esc(iniciales(nombre))}</span>`;
}

// ---------------------------------------------------------------------------
// GRÁFICOS (ApexCharts)
// ---------------------------------------------------------------------------
const Charts = {
  registry: [],
  colors: {
    primary: '#465FFF',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    slate: '#64748b',
  },

  dark() {
    return document.documentElement.classList.contains('dark');
  },

  render(elId, options) {
    const tipo = options.type || 'bar';
    const dark = this.dark();
    const textColor = dark ? '#9aa4b2' : '#637381';
    const gridColor = dark ? '#2d3850' : '#e7edf3';

    const chart = {
      type: tipo,
      fontFamily: 'Inter, sans-serif',
      foreColor: textColor,
      toolbar: { show: false },
      background: 'transparent',
      ...(options.chart || {}),
    };

    const chartOpts = {
      chart,
      series: options.series,
      colors: [this.colors.primary, this.colors.info, this.colors.warning, this.colors.success, this.colors.danger],
      grid: { borderColor: gridColor, strokeDashArray: 3 },
      ...(options.labels ? { labels: options.labels } : {}),
      ...(options.xaxis ? { xaxis: options.xaxis } : {}),
      ...(options.dataLabels ? { dataLabels: options.dataLabels } : {}),
      ...(options.legend ? { legend: options.legend } : {}),
      ...(options.tooltip ? { tooltip: options.tooltip } : {}),
      ...(options.plotOptions ? { plotOptions: options.plotOptions } : {}),
    };
    if (options.donut) {
      chartOpts.plotOptions = {
        pie: { donut: { labels: { show: true, total: { show: true, label: 'Total' } } } },
      };
    }
    const chartInstance = new ApexCharts(document.getElementById(elId), chartOpts);
    chartInstance.render();
    this.registry.push(chartInstance);
    return chartInstance;
  },

  destroyAll() {
    this.registry.forEach((c) => c && c.destroy());
    this.registry = [];
  },
};

// ---------------------------------------------------------------------------
// TABLA GENÉRICA CON PAGINACIÓN
// ---------------------------------------------------------------------------
const Pagination = {
  state: {},

  // Renderiza paginación y devuelve el slice de la lista para mostrar.
  page(items, pageSize, pageKey) {
    const st = (this.state[pageKey] = this.state[pageKey] || {
      page: 1, pageSize: pageSize || 10,
    });
    if (pageSize) st.pageSize = pageSize;
    if (st.page > Math.ceil(items.length / st.pageSize)) st.page = 1;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / st.pageSize));
    const start = (st.page - 1) * st.pageSize;
    const slice = items.slice(start, start + st.pageSize);
    return { slice, total, start, totalPages, page: st.page, pageSize: st.pageSize };
  },

  render(pageKey, totalPages, page, onPage) {
    const prev = `<button class="pg-btn" data-pg="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&laquo;</button>`;
    const next = `<button class="pg-btn" data-pg="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>&raquo;</button>`;
    let nums = '';
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - page) > 1) {
        if (i === 3) nums += `<span class="pg-ellipsis">…</span>`;
        continue;
      }
      nums += `<button class="pg-btn ${i === page ? 'pg-active' : ''}" data-pg="${i}">${i}</button>`;
    }
    return `<div class="pagination">${prev}${nums}${next}</div>`;
  },

  init(container, pageKey, onPage) {
    container.querySelectorAll('[data-pg]').forEach((b) => {
      b.addEventListener('click', () => {
        onPage(Number(b.dataset.pg));
      });
    });
  },
};

// ---------------------------------------------------------------------------
// TIMELINE (historial / actividad reciente)
// ---------------------------------------------------------------------------
function timelineHtml(items, opciones = {}) {
  if (!items || items.length === 0) return `<p class="empty-text">${esc(opciones.vacio || 'Sin registros')}</p>`;
  const colors = ['tl-blue', 'tl-green', 'tl-orange', 'tl-purple', 'tl-red'];
  return `<div class="timeline">${items.map((it, idx) => {
    const color = colors[idx % colors.length];
    return `
      <div class="tl-item">
        <div class="tl-dot ${color}"></div>
        <div class="tl-content">
          <div class="tl-head">
            <span class="tl-title">${esc(it.usuarioNombre || it.usuario || 'Sistema')}</span>
            <span class="tl-date">${formatearFecha(it.fecha)}</span>
          </div>
          <div class="tl-text">${esc(it.comentario || it.texto || '')}</div>
          ${it.estadoAnterior || it.estadoNuevo ? `
            <div class="tl-transition">
              ${it.estadoAnterior ? `<span class="badge badge-slate">${esc(ESTADOS[it.estadoAnterior] || it.estadoAnterior)}</span>` : ''}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              ${it.estadoNuevo ? `<span class="badge ${badgeColor(ESTADO_COLOR[it.estadoNuevo] || 'slate')}">${esc(ESTADOS[it.estadoNuevo] || it.estadoNuevo)}</span>` : ''}
            </div>` : ''}
        </div>
      </div>`;
  }).join('')}</div>`;
}

// ---------------------------------------------------------------------------
// ESTADÍSTICAS DEL DASHBOARD (helpers de agregación)
// ---------------------------------------------------------------------------
const Stats = {
  // Conteos por estado.
  porEstado(lista) {
    const map = {};
    lista.forEach((s) => { map[s.estado] = (map[s.estado] || 0) + 1; });
    return map;
  },

  // Conteos por departamento de origen.
  porDepartamento(lista) {
    const map = {};
    lista.forEach((s) => {
      const nombre = s.departamentoOrigenNombre || '—';
      map[nombre] = (map[nombre] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  },

  // Conteos por prioridad.
  porPrioridad(lista) {
    const map = {};
    lista.forEach((s) => { map[s.prioridad] = (map[s.prioridad] || 0) + 1; });
    return map;
  },

  // Tiempo promedio en días para finalizar (aprobado/rechazado).
  tiempoPromedioDias(lista) {
    const finalizadas = lista.filter((s) => s.fechaCreacion && (s.estado === 'aprobado' || s.estado === 'rechazado') && s.fechaFinalizacion);
    if (!finalizadas.length) return 0;
    const totalDias = finalizadas.reduce((acc, s) => {
      return acc + (new Date(s.fechaFinalizacion) - new Date(s.fechaCreacion)) / 86400000;
    }, 0);
    return totalDias / finalizadas.length;
  },
};
