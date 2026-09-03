/**
 * Aplicación principal: arranque, autenticación, enrutador y sidebar.
 */

const App = {
  routes: [
    { id: 'dashboard', nombre: 'Dashboard', icon: 'dashboard' },
    { id: 'nueva', nombre: 'Nueva Solicitud', icon: 'nueva' },
    { id: 'mis-solicitudes', nombre: 'Mis Solicitudes', icon: 'list' },
    { id: 'recibidas', nombre: 'Solicitudes Recibidas', icon: 'inbox' },
    { id: 'contraloria', nombre: 'Panel de Contraloría', icon: 'shield' },
    { id: 'reportes', nombre: 'Reportes', icon: 'chart' },
    { id: 'usuarios', nombre: 'Usuarios', icon: 'users' },
    { id: 'departamentos', nombre: 'Departamentos', icon: 'building' },
    { id: 'perfil', nombre: 'Mi Perfil', icon: 'profile' },
  ],

  // Menú disponible según rol.
  menuPorRol: {
    solicitante: ['dashboard', 'nueva', 'mis-solicitudes', 'perfil'],
    departamento: ['dashboard', 'mis-solicitudes', 'recibidas', 'perfil'],
    contraloria: ['dashboard', 'mis-solicitudes', 'contraloria', 'perfil'],
    admin: ['dashboard', 'nueva', 'mis-solicitudes', 'recibidas', 'contraloria', 'reportes', 'usuarios', 'departamentos', 'perfil'],
  },

  icons: {
    dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    nueva: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    list: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    inbox: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18M7 15l4-4 3 3 5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="1.8"/></svg>',
    building: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V5l7 4 7-4v16M9 9h.01M9 13h.01M15 9h.01M15 13h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    profile: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="1.8"/></svg>',
  },

  // Definición de rutas hash: ruta base y acciones.
  init() {
    this.bindEvents();
    this.initTheme();
    this.buildDemoUsers();
    this.checkSession();
    window.addEventListener('hashchange', () => this.checkSession());
  },

  bindEvents() {
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.login(); });
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    document.getElementById('sidebarToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.body.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-route]');
      if (nav) {
        e.preventDefault();
        this.navigate(nav.dataset.route);
      }
    });
  },

  buildDemoUsers() {
    const div = document.getElementById('demoUsers');
    div.innerHTML = DataStore.getUsuarios().map((u) => `
      <button class="demo-user" data-login="${u.email}">
        <span class="avatar avatar-sm avatar-blue">${iniciales(u.nombre)}</span>
        <span>${esc(u.nombre)}<small>${ROLES[u.rol]}</small></span>
      </button>`).join('');
    div.querySelectorAll('[data-login]').forEach((b) =>
      b.addEventListener('click', () => { document.getElementById('loginEmail').value = b.dataset.login; document.getElementById('loginPassword').value = '1234'; })
    );
  },

  // --------------- AUTENTICACIÓN ---------------
  checkSession() {
    const user = DataStore.getCurrentUser();
    if (user) {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appRoot').classList.remove('hidden');
      this.buildSidebar(user);
      this.route();
    } else {
      document.getElementById('appRoot').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
    }
  },

  login() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;
    const user = DataStore.getUsuarios().find((u) => u.email.toLowerCase() === email && u.password === pass);
    if (!user || user.activo === false) {
      document.getElementById('loginError').classList.remove('hidden');
      return;
    }
    localStorage.setItem(DataStore.SESSION_KEY, String(user.id));
    document.getElementById('loginError').classList.add('hidden');
    this.checkSession();
    Toast.show(`Bienvenido, ${user.nombre.split(' ')[0]}.`);
  },

  logout() {
    localStorage.removeItem(DataStore.SESSION_KEY);
    this.checkSession();
    Toast.show('Sesión cerrada.', 'info');
  },

  // --------------- SIDEBAR ---------------
  buildSidebar(user) {
    const nav = document.getElementById('sidebarNav');
    const allowed = this.menuPorRol[user.rol] || ['dashboard', 'perfil'];
    nav.innerHTML = this.routes
      .filter((r) => allowed.includes(r.id))
      .map((r) => `
        <button class="nav-item" data-route="${r.id}">
          ${this.icons[r.icon]}
          <span>${r.nombre}</span>
        </button>`).join('');

    document.getElementById('sidebarUserName').textContent = user.nombre.split(' ')[0];
    document.getElementById('topbarUser').innerHTML = `
      <span class="avatar avatar-sm avatar-green">${iniciales(user.nombre)}</span>
      <span class="topbar-user-name">${esc(user.nombre)}</span>
    `;
  },

  // --------------- RUTEO ---------------
  navigate(route, id, extra) {
    let hash = `#/${route}`;
    if (id) hash += `/${id}`;
    if (extra) hash += `?edit=${extra}`;
    window.location.hash = hash;
  },

  route() {
    const hash = window.location.hash || '#/dashboard';
    const parts = hash.replace('#/', '').split('/');
    const base = parts[0] || 'dashboard';
    const id = parts[1];
    const query = hash.includes('?') ? hash.split('?')[1] : '';
    const editId = query && query.startsWith('edit=') ? Number(query.split('=')[1]) : null;

    const user = DataStore.getCurrentUser();
    if (!user) return;

    // Control de permisos: si el rol no puede ver la ruta, redirigir a dashboard.
    const allowed = this.menuPorRol[user.rol] || ['dashboard'];
    if (base !== 'detalle' && !allowed.includes(base) && base !== 'dashboard') {
      window.location.hash = '#/dashboard';
      return;
    }

    Charts.destroyAll();
    const container = document.getElementById('content');
    this.setTitle(base);
    this.setActiveNav(base);

    switch (base) {
      case 'dashboard': DashboardView.render(container); break;
      case 'nueva': {
        if (editId) NuevaView.precargarBorrador(editId);
        else NuevaView.render(container);
        break;
      }
      case 'mis-solicitudes': MisSolicitudesView.render(container); break;
      case 'recibidas':
        if (user.rol === 'departamento' || user.rol === 'admin') RecibidasView.render(container);
        else window.location.hash = '#/dashboard';
        break;
      case 'contraloria':
        if (user.rol === 'contraloria' || user.rol === 'admin') ContraloriaView.render(container);
        else window.location.hash = '#/dashboard';
        break;
      case 'reportes': ReportesView.render(container); break;
      case 'usuarios':
        if (user.rol === 'admin') UsuariosView.render(container);
        else window.location.hash = '#/dashboard';
        break;
      case 'departamentos':
        if (user.rol === 'admin') DepartamentosView.render(container);
        else window.location.hash = '#/dashboard';
        break;
      case 'perfil': PerfilView.render(container); break;
      case 'detalle': DetalleView.render(Number(id), container); break;
      default: DashboardView.render(container);
    }
  },

  setTitle(base) {
    const r = this.routes.find((x) => x.id === base);
    document.getElementById('pageTitle').textContent = r ? r.nombre : (base === 'detalle' ? 'Detalle de Solicitud' : 'SIGID');
  },

  setActiveNav(base) {
    document.querySelectorAll('#sidebarNav .nav-item').forEach((n) => {
      n.classList.toggle('active', n.dataset.route === base);
    });
  },

  // --------------- FILTRO POR ROL (para dashboards/reportes) ---------------
  filtrarPorRol(solicitudes) {
    const user = DataStore.getCurrentUser();
    if (user.rol === 'solicitante') return solicitudes.filter((s) => s.creadorId === user.id);
    if (user.rol === 'departamento') return solicitudes.filter((s) => s.departamentoDestinoId === user.departamentoId || s.departamentoOrigenId === user.departamentoId);
    if (user.rol === 'contraloria') return solicitudes.filter((s) => s.estado === 'en_contraloria' || s.estado === 'ajustes_requeridos' || s.estado === 'aprobado' || s.estado === 'rechazado');
    return solicitudes; // admin
  },

  refresh() {
    const user = DataStore.getCurrentUser();
    if (!user) return;
    this.buildSidebar(user);
    this.route();
  },

  // --------------- TEMA ---------------
  initTheme() {
    const saved = localStorage.getItem(DataStore.THEME_KEY);
    if (saved === 'dark') this.applyTheme(true);
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(DataStore.THEME_KEY, isDark ? 'dark' : 'light');
    this.applyTheme(isDark);
    Charts.destroyAll();
    this.route();
  },

  applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    document.getElementById('themeIconSun').classList.toggle('hidden', isDark);
    document.getElementById('themeIconMoon').classList.toggle('hidden', !isDark);
  },
};

// --------------- VISTA REPORTES (para admin) ---------------
const ReportesView = {
  render(container) {
    const todas = DataStore.getSolicitudes({});
    const porDept = Stats.porDepartamento(todas);
    const porEstado = Stats.porEstado(todas);
    const porTipo = {};
    todas.forEach((s) => { porTipo[s.tipo] = (porTipo[s.tipo] || 0) + 1; });
    const finalizadas = todas.filter((s) => s.estado === 'aprobado' || s.estado === 'rechazado');
    const tasaAprobacion = todas.length ? ((porEstado.aprobado || 0) / todas.length * 100).toFixed(1) : 0;

    container.innerHTML = `
      <div class="grid grid-3 stat-cards">
        <div class="stat-card" style="--accent:#465FFF"><div class="stat-icon">📊</div><div class="stat-info"><span class="stat-label">Total solicitudes</span><span class="stat-value">${todas.length}</span></div></div>
        <div class="stat-card" style="--accent:#22c55e"><div class="stat-icon">✅</div><div class="stat-info"><span class="stat-label">Tasa de aprobación</span><span class="stat-value">${tasaAprobacion}%</span></div></div>
        <div class="stat-card" style="--accent:#0ea5e9"><div class="stat-icon">⏱️</div><div class="stat-info"><span class="stat-label">Tiempo promedio</span><span class="stat-value">${Stats.tiempoPromedioDias(todas).toFixed(1)} días</span></div></div>
      </div>
      <div class="grid grid-2">
        <div class="card"><div class="card-head"><h3>Solicitudes por Departamento</h3></div><div id="rDept"></div></div>
        <div class="card"><div class="card-head"><h3>Solicitudes por Tipo</h3></div><div id="rTipo"></div></div>
      </div>
    `;

    Charts.render('rDept', {
      type: 'bar',
      series: [{ name: 'Solicitudes', data: porDept.map((d) => d[1]) }],
      xaxis: { categories: porDept.map((d) => d[0]) },
      dataLabels: { enabled: false },
      plotOptions: { bar: { borderRadius: 6 } },
    });
    Charts.render('rTipo', {
      type: 'donut',
      series: Object.values(porTipo),
      labels: Object.keys(porTipo).map((k) => TIPOS[k] || k),
      donut: true,
      legend: { position: 'bottom' },
    });
  },
};

// Registrar ReportesView en la ruta si no está definida en otro lado.
if (typeof ReportesView === 'object' && !window.__reportesDefined) { window.__reportesDefined = true; }

document.addEventListener('DOMContentLoaded', () => {
  DataStore.init();
  Modal.init();
  App.init();
});
