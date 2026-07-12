import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Package,
  ArrowLeftRight,
  CalendarCheck,
  Wrench,
  ClipboardCheck,
  BarChart2,
  Bell,
  LogOut,
  Box,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard',          Icon: LayoutDashboard,  path: '/dashboard' },
  { label: 'Workspace Settings', Icon: Building2,         path: '/organization' },
  { label: 'Assets',             Icon: Package,           path: '/assets' },
  { label: 'Allocation',         Icon: ArrowLeftRight,    path: '/allocation' },
  { label: 'Bookings',           Icon: CalendarCheck,     path: '/bookings' },
  { label: 'Maintenance',        Icon: Wrench,            path: '/maintenance' },
  { label: 'Audit',              Icon: ClipboardCheck,    path: '/audit' },
  { label: 'Reports',            Icon: BarChart2,         path: '/reports' },
  { label: 'Notifications',      Icon: Bell,              path: '/notifications' },
];

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Box size={20} strokeWidth={2} />
        </div>
        <span className="sidebar-logo-name">AssetFlow</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ label, Icon, path }) => (
          <button
            key={path}
            className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
            onClick={() => navigate(path)}
            aria-current={isActive(path) ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={isActive(path) ? 2.5 : 2} aria-hidden="true" />
            <span className="sidebar-link-label">{label}</span>
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
          <LogOut size={18} strokeWidth={2} aria-hidden="true" />
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
