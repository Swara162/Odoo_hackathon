import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import './MaintenancePage.css';
import './AppShell.css';

import api from './api';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';

const STATUS_CLASS = {
  PENDING: 'status-amber',
  APPROVED: 'status-blue',
  IN_PROGRESS: 'status-violet',
  RESOLVED: 'status-green',
  REJECTED: 'status-red',
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [form, setForm] = useState({ asset_id: '', issue: '', priority: 'MEDIUM', photo_url: '' });
  const [errors, setErrors] = useState({});
  const [approveNote, setApproveNote] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [mntRes, astRes, usrRes] = await Promise.all([
          api.get('/maintenance/').catch(() => ({ data: [] })),
          api.get('/assets/'),
          api.get('/admin/employees'),
        ]);
        setRequests(mntRes.data);
        setAssets(astRes.data);
        setUsers(usrRes.data);
        if (mntRes.data.length > 0) setSelectedRequest(mntRes.data[0]);
      } catch (err) {
        toast.error('Failed to load maintenance data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const visibleRequests = useMemo(() => {
    return statusFilter === 'ALL' ? requests : requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const selectedAsset = useMemo(() => assets.find((asset) => asset.id === selectedRequest?.asset_id), [assets, selectedRequest]);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.asset_id) nextErrors.asset_id = 'Select an asset.';
    if (!form.issue.trim()) nextErrors.issue = 'Describe the issue.';
    if (!form.priority) nextErrors.priority = 'Choose a priority.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const { data } = await api.post('/maintenance/', {
        asset_id: Number(form.asset_id),
        issue: form.issue.trim(),
        priority: form.priority,
        photo_url: form.photo_url || '',
      });
      setRequests((prev) => [data, ...prev]);
      setSelectedRequest(data);
      toast.success('Maintenance request raised');
      setForm({ asset_id: '', issue: '', priority: 'MEDIUM', photo_url: '' });
      setErrors({});
    } catch (err) {
      toast.error('Failed to submit maintenance request');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await api.put(`/maintenance/${selectedRequest.id}/approve`, { remarks: approveNote.trim() });
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: 'APPROVED', approved_by: user.id, remarks: approveNote.trim() } : r)));
      setAssets((prev) => prev.map((a) => (a.id === selectedRequest.asset_id ? { ...a, status: 'UNDER_MAINTENANCE' } : a)));
      setApproveNote('');
      toast.success('Maintenance request approved');
    } catch (err) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await api.put(`/maintenance/${selectedRequest.id}/reject`, { remarks: approveNote.trim() });
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: 'REJECTED', approved_by: user.id, remarks: approveNote.trim() } : r)));
      setApproveNote('');
      toast.info('Maintenance request rejected');
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedRequest) return;
    try {
      await api.put(`/maintenance/${selectedRequest.id}/assign`, { technician_name: technicianName.trim() });
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? { ...r, technician_name: technicianName.trim(), status: 'IN_PROGRESS' } : r)));
      setTechnicianName('');
      toast.success('Technician assigned');
    } catch (err) {
      toast.error('Failed to assign technician');
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest) return;
    try {
      await api.put(`/maintenance/${selectedRequest.id}/resolve`, { remarks: resolutionNotes.trim() });
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: 'RESOLVED', resolved_at: new Date().toISOString().split('T')[0], remarks: resolutionNotes.trim() } : r)));
      setAssets((prev) => prev.map((a) => (a.id === selectedRequest.asset_id ? { ...a, status: 'AVAILABLE' } : a)));
      setResolutionNotes('');
      toast.success('Maintenance resolved');
    } catch (err) {
      toast.error('Failed to resolve request');
    }
  };

  const resolveReporter = (userId) => users.find((u) => u.id === userId)?.full_name || '—';
  const assetName = (assetId) => assets.find((a) => a.id === assetId)?.name || '—';

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="app-content">
        <main className="maintenance-page">
          <header className="maintenance-topbar">
            <div>
              <p className="maintenance-eyebrow">AssetFlow / Maintenance</p>
              <h1 className="maintenance-title">Maintenance Management</h1>
            </div>
          </header>

          {loading ? (
            <div className="maintenance-loading">Loading maintenance queue…</div>
          ) : (
            <div className="maintenance-grid">
              <section className="maintenance-panel queue-panel">
                <div className="maintenance-panel-header">
                  <h2>Maintenance queue</h2>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="ALL">All states</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                {visibleRequests.length === 0 ? (
                  <div className="empty-state">No maintenance requests in this state</div>
                ) : (
                  <div className="maintenance-cards">
                    {visibleRequests.map((request) => (
                      <button key={request.id} className={`maintenance-card ${selectedRequest?.id === request.id ? 'selected' : ''}`} onClick={() => setSelectedRequest(request)}>
                        <div className="maintenance-card-header">
                          <strong>{assetName(request.asset_id)}</strong>
                          <span className={`maintenance-chip ${STATUS_CLASS[request.status] || 'status-gray'}`}>{request.status}</span>
                        </div>
                        <p>{request.issue}</p>
                        <div className="maintenance-card-meta">
                          <span>{request.priority}</span>
                          <span>{resolveReporter(request.reported_by)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <div className="maintenance-side-stack">
                <section className="maintenance-panel">
                  <div className="maintenance-panel-header">
                    <h2>Raise request</h2>
                  </div>
                  <form className="maintenance-form" onSubmit={handleSubmit}>
                    <label className="maintenance-form-field">
                      <span>Asset</span>
                      <select value={form.asset_id} onChange={(event) => setForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                        <option value="">Select asset</option>
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                      </select>
                      {errors.asset_id && <small>{errors.asset_id}</small>}
                    </label>
                    <label className="maintenance-form-field">
                      <span>Issue</span>
                      <textarea rows={4} value={form.issue} onChange={(event) => setForm((prev) => ({ ...prev, issue: event.target.value }))} />
                      {errors.issue && <small>{errors.issue}</small>}
                    </label>
                    <label className="maintenance-form-field">
                      <span>Priority</span>
                      <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                      {errors.priority && <small>{errors.priority}</small>}
                    </label>
                    <label className="maintenance-form-field">
                      <span>Photo upload</span>
                      <input type="file" onChange={(event) => setForm((prev) => ({ ...prev, photo_url: URL.createObjectURL(event.target.files?.[0] || new Blob()) }))} />
                    </label>
                    <button type="submit" className="maintenance-primary-btn">Submit request</button>
                  </form>
                </section>

                <aside className="maintenance-panel detail-panel">
                  {selectedRequest ? (
                    <>
                      <div className="maintenance-panel-header">
                        <h2>Request details</h2>
                        <span className={`maintenance-chip ${STATUS_CLASS[selectedRequest.status] || 'status-gray'}`}>{selectedRequest.status}</span>
                      </div>
                      <div className="detail-card">
                        <p className="detail-text">{selectedRequest.issue}</p>
                        {selectedRequest.photo_url && <img src={selectedRequest.photo_url} alt="" className="maintenance-photo" />}
                        <div className="detail-metrics">
                          <div><strong>Asset</strong><span>{selectedAsset?.name || '—'}</span></div>
                          <div><strong>Reporter</strong><span>{resolveReporter(selectedRequest.reported_by)}</span></div>
                          <div><strong>Priority</strong><span>{selectedRequest.priority}</span></div>
                          <div><strong>Technician</strong><span>{selectedRequest.technician_name || 'Unassigned'}</span></div>
                          {selectedRequest.resolved_at && (
                            <div><strong>Resolved At</strong><span>{selectedRequest.resolved_at}</span></div>
                          )}
                        </div>
                        {selectedRequest.remarks && (
                          <div className="detail-metrics" style={{ marginTop: '0', gridTemplateColumns: '1fr' }}>
                            <div><strong>Remarks</strong><span style={{ fontWeight: 'normal' }}>{selectedRequest.remarks}</span></div>
                          </div>
                        )}
                      </div>

                      {CURRENT_USER.role === 'ASSET_MANAGER' && selectedRequest.status === 'PENDING' && (
                        <div className="maintenance-action-group">
                          <textarea rows={3} value={approveNote} placeholder="Approval remarks" onChange={(event) => setApproveNote(event.target.value)} />
                          <div className="maintenance-actions">
                            <button className="maintenance-secondary-btn" onClick={handleReject}>Reject</button>
                            <button className="maintenance-primary-btn" onClick={handleApprove}>Approve</button>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'APPROVED' && (
                        <div className="maintenance-action-group">
                          <label className="maintenance-form-field">
                            <span>Assign technician</span>
                            <input value={technicianName} onChange={(event) => setTechnicianName(event.target.value)} placeholder="Technician name" />
                          </label>
                          <button className="maintenance-primary-btn" onClick={handleAssignTechnician}>Start work</button>
                        </div>
                      )}

                      {selectedRequest.status === 'IN_PROGRESS' && (
                        <div className="maintenance-action-group">
                          <label className="maintenance-form-field">
                            <span>Resolution notes</span>
                            <textarea rows={3} value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} />
                          </label>
                          <button className="maintenance-primary-btn" onClick={handleResolve}>Resolve</button>
                        </div>
                      )}

                      <div className="maintenance-history">
                        <h3>History for this asset</h3>
                        {requests.filter((request) => request.asset_id === selectedRequest.asset_id).map((entry) => (
                          <div key={entry.id} className="maintenance-history-item">
                            <div>
                              <strong>{entry.issue}</strong>
                              <p>{entry.status}</p>
                            </div>
                            <span>{entry.created_at || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">Select a request to inspect it</div>
                  )}
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
