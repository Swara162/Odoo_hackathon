import React from 'react';
import Sidebar from './Sidebar';
import './AppShell.css';

// Mock admin user — replace with real auth context / session data
const MOCK_USER = {
  id: 1,
  full_name: 'Admin User',
  email: 'admin@company.com',
  role: 'ADMIN',
};

export default function AppShell({ title, children }) {
  return (
    <div className="app-shell">
      <Sidebar user={MOCK_USER} />
      <div className="app-content">
        {/* Topbar */}
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Notifications">
              <i className="ti ti-bell" aria-hidden="true"></i>
            </button>
            <button className="topbar-icon-btn" title="Settings">
              <i className="ti ti-settings" aria-hidden="true"></i>
            </button>
          </div>
        </header>
        {/* Page content */}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
