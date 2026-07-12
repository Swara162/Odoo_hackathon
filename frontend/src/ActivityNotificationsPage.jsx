import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import './ActivityNotificationsPage.css';
import './AppShell.css';

const CURRENT_USER = {
  id: 1,
  full_name: 'Swara',
  role: 'ADMIN',
};

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Maintenance request approved', body: 'The projector request moved to assigned technicians.', created_at: '2026-07-11T08:30:00', read: false, channel: 'email' },
  { id: 2, title: 'Allocation due for return', body: 'Laptop assigned to Engineering is due tomorrow.', created_at: '2026-07-11T10:15:00', read: true, channel: 'in_app' },
  { id: 3, title: 'Audit cycle opened', body: 'A fresh verification cycle has been created for Operations.', created_at: '2026-07-10T11:45:00', read: false, channel: 'sms' },
];

const INITIAL_ACTIVITY = [
  { id: 1, actor: 'Swara', action: 'created', entity: 'asset', detail: 'MacBook Pro 16"', created_at: '2026-07-11T08:30:00' },
  { id: 2, actor: 'Priya', action: 'approved', entity: 'maintenance', detail: 'Projector repair request', created_at: '2026-07-11T09:10:00' },
  { id: 3, actor: 'Ravi', action: 'returned', entity: 'allocation', detail: 'Monitor 27"', created_at: '2026-07-10T12:00:00' },
];

export default function ActivityNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [activeTab, setActiveTab] = useState('notifications');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleActivity = useMemo(() => activity.filter((entry) => [entry.actor, entry.action, entry.entity, entry.detail].join(' ').toLowerCase().includes(search.toLowerCase())), [activity, search]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  const markRead = (id) => setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));

  return (
    <div className="app-shell">
      <Sidebar user={CURRENT_USER} />
      <div className="app-content">
        <main className="activity-page">
          <header className="activity-topbar">
            <div>
              <p className="activity-eyebrow">AssetFlow / Activity</p>
              <h1 className="activity-title">Activity & Notifications</h1>
            </div>
            <button className="activity-primary-btn" onClick={markAllRead}>Mark all as read</button>
          </header>

          {loading ? (
            <div className="activity-loading">Loading activity feed…</div>
          ) : (
            <div className="activity-shell">
              <div className="activity-tabs">
                <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>Notifications</button>
                <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>Activity log</button>
              </div>

              {activeTab === 'notifications' ? (
                <section className="activity-panel">
                  <div className="activity-panel-header">
                    <h2>Inbox</h2>
                    <span className="activity-pill">{unreadCount} unread</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="empty-state">No notifications</div>
                  ) : notifications.map((item) => (
                    <article key={item.id} className={`activity-card ${item.read ? '' : 'unread'}`} onClick={() => markRead(item.id)}>
                      <div className="activity-card-body">
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      <div className="activity-card-meta">
                        <span className="activity-chip">{item.channel}</span>
                        {!item.read && <span className="activity-dot" />}
                      </div>
                    </article>
                  ))}
                </section>
              ) : (
                <section className="activity-panel">
                  <div className="activity-panel-header">
                    <h2>Recent actions</h2>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search log" />
                  </div>
                  {visibleActivity.length === 0 ? (
                    <div className="empty-state">No matching activity</div>
                  ) : (
                    <div className="activity-table-wrap">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>Detail</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleActivity.map((entry) => (
                            <tr key={entry.id}>
                              <td>{entry.actor}</td>
                              <td>{entry.action}</td>
                              <td>{entry.entity}</td>
                              <td>{entry.detail}</td>
                              <td>{new Date(entry.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
