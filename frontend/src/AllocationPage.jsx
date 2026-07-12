import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import { formatDisplayDate } from './utils/dateFormat';
import './AllocationPage.css';
import './AppShell.css';

const CURRENT_USER = {
  id: 1,
  full_name: 'Swara',
  role: 'ADMIN',
};

const INITIAL_USERS = [
  { id: 1, full_name: 'Swara' },
  { id: 2, full_name: 'Priya Sharma' },
  { id: 3, full_name: 'Ravi Menon' },
  { id: 4, full_name: 'Anjali Verma' },
  { id: 5, full_name: 'Siddharth Roy' },
  { id: 6, full_name: 'Meera Nair' },
];

const INITIAL_ASSETS = [
  { id: 1, name: 'MacBook Pro 16"', asset_tag: 'AF-0001', status: 'ALLOCATED' },
  { id: 2, name: 'Dell Monitor 27"', asset_tag: 'AF-0002', status: 'AVAILABLE' },
  { id: 3, name: 'Epson Projector', asset_tag: 'AF-0003', status: 'UNDER_MAINTENANCE' },
  { id: 4, name: 'Ergonomic Chair', asset_tag: 'AF-0004', status: 'AVAILABLE' },
];

const INITIAL_ALLOCATIONS = [
  {
    id: 1,
    asset_id: 1,
    employee_id: 4,
    allocated_by: 1,
    allocated_at: '2024-06-15',
    expected_return: '2024-07-10',
    returned_at: null,
    return_notes: '',
    allocation_status: 'ACTIVE',
  },
  {
    id: 2,
    asset_id: 2,
    employee_id: 2,
    allocated_by: 1,
    allocated_at: '2024-06-20',
    expected_return: '2024-07-02',
    returned_at: '2024-06-28',
    return_notes: 'Returned after use',
    allocation_status: 'RETURNED',
  },
];

const INITIAL_TRANSFER_REQUESTS = [
  {
    id: 1,
    asset_id: 1,
    from_employee: 4,
    to_employee: 2,
    requested_by: 4,
    approved_by: null,
    status: 'PENDING',
    remarks: 'Need this for a new project',
    requested_at: '2024-06-30',
  },
];

const STATUS_CLASS = {
  ACTIVE: 'status-blue',
  RETURNED: 'status-gray',
  OVERDUE: 'status-red',
};

export default function AllocationPage() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [transferRequests, setTransferRequests] = useState(INITIAL_TRANSFER_REQUESTS);
  const [users] = useState(INITIAL_USERS);
  const [loading, setLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [activeHolderWarning, setActiveHolderWarning] = useState(null);
  const [form, setForm] = useState({ asset_id: '', employee_id: '', expected_return: '' });
  const [transferForm, setTransferForm] = useState({ asset_id: '', from_employee: '', to_employee: '', remarks: '' });
  const [returnForm, setReturnForm] = useState({ return_notes: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const activeAllocations = useMemo(() => {
    return allocations.filter((allocation) => allocation.allocation_status === 'ACTIVE');
  }, [allocations]);

  const overdueAllocations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activeAllocations.filter((allocation) => allocation.expected_return < today);
  }, [activeAllocations]);

  const openAllocateModal = () => {
    setErrors({});
    setActiveHolderWarning(null);
    setForm({ asset_id: '', employee_id: '', expected_return: '' });
    setShowAllocateModal(true);
  };

  const openTransferModal = (assetId, currentHolderId) => {
    setErrors({});
    setTransferForm({ asset_id: assetId, from_employee: currentHolderId, to_employee: '', remarks: '' });
    setShowTransferModal(true);
  };

  const validateAllocate = () => {
    const nextErrors = {};
    if (!form.asset_id) nextErrors.asset_id = 'Select an asset.';
    if (!form.employee_id) nextErrors.employee_id = 'Select an employee.';
    if (!form.expected_return) nextErrors.expected_return = 'Expected return date is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateTransfer = () => {
    const nextErrors = {};
    if (!transferForm.asset_id) nextErrors.asset_id = 'Select an asset.';
    if (!transferForm.from_employee) nextErrors.from_employee = 'Select the current holder.';
    if (!transferForm.to_employee) nextErrors.to_employee = 'Select the new employee.';
    if (!transferForm.remarks.trim()) nextErrors.remarks = 'Add a short transfer reason.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAllocateSubmit = (event) => {
    event.preventDefault();
    if (!validateAllocate()) return;

    const assetId = Number(form.asset_id);
    const activeAllocation = allocations.find((allocation) => allocation.asset_id === assetId && allocation.allocation_status === 'ACTIVE');
    if (activeAllocation) {
      const holderName = users.find((user) => user.id === activeAllocation.employee_id)?.full_name || 'the current holder';
      setActiveHolderWarning({ assetId, holderName });
      setShowAllocateModal(false);
      openTransferModal(assetId, activeAllocation.employee_id);
      return;
    }

    const newAllocation = {
      id: Date.now(),
      asset_id: assetId,
      employee_id: Number(form.employee_id),
      allocated_by: CURRENT_USER.id,
      allocated_at: new Date().toISOString().split('T')[0],
      expected_return: form.expected_return,
      returned_at: null,
      return_notes: '',
      allocation_status: 'ACTIVE',
    };

    setAllocations((prev) => [newAllocation, ...prev]);
    setAssets((prev) => prev.map((asset) => (asset.id === assetId ? { ...asset, status: 'ALLOCATED' } : asset)));
    setShowAllocateModal(false);
    setForm({ asset_id: '', employee_id: '', expected_return: '' });
  };

  const handleTransferSubmit = (event) => {
    event.preventDefault();
    if (!validateTransfer()) return;

    const newRequest = {
      id: Date.now(),
      asset_id: Number(transferForm.asset_id),
      from_employee: Number(transferForm.from_employee),
      to_employee: Number(transferForm.to_employee),
      requested_by: CURRENT_USER.id,
      approved_by: null,
      status: 'PENDING',
      remarks: transferForm.remarks.trim(),
      requested_at: new Date().toISOString().split('T')[0],
    };

    setTransferRequests((prev) => [newRequest, ...prev]);
    setTransferForm({ asset_id: '', from_employee: '', to_employee: '', remarks: '' });
    setShowTransferModal(false);
    setActiveHolderWarning(null);
  };

  const openReviewModal = (request) => {
    setReviewRequest(request);
    setShowReviewModal(true);
  };

  const handleReview = (status) => {
    if (!reviewRequest) return;

    const nextStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    setTransferRequests((prev) => prev.map((request) => (request.id === reviewRequest.id ? { ...request, status: nextStatus, approved_by: CURRENT_USER.id } : request)));

    if (status === 'APPROVED') {
      const assetId = reviewRequest.asset_id;
      const oldAllocation = allocations.find((allocation) => allocation.asset_id === assetId && allocation.allocation_status === 'ACTIVE');
      if (oldAllocation) {
        setAllocations((prev) => [
          ...prev.map((allocation) => (allocation.id === oldAllocation.id ? { ...allocation, allocation_status: 'RETURNED', returned_at: new Date().toISOString().split('T')[0], return_notes: 'Transferred to another employee' } : allocation)),
          {
            id: Date.now() + 1,
            asset_id: assetId,
            employee_id: reviewRequest.to_employee,
            allocated_by: CURRENT_USER.id,
            allocated_at: new Date().toISOString().split('T')[0],
            expected_return: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            returned_at: null,
            return_notes: '',
            allocation_status: 'ACTIVE',
          },
        ]);
      }
      setAssets((prev) => prev.map((asset) => (asset.id === assetId ? { ...asset, status: 'ALLOCATED' } : asset)));
    }

    setShowReviewModal(false);
  };

  const openReturnModal = (allocation) => {
    setSelectedAllocation(allocation);
    setReturnForm({ return_notes: '' });
    setShowReturnModal(true);
  };

  const handleReturnSubmit = (event) => {
    event.preventDefault();
    if (!selectedAllocation) return;

    setAllocations((prev) => prev.map((allocation) => (allocation.id === selectedAllocation.id ? { ...allocation, allocation_status: 'RETURNED', returned_at: new Date().toISOString().split('T')[0], return_notes: returnForm.return_notes.trim() } : allocation)));
    setAssets((prev) => prev.map((asset) => (asset.id === selectedAllocation.asset_id ? { ...asset, status: 'AVAILABLE' } : asset)));
    setShowReturnModal(false);
    setReturnForm({ return_notes: '' });
    setSelectedAllocation(null);
  };

  const getAssetName = (assetId) => assets.find((asset) => asset.id === assetId)?.name || '—';
  const getUserName = (userId) => users.find((user) => user.id === userId)?.full_name || '—';

  return (
    <div className="app-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="app-content">
        <main className="allocation-page">
          <header className="allocation-topbar">
            <div>
              <p className="allocation-eyebrow">AssetFlow / Allocation</p>
              <h1 className="allocation-title">Allocation & Transfer</h1>
            </div>
            <button className="allocation-primary-btn" onClick={openAllocateModal}>
              <i className="ti ti-plus" aria-hidden="true"></i>
              Allocate asset
            </button>
          </header>

          {activeHolderWarning && (
            <div className="allocation-banner" role="alert">
              <i className="ti ti-alert-triangle" aria-hidden="true"></i>
              <span>This asset is currently held by {activeHolderWarning.holderName}. You can request a transfer instead.</span>
            </div>
          )}

          {loading ? (
            <div className="allocation-loading">Loading allocation workspace…</div>
          ) : (
            <>
              <section className="allocation-card" aria-label="Active allocations">
                <div className="allocation-card-header">
                  <div>
                    <h2>Active allocations</h2>
                    <p>{activeAllocations.length} active assets</p>
                  </div>
                  <span className="allocation-badge">{overdueAllocations.length} overdue</span>
                </div>
                {activeAllocations.length === 0 ? (
                  <div className="empty-state">
                    <i className="ti ti-clipboard-off" aria-hidden="true"></i>
                    <span>No active allocations</span>
                  </div>
                ) : (
                  <div className="allocation-table-wrap">
                    <table className="allocation-table">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          <th>Employee</th>
                          <th>Allocated at</th>
                          <th>Expected return</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAllocations.map((allocation) => {
                          const overdue = allocation.expected_return < new Date().toISOString().split('T')[0];
                          const statusLabel = overdue ? 'OVERDUE' : allocation.allocation_status;
                          return (
                            <tr key={allocation.id}>
                              <td>{getAssetName(allocation.asset_id)}</td>
                              <td>{getUserName(allocation.employee_id)}</td>
                              <td>{formatDisplayDate(allocation.allocated_at)}</td>
                              <td>{formatDisplayDate(allocation.expected_return)}</td>
                              <td>
                                <span className={`allocation-status-chip ${STATUS_CLASS[statusLabel] || 'status-gray'}`}>{statusLabel}</span>
                              </td>
                              <td>
                                <button className="allocation-link-btn" onClick={() => openReturnModal(allocation)}>
                                  Return
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="allocation-card" aria-label="Transfer requests">
                <div className="allocation-card-header">
                  <div>
                    <h2>Transfer requests</h2>
                    <p>Review and approve pending requests</p>
                  </div>
                </div>
                {transferRequests.length === 0 ? (
                  <div className="empty-state">
                    <i className="ti ti-arrows-exchange" aria-hidden="true"></i>
                    <span>No transfer requests</span>
                  </div>
                ) : (
                  <div className="allocation-table-wrap">
                    <table className="allocation-table">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Requested by</th>
                          <th>Status</th>
                          <th>Requested at</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferRequests.map((request) => (
                          <tr key={request.id}>
                            <td>{getAssetName(request.asset_id)}</td>
                            <td>{getUserName(request.from_employee)}</td>
                            <td>{getUserName(request.to_employee)}</td>
                            <td>{getUserName(request.requested_by)}</td>
                            <td>
                              <span className={`allocation-status-chip ${request.status === 'PENDING' ? 'status-amber' : request.status === 'APPROVED' ? 'status-green' : 'status-red'}`}>
                                {request.status}
                              </span>
                            </td>
                            <td>{formatDisplayDate(request.requested_at)}</td>
                            <td>
                              {request.status === 'PENDING' ? (
                                <button className="allocation-link-btn" onClick={() => openReviewModal(request)}>
                                  Review
                                </button>
                              ) : (
                                <span className="allocation-muted">Handled</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {showAllocateModal && (
        <div className="allocation-modal-overlay" role="presentation" onClick={() => setShowAllocateModal(false)}>
          <div className="allocation-modal" role="dialog" aria-modal="true" aria-labelledby="allocate-title" onClick={(event) => event.stopPropagation()}>
            <div className="allocation-modal-header">
              <div>
                <p className="allocation-eyebrow">Allocate asset</p>
                <h2 id="allocate-title">New allocation</h2>
              </div>
              <button className="allocation-icon-btn" onClick={() => setShowAllocateModal(false)} aria-label="Close form">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form className="allocation-form" onSubmit={handleAllocateSubmit}>
              <label className="allocation-form-field">
                <span>Asset</span>
                <select value={form.asset_id} onChange={(event) => setForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                  <option value="">Select asset</option>
                  {assets.filter((asset) => asset.status === 'AVAILABLE').map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.asset_tag} · {asset.name}</option>
                  ))}
                </select>
                {errors.asset_id && <small>{errors.asset_id}</small>}
              </label>

              <label className="allocation-form-field">
                <span>Employee</span>
                <select value={form.employee_id} onChange={(event) => setForm((prev) => ({ ...prev, employee_id: event.target.value }))}>
                  <option value="">Select employee</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
                {errors.employee_id && <small>{errors.employee_id}</small>}
              </label>

              <label className="allocation-form-field">
                <span>Expected return date</span>
                <input type="date" value={form.expected_return} onChange={(event) => setForm((prev) => ({ ...prev, expected_return: event.target.value }))} />
                {errors.expected_return && <small>{errors.expected_return}</small>}
              </label>

              <div className="allocation-modal-actions">
                <button type="button" className="allocation-secondary-btn" onClick={() => setShowAllocateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="allocation-primary-btn">
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="allocation-modal-overlay" role="presentation" onClick={() => setShowTransferModal(false)}>
          <div className="allocation-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-title" onClick={(event) => event.stopPropagation()}>
            <div className="allocation-modal-header">
              <div>
                <p className="allocation-eyebrow">Transfer request</p>
                <h2 id="transfer-title">Request transfer</h2>
              </div>
              <button className="allocation-icon-btn" onClick={() => setShowTransferModal(false)} aria-label="Close form">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form className="allocation-form" onSubmit={handleTransferSubmit}>
              <label className="allocation-form-field">
                <span>Asset</span>
                <select value={transferForm.asset_id} onChange={(event) => setTransferForm((prev) => ({ ...prev, asset_id: event.target.value }))}>
                  <option value="">Select asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.asset_tag} · {asset.name}</option>
                  ))}
                </select>
                {errors.asset_id && <small>{errors.asset_id}</small>}
              </label>

              <label className="allocation-form-field">
                <span>Current holder</span>
                <select value={transferForm.from_employee} onChange={(event) => setTransferForm((prev) => ({ ...prev, from_employee: event.target.value }))}>
                  <option value="">Select employee</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
                {errors.from_employee && <small>{errors.from_employee}</small>}
              </label>

              <label className="allocation-form-field">
                <span>Requested transfer to</span>
                <select value={transferForm.to_employee} onChange={(event) => setTransferForm((prev) => ({ ...prev, to_employee: event.target.value }))}>
                  <option value="">Select employee</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
                {errors.to_employee && <small>{errors.to_employee}</small>}
              </label>

              <label className="allocation-form-field">
                <span>Remarks</span>
                <textarea value={transferForm.remarks} onChange={(event) => setTransferForm((prev) => ({ ...prev, remarks: event.target.value }))} rows={3} />
                {errors.remarks && <small>{errors.remarks}</small>}
              </label>

              <div className="allocation-modal-actions">
                <button type="button" className="allocation-secondary-btn" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="allocation-primary-btn">
                  Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReturnModal && selectedAllocation && (
        <div className="allocation-modal-overlay" role="presentation" onClick={() => setShowReturnModal(false)}>
          <div className="allocation-modal" role="dialog" aria-modal="true" aria-labelledby="return-title" onClick={(event) => event.stopPropagation()}>
            <div className="allocation-modal-header">
              <div>
                <p className="allocation-eyebrow">Return asset</p>
                <h2 id="return-title">Record return</h2>
              </div>
              <button className="allocation-icon-btn" onClick={() => setShowReturnModal(false)} aria-label="Close form">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form className="allocation-form" onSubmit={handleReturnSubmit}>
              <label className="allocation-form-field">
                <span>Return notes</span>
                <textarea value={returnForm.return_notes} rows={4} onChange={(event) => setReturnForm({ return_notes: event.target.value })} />
              </label>
              <div className="allocation-modal-actions">
                <button type="button" className="allocation-secondary-btn" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="allocation-primary-btn">
                  Confirm return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && reviewRequest && (
        <div className="allocation-modal-overlay" role="presentation" onClick={() => setShowReviewModal(false)}>
          <div className="allocation-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={(event) => event.stopPropagation()}>
            <div className="allocation-modal-header">
              <div>
                <p className="allocation-eyebrow">Review transfer</p>
                <h2 id="review-title">Approve or reject</h2>
              </div>
              <button className="allocation-icon-btn" onClick={() => setShowReviewModal(false)} aria-label="Close form">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <p className="allocation-review-text">
              Review transfer for {getAssetName(reviewRequest.asset_id)} from {getUserName(reviewRequest.from_employee)} to {getUserName(reviewRequest.to_employee)}.
            </p>
            <div className="allocation-modal-actions">
              <button className="allocation-secondary-btn" onClick={() => handleReview('REJECTED')}>
                Reject
              </button>
              <button className="allocation-primary-btn" onClick={() => handleReview('APPROVED')}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
