import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import './AuditPage.css';
import './AppShell.css';

const CURRENT_USER = {
  id: 1,
  full_name: 'Swara',
  role: 'ADMIN',
};

const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Operations' },
  { id: 3, name: 'HR' },
];

const INITIAL_USERS = [
  { id: 1, full_name: 'Swara' },
  { id: 2, full_name: 'Priya Sharma' },
  { id: 3, full_name: 'Ravi Menon' },
];

const INITIAL_ASSETS = [
  { id: 1, name: 'MacBook Pro 16"', department_id: 1, status: 'ALLOCATED' },
  { id: 2, name: 'Dell Monitor 27"', department_id: 1, status: 'AVAILABLE' },
  { id: 3, name: 'Epson Projector', department_id: 2, status: 'UNDER_MAINTENANCE' },
  { id: 4, name: 'Ergonomic Chair', department_id: 2, status: 'AVAILABLE' },
];

const INITIAL_CYCLES = [
  {
    id: 1,
    title: 'Q3 Asset Verification',
    department_id: 1,
    auditor_id: 2,
    start_date: '2026-07-01',
    end_date: '2026-07-10',
    status: 'IN_PROGRESS',
    created_by: 1,
  },
];

const INITIAL_ITEMS = [
  {
    id: 1,
    audit_cycle_id: 1,
    asset_id: 1,
    verification_status: 'VERIFIED',
    remarks: 'Checked and working',
    verified_at: '2026-07-03',
  },
  {
    id: 2,
    audit_cycle_id: 1,
    asset_id: 2,
    verification_status: '',
    remarks: '',
    verified_at: '',
  },
];

const STATUS_CLASS = {
  OPEN: 'status-blue',
  IN_PROGRESS: 'status-amber',
  CLOSED: 'status-gray',
};

export default function AuditPage() {
  const [cycles, setCycles] = useState(INITIAL_CYCLES);
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [departments] = useState(INITIAL_DEPARTMENTS);
  const [users] = useState(INITIAL_USERS);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState(INITIAL_CYCLES[0]);
  const [form, setForm] = useState({ title: '', department_id: '', auditor_id: '', start_date: '', end_date: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const cycleItems = useMemo(() => items.filter((item) => item.audit_cycle_id === selectedCycle?.id), [items, selectedCycle]);
  const allReviewed = cycleItems.length > 0 && cycleItems.every((item) => item.verification_status);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.department_id) nextErrors.department_id = 'Choose a department.';
    if (!form.auditor_id) nextErrors.auditor_id = 'Choose an auditor.';
    if (!form.start_date) nextErrors.start_date = 'Select a start date.';
    if (!form.end_date) nextErrors.end_date = 'Select an end date.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    const newCycle = {
      id: Date.now(),
      title: form.title.trim(),
      department_id: Number(form.department_id),
      auditor_id: Number(form.auditor_id),
      start_date: form.start_date,
      end_date: form.end_date,
      status: 'OPEN',
      created_by: CURRENT_USER.id,
    };
    const departmentAssets = assets.filter((asset) => asset.department_id === Number(form.department_id));
    const newItems = departmentAssets.map((asset) => ({
      id: Date.now() + asset.id,
      audit_cycle_id: newCycle.id,
      asset_id: asset.id,
      verification_status: '',
      remarks: '',
      verified_at: '',
    }));
    setCycles((prev) => [newCycle, ...prev]);
    setItems((prev) => [...newItems, ...prev]);
    setSelectedCycle(newCycle);
    setForm({ title: '', department_id: '', auditor_id: '', start_date: '', end_date: '' });
    setErrors({});
  };

  const updateItem = (itemId, status, remarks = '') => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, verification_status: status, verified_at: new Date().toISOString().split('T')[0], remarks } : item)));
  };

  const closeCycle = () => {
    if (!selectedCycle || !allReviewed) return;
    setCycles((prev) => prev.map((cycle) => (cycle.id === selectedCycle.id ? { ...cycle, status: 'CLOSED' } : cycle)));
    setAssets((prev) => prev.map((asset) => {
      const missingItem = items.find((item) => item.audit_cycle_id === selectedCycle.id && item.asset_id === asset.id && item.verification_status === 'MISSING');
      return missingItem ? { ...asset, status: 'LOST' } : asset;
    }));
  };

  const resolveDepartmentName = (departmentId) => departments.find((department) => department.id === departmentId)?.name || '—';
  const resolveAuditorName = (auditorId) => users.find((user) => user.id === auditorId)?.full_name || '—';
  const resolveAssetName = (assetId) => assets.find((asset) => asset.id === assetId)?.name || '—';

  return (
    <div className="app-shell">
      <Sidebar user={CURRENT_USER} />
      <div className="app-content">
        <main className="audit-page">
          <header className="audit-topbar">
            <div>
              <p className="audit-eyebrow">AssetFlow / Audit</p>
              <h1 className="audit-title">Asset Audit</h1>
            </div>
          </header>

          {loading ? (
            <div className="audit-loading">Loading audit workspace…</div>
          ) : (
            <div className="audit-grid">
              <section className="audit-panel">
                <div className="audit-panel-header">
                  <h2>Create audit cycle</h2>
                </div>
                <form className="audit-form" onSubmit={handleSubmit}>
                  <label className="audit-form-field">
                    <span>Title</span>
                    <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                    {errors.title && <small>{errors.title}</small>}
                  </label>
                  <label className="audit-form-field">
                    <span>Department</span>
                    <select value={form.department_id} onChange={(event) => setForm((prev) => ({ ...prev, department_id: event.target.value }))}>
                      <option value="">Select department</option>
                      {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                    {errors.department_id && <small>{errors.department_id}</small>}
                  </label>
                  <label className="audit-form-field">
                    <span>Auditor</span>
                    <select value={form.auditor_id} onChange={(event) => setForm((prev) => ({ ...prev, auditor_id: event.target.value }))}>
                      <option value="">Select auditor</option>
                      {users.map((user) => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                    </select>
                    {errors.auditor_id && <small>{errors.auditor_id}</small>}
                  </label>
                  <label className="audit-form-field">
                    <span>Start date</span>
                    <input type="date" value={form.start_date} onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))} />
                    {errors.start_date && <small>{errors.start_date}</small>}
                  </label>
                  <label className="audit-form-field">
                    <span>End date</span>
                    <input type="date" value={form.end_date} onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))} />
                    {errors.end_date && <small>{errors.end_date}</small>}
                  </label>
                  <button type="submit" className="audit-primary-btn">Create cycle</button>
                </form>
              </section>

              <section className="audit-panel">
                <div className="audit-panel-header">
                  <h2>Audit cycles</h2>
                </div>
                {cycles.length === 0 ? (
                  <div className="empty-state">No audit cycles yet</div>
                ) : (
                  <div className="audit-cycle-list">
                    {cycles.map((cycle) => (
                      <button key={cycle.id} className={`audit-cycle-card ${selectedCycle?.id === cycle.id ? 'selected' : ''}`} onClick={() => setSelectedCycle(cycle)}>
                        <div className="audit-cycle-meta">
                          <strong>{cycle.title}</strong>
                          <span className={`audit-chip ${STATUS_CLASS[cycle.status] || 'status-gray'}`}>{cycle.status}</span>
                        </div>
                        <p>{resolveDepartmentName(cycle.department_id)} · {resolveAuditorName(cycle.auditor_id)}</p>
                        <p>{cycle.start_date} → {cycle.end_date}</p>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="audit-panel checklist-panel">
                {selectedCycle ? (
                  <>
                    <div className="audit-panel-header">
                      <h2>Checklist · {selectedCycle.title}</h2>
                      <button className="audit-primary-btn" disabled={!allReviewed} onClick={closeCycle}>Close cycle</button>
                    </div>
                    <div className="audit-checklist">
                      {cycleItems.length === 0 ? (
                        <div className="empty-state">No items in this audit cycle</div>
                      ) : cycleItems.map((item) => (
                        <div key={item.id} className="audit-item">
                          <div>
                            <strong>{resolveAssetName(item.asset_id)}</strong>
                            <p>{item.remarks || 'No remarks yet'}</p>
                          </div>
                          <div className="audit-item-actions">
                            <button className="audit-action-btn verified" onClick={() => updateItem(item.id, 'VERIFIED')}>Verified</button>
                            <button className="audit-action-btn missing" onClick={() => updateItem(item.id, 'MISSING')}>Missing</button>
                            <button className="audit-action-btn damaged" onClick={() => updateItem(item.id, 'DAMAGED')}>Damaged</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="audit-discrepancy">
                      <h3>Discrepancies</h3>
                      {cycleItems.filter((item) => item.verification_status === 'MISSING' || item.verification_status === 'DAMAGED').length === 0 ? (
                        <p>No discrepancies</p>
                      ) : (
                        cycleItems.filter((item) => item.verification_status === 'MISSING' || item.verification_status === 'DAMAGED').map((item) => (
                          <div key={item.id} className="audit-discrepancy-item">
                            <strong>{resolveAssetName(item.asset_id)}</strong>
                            <span>{item.verification_status}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">Select an audit cycle</div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
