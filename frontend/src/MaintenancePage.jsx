import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import './MaintenancePage.css';
import './AppShell.css';

const CURRENT_USER = {
  id: 1,
  full_name: 'Swara',
  role: 'ASSET_MANAGER',
};

const INITIAL_ASSETS = [
  { id: 1, name: 'MacBook Pro 16"', status: 'ALLOCATED' },
  { id: 2, name: 'Dell Monitor 27"', status: 'AVAILABLE' },
  { id: 3, name: 'Epson Projector', status: 'UNDER_MAINTENANCE' },
];

const INITIAL_REQUESTS = [
  {
    id: 1,
    asset_id: 3,
    reported_by: 5,
    issue: 'Lamp replacement and calibration',
    priority: 'HIGH',
    technician_name: '',
    status: 'PENDING',
    photo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    approved_by: null,
    resolved_at: null,
    remarks: '',
  },
  {
    id: 2,
    asset_id: 1,
    reported_by: 4,
    issue: 'Battery replacement',
    priority: 'MEDIUM',
    technician_name: 'Suresh K.',
    status: 'IN_PROGRESS',
    photo_url: '',
    approved_by: 1,
    resolved_at: null,
    remarks: '',
  },
];

const INITIAL_USERS = [
  { id: 4, full_name: 'Anjali Verma' },
  { id: 5, full_name: 'Siddharth Roy' },
];

const STATUS_CLASS = {
  PENDING: 'status-amber',
  APPROVED: 'status-blue',
  IN_PROGRESS: 'status-violet',
  RESOLVED: 'status-green',
  REJECTED: 'status-red',
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [users] = useState(INITIAL_USERS);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(INITIAL_REQUESTS[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [form, setForm] = useState({ asset_id: '', issue: '', priority: 'MEDIUM', photo_url: '' });
  const [errors, setErrors] = useState({});
  const [approveNote, setApproveNote] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const newRequest = {
      id: Date.now(),
      asset_id: Number(form.asset_id),
      reported_by: CURRENT_USER.id,
      issue: form.issue.trim(),
      priority: form.priority,
      technician_name: '',
      status: 'PENDING',
      photo_url: form.photo_url,
      approved_by: null,
      resolved_at: null,
      remarks: '',
    };
    setRequests((prev) => [newRequest, ...prev]);
    setSelectedRequest(newRequest);
    setForm({ asset_id: '', issue: '', priority: 'MEDIUM', photo_url: '' });
    setErrors({});
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    setRequests((prev) => prev.map((request) => (request.id === selectedRequest.id ? { ...request, status: 'APPROVED', approved_by: CURRENT_USER.id, remarks: approveNote.trim() } : request)));
    setAssets((prev) => prev.map((asset) => (asset.id === selectedRequest.asset_id ? { ...asset, status: 'UNDER_MAINTENANCE' } : asset)));
    setApproveNote('');
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    setRequests((prev) => prev.map((request) => (request.id === selectedRequest.id ? { ...request, status: 'REJECTED', approved_by: CURRENT_USER.id, remarks: approveNote.trim() } : request)));
    setApproveNote('');
  };

  const handleAssignTechnician = () => {
    if (!selectedRequest) return;
    setRequests((prev) => prev.map((request) => (request.id === selectedRequest.id ? { ...request, technician_name: technicianName.trim(), status: 'IN_PROGRESS' } : request)));
    setTechnicianName('');
  };

  const handleResolve = () => {
    if (!selectedRequest) return;
    setRequests((prev) => prev.map((request) => (request.id === selectedRequest.id ? { ...request, status: 'RESOLVED', resolved_at: new Date().toISOString().split('T')[0], remarks: resolutionNotes.trim() } : request)));
    setAssets((prev) => prev.map((asset) => (asset.id === selectedRequest.asset_id ? { ...asset, status: 'AVAILABLE' } : asset)));
    setResolutionNotes('');
  };

  const resolveReporter = (userId) => users.find((user) => user.id === userId)?.full_name || '—';
  const assetName = (assetId) => assets.find((asset) => asset.id === assetId)?.name || '—';

  return (
    <div className="app-shell">
      <Sidebar user={CURRENT_USER} />
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
              <section className="maintenance-panel">
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

                <form className="maintenance-form" onSubmit={handleSubmit}>
                  <h3>Raise request</h3>
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
                    <p className="detail-text">{selectedRequest.issue}</p>
                    {selectedRequest.photo_url && <img src={selectedRequest.photo_url} alt="" className="maintenance-photo" />}
                    <div className="detail-metrics">
                      <div><strong>Asset</strong><span>{selectedAsset?.name || '—'}</span></div>
                      <div><strong>Reporter</strong><span>{resolveReporter(selectedRequest.reported_by)}</span></div>
                      <div><strong>Priority</strong><span>{selectedRequest.priority}</span></div>
                      <div><strong>Technician</strong><span>{selectedRequest.technician_name || 'Unassigned'}</span></div>
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
          )}
        </main>
      </div>
    </div>
  );
}
