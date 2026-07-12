import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import api from './api';
import { useAuth } from './context/AuthContext';
import './Dashboard.css';
import './AppShell.css';

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const NOTIF_ICON = {
  INFO:    { cls: 'notif-icon-info',    icon: 'ti-info-circle', color: '#3b82f6' },
  WARNING: { cls: 'notif-icon-warning', icon: 'ti-alert-triangle', color: '#f59e0b' },
  SUCCESS: { cls: 'notif-icon-success', icon: 'ti-circle-check', color: '#10b981' },
  ERROR:   { cls: 'notif-icon-error',   icon: 'ti-circle-x', color: '#ef4444' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [astRes, mntRes, notRes, allocRes] = await Promise.all([
          api.get('/assets/'),
          api.get('/maintenance/').catch(() => ({ data: [] })),
          api.get('/notifications/').catch(() => ({ data: [] })),
          api.get('/allocations/').catch(() => ({ data: [] }))
        ]);
        setAssets(astRes.data);
        setMaintenance(mntRes.data);
        setNotifications(notRes.data);
        setAllocations(allocRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data');
      }
    }
    fetchData();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const kpis = {
    assetsAvailable: assets.filter((a) => a.status === 'AVAILABLE').length,
    assetsAllocated: assets.filter((a) => a.status === 'ALLOCATED').length,
    maintenanceToday: maintenance.filter((m) => m.status !== 'RESOLVED').length,
    upcomingReturns: allocations.length
  };

  const statusBars = [
    { label: 'Available', count: kpis.assetsAvailable, barCls: 'bar-green' },
    { label: 'Allocated', count: kpis.assetsAllocated, barCls: 'bar-blue' }
  ];

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={sidebarOpen ? 'sidebar open' : ''} style={sidebarOpen ? {} : undefined}>
        <Sidebar user={user} />
      </div>

      <div className="app-content">
        <header className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="ti ti-menu-2"></i>
          </button>
          <div className="dash-topbar-left">
            <span className="dash-welcome">{getGreeting()}, {user?.name} 👋</span>
            <span className="dash-welcome-sub">Here's an overview of your workspace.</span>
          </div>
          <div className="dash-topbar-right">
            <div className="dash-notif-wrapper">
              <button className="dash-notif-btn">
                <i className="ti ti-bell"></i>
                {unreadCount > 0 && <span className="dash-notif-badge">{unreadCount}</span>}
              </button>
              {/* Dropdown for Notifications */}
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">Recent Notifications</div>
                {notifications.length === 0 ? (
                  <div className="empty-state">No notifications</div>
                ) : (
                  notifications.map((n) => {
                    const ic = NOTIF_ICON[n.notification_type] || NOTIF_ICON.INFO;
                    return (
                      <div className="notif-dropdown-item" key={n.id}>
                        <div className="notif-dropdown-icon" style={{ backgroundColor: `${ic.color}20`, color: ic.color }}>
                          <i className={`ti ${ic.icon}`}></i>
                        </div>
                        <div className="notif-dropdown-content">
                          <div className="notif-dropdown-title" style={{ fontWeight: !n.is_read ? 700 : 500 }}>{n.title}</div>
                          <div className="notif-dropdown-msg">{n.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="dash-topbar-avatar">{initials}</div>
          </div>
        </header>

        <main className="dash-body">
          <section>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon-wrap kpi-icon-green"><i className="ti ti-package"></i></div>
                <span className="kpi-label">Available Assets</span>
                <span className="kpi-value">{kpis.assetsAvailable}</span>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-wrap kpi-icon-blue"><i className="ti ti-user-check"></i></div>
                <span className="kpi-label">Allocated Assets</span>
                <span className="kpi-value">{kpis.assetsAllocated}</span>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-wrap kpi-icon-amber"><i className="ti ti-tool"></i></div>
                <span className="kpi-label">Active Maintenance</span>
                <span className="kpi-value">{kpis.maintenanceToday}</span>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-wrap kpi-icon-red"><i className="ti ti-clock-hour-4"></i></div>
                <span className="kpi-label">Pending Returns</span>
                <span className="kpi-value">{kpis.upcomingReturns}</span>
              </div>
            </div>
          </section>

          <div className="dash-two-col">
            <section className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title"><i className="ti ti-alert-triangle"></i> Action Items</h2>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Overdue Return: MacBook Pro 16"</td>
                      <td><span style={{ color: '#ef4444', fontWeight: 600 }}>High</span></td>
                      <td>Pending</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Maintenance: Dell Monitor 27"</td>
                      <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>Medium</span></td>
                      <td>In Progress</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title"><i className="ti ti-chart-pie"></i> Asset Distribution</h2>
              </div>
              <div className="dash-card-body">
                {statusBars.map((s) => (
                  <div className="status-bar-row" key={s.label}>
                    <div className="status-bar-label">
                      <span>{s.label}</span>
                      <span>{s.count}</span>
                    </div>
                    <div className="status-bar-track">
                      <div className={`status-bar-fill ${s.barCls}`} style={{ width: `${(s.count / (10)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
