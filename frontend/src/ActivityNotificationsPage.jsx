import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import './ActivityNotificationsPage.css';
import './AppShell.css';

import api from './api';
import { useAuth } from './context/AuthContext';


export default function ActivityNotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [notRes, actRes] = await Promise.all([
          api.get('/notifications/').catch(() => ({ data: [] })),
          api.get('/audit/logs').catch(() => ({ data: [] })),
        ]);
        setNotifications(notRes.data);
        setActivity(actRes.data);
      } catch (err) {
        console.error('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const visibleActivity = useMemo(() => activity.filter((entry) => [entry.actor, entry.action, entry.entity, entry.detail].join(' ').toLowerCase().includes(search.toLowerCase())), [activity, search]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read').catch(() => {});
    } finally {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    }
  };
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`).catch(() => {});
    } finally {
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} />
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
                    <article key={item.id} className={`activity-card ${item.is_read ? '' : 'unread'}`} onClick={() => markRead(item.id)}>
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
