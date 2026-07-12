import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard',          icon: 'ti-layout-dashboard', path: '/dashboard' },
  { label: 'Organization Setup', icon: 'ti-building',         path: '/organization' },
  { label: 'Assets',             icon: 'ti-package',          path: '/assets' },
  { label: 'Allocation',         icon: 'ti-arrows-exchange',  path: '/allocation' },
  { label: 'Bookings',           icon: 'ti-calendar-event',   path: '/bookings' },
  { label: 'Maintenance',        icon: 'ti-tool',             path: '/maintenance' },
  { label: 'Audit',              icon: 'ti-clipboard-check',  path: '/audit' },
  { label: 'Reports',            icon: 'ti-chart-bar',        path: '/reports' },
  { label: 'Notifications',      icon: 'ti-bell',             path: '/notifications' },
];

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  const roleBadgeClass = {
    ADMIN: 'role-badge-admin',
    ASSET_MANAGER: 'role-badge-manager',
    DEPARTMENT_HEAD: 'role-badge-head',
    EMPLOYEE: 'role-badge-employee',
  }[user?.role] || 'role-badge-employee';

  const roleLabel = {
    ADMIN: 'Admin',
    ASSET_MANAGER: 'Asset Manager',
    DEPARTMENT_HEAD: 'Dept Head',
    EMPLOYEE: 'Employee',
  }[user?.role] || user?.role;

  function handleLogout() {
    // TODO: POST /auth/logout — clear session/token
    navigate('/login');
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <i className="ti ti-cube" aria-hidden="true"></i>
        </div>
        <span className="sidebar-logo-name">AssetFlow</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            <i className={`ti ${item.icon}`} aria-hidden="true"></i>
            <span className="sidebar-link-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.full_name || 'Admin User'}</div>
            <span className={`sidebar-role-badge ${roleBadgeClass}`}>{roleLabel}</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} aria-label="Log out">
          <i className="ti ti-logout" aria-hidden="true"></i>
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
