// Layout principal: sidebar con navegación por rol y topbar.
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { NAV, MENU_POR_ROL, ICONOS_NAV } from '../lib/navigation';
import { ROLES } from '../lib/constants';
import { useApp } from '../providers/AppProvider';
import { useTheme } from '../providers/ThemeProvider';
import { Avatar } from './Badge';

export function LayoutComponent() {
  const { usuario, logout } = useApp();
  const { modo, alternar } = useTheme();
  const [colapsado, setColapsado] = useState(false);

  if (!usuario) return null;

  const permitidas = MENU_POR_ROL[usuario.rol] ?? ['dashboard', 'perfil'];
  const items = NAV.filter((n) => permitidas.includes(n.id));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${colapsado ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m5.6 2A7.6 7.6 0 1111 6.4a7.6 7.6 0 018.6 5.6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="sidebar-title">SIGID</span>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.ruta}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={item.nombre}
            >
              {ICONOS_NAV[item.icono]}
              <span>{item.nombre}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/perfil" className="nav-item" title="Mi Perfil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>{usuario.nombre.split(' ')[0]}</span>
          </NavLink>
          <button type="button" className="nav-item" onClick={logout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 12H3m0 0l4 4m-4-4l4-4m6-4h5a1 1 0 011 1v14a1 1 0 01-1 1h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn sidebar-toggle"
            onClick={() => setColapsado((c) => !c)}
            aria-label="Alternar menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="topbar-page">
            <h2>Panel</h2>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-btn" onClick={alternar} title="Cambiar tema">
              {modo === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <NavLink to="/perfil" className="topbar-user">
              <Avatar nombre={usuario.nombre} id={usuario.id} tamano="sm" />
              <span className="topbar-user-name">
                {usuario.nombre} · {ROLES[usuario.rol]}
              </span>
            </NavLink>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
