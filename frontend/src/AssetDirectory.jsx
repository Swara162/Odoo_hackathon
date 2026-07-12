import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import './AssetDirectory.css';
import './AppShell.css';

const CURRENT_USER = {
  id: 1,
  full_name: 'Swara',
  role: 'ADMIN',
};

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Laptop' },
  { id: 2, name: 'Monitor' },
  { id: 3, name: 'Projector' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Peripheral' },
];

const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Operations' },
  { id: 3, name: 'HR' },
];

const INITIAL_ASSETS = [
  {
    id: 1,
    asset_tag: 'AF-0001',
    name: 'MacBook Pro 16"',
    category_id: 1,
    serial_number: 'SN-1001',
    purchase_date: '2024-01-15',
    purchase_cost: 189999,
    location: 'HQ-01',
    department_id: 1,
    condition: 'GOOD',
    status: 'ALLOCATED',
    bookable: true,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=160&q=80',
    document_url: 'https://example.com/asset-1.pdf',
  },
  {
    id: 2,
    asset_tag: 'AF-0002',
    name: 'Dell Monitor 27"',
    category_id: 2,
    serial_number: 'SN-1002',
    purchase_date: '2024-01-20',
    purchase_cost: 32000,
    location: 'HQ-02',
    department_id: 1,
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    bookable: false,
    image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=160&q=80',
    document_url: 'https://example.com/asset-2.pdf',
  },
  {
    id: 3,
    asset_tag: 'AF-0003',
    name: 'Epson Projector',
    category_id: 3,
    serial_number: 'SN-1003',
    purchase_date: '2024-02-05',
    purchase_cost: 65000,
    location: 'HQ-10',
    department_id: 2,
    condition: 'GOOD',
    status: 'UNDER_MAINTENANCE',
    bookable: true,
    image_url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=160&q=80',
    document_url: 'https://example.com/asset-3.pdf',
  },
  {
    id: 4,
    asset_tag: 'AF-0004',
    name: 'Ergonomic Chair',
    category_id: 4,
    serial_number: 'SN-1004',
    purchase_date: '2024-02-10',
    purchase_cost: 25000,
    location: 'HQ-03',
    department_id: 2,
    condition: 'FAIR',
    status: 'AVAILABLE',
    bookable: true,
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=160&q=80',
    document_url: 'https://example.com/asset-4.pdf',
  },
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
];

const INITIAL_MAINTENANCE = [
  {
    id: 1,
    asset_id: 3,
    requested_by: 5,
    technician_name: 'Suresh K.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Lamp replacement and calibration',
    created_at: '2024-06-28',
  },
];

const STATUS_CLASS = {
  AVAILABLE: 'status-green',
  ALLOCATED: 'status-blue',
  UNDER_MAINTENANCE: 'status-amber',
  LOST: 'status-red',
  RETIRED: 'status-gray',
};

const EMPTY_FORM = {
  name: '',
  category_id: '',
  serial_number: '',
  purchase_date: '',
  purchase_cost: '',
  condition: '',
  location: '',
  department_id: '',
  bookable: false,
  image_url: '',
  document_url: '',
  asset_tag: '',
};

export default function AssetDirectory() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [departments] = useState(INITIAL_DEPARTMENTS);
  const [allocations] = useState(INITIAL_ALLOCATIONS);
  const [maintenanceRequests] = useState(INITIAL_MAINTENANCE);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    status: '',
    department_id: '',
    condition: '',
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredAssets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch = !query || [asset.asset_tag, asset.name, asset.serial_number].some((value) => value.toLowerCase().includes(query));
      const matchesCategory = !filters.category_id || asset.category_id === Number(filters.category_id);
      const matchesStatus = !filters.status || asset.status === filters.status;
      const matchesDepartment = !filters.department_id || asset.department_id === Number(filters.department_id);
      const matchesCondition = !filters.condition || asset.condition === filters.condition;
      return matchesSearch && matchesCategory && matchesStatus && matchesDepartment && matchesCondition;
    });
  }, [assets, filters, searchTerm]);

  const openCreateModal = () => {
    const nextTag = `AF-${String(assets.length + 1).padStart(4, '0')}`;
    setForm({ ...EMPTY_FORM, asset_tag: nextTag });
    setErrors({});
    setShowForm(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const { name } = event.target;
    const fakeUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [name]: fakeUrl }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.category_id) nextErrors.category_id = 'Category is required.';
    if (!form.purchase_date) nextErrors.purchase_date = 'Purchase date is required.';
    if (!form.purchase_cost) nextErrors.purchase_cost = 'Purchase cost is required.';
    if (!Number.isFinite(Number(form.purchase_cost))) nextErrors.purchase_cost = 'Purchase cost must be numeric.';
    if (!form.condition) nextErrors.condition = 'Condition is required.';
    if (!form.location.trim()) nextErrors.location = 'Location is required.';
    if (!form.department_id) nextErrors.department_id = 'Department is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitAsset = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const newAsset = {
      id: Date.now(),
      asset_tag: form.asset_tag || `AF-${String(assets.length + 1).padStart(4, '0')}`,
      name: form.name.trim(),
      category_id: Number(form.category_id),
      serial_number: form.serial_number.trim(),
      purchase_date: form.purchase_date,
      purchase_cost: Number(form.purchase_cost),
      location: form.location.trim(),
      department_id: Number(form.department_id),
      condition: form.condition,
      status: 'AVAILABLE',
      bookable: Boolean(form.bookable),
      image_url: form.image_url || 'https://placehold.co/96x96/png?text=Asset',
      document_url: form.document_url || '',
    };

    setAssets((prev) => [newAsset, ...prev]);
    setShowForm(false);
    setSelectedAsset(newAsset);
    setForm(EMPTY_FORM);
  };

  const selectedAssetDetails = selectedAsset ? assets.find((asset) => asset.id === selectedAsset.id) || selectedAsset : null;
  const allocationHistory = selectedAssetDetails
    ? allocations.filter((allocation) => allocation.asset_id === selectedAssetDetails.id)
    : [];
  const maintenanceHistory = selectedAssetDetails
    ? maintenanceRequests.filter((request) => request.asset_id === selectedAssetDetails.id)
    : [];

  return (
    <div className="app-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="app-content">
        <main className="asset-page">
          <header className="asset-topbar">
            <div>
              <p className="asset-eyebrow">AssetFlow / Directory</p>
              <h1 className="asset-title">Asset Directory</h1>
            </div>
            <button className="asset-primary-btn" onClick={openCreateModal}>
              <i className="ti ti-plus" aria-hidden="true"></i>
              Register asset
            </button>
          </header>

          <section className="asset-toolbar" aria-label="Asset filters and search">
            <div className="asset-search-wrap">
              <i className="ti ti-search" aria-hidden="true"></i>
              <input
                className="asset-search-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by tag, name or serial number"
                aria-label="Search assets"
              />
            </div>

            <div className="asset-filter-row">
              <label className="asset-filter-field">
                <span>Category</span>
                <select value={filters.category_id} onChange={(event) => setFilters((prev) => ({ ...prev, category_id: event.target.value }))}>
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="asset-filter-field">
                <span>Status</span>
                <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
                  <option value="">All statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ALLOCATED">ALLOCATED</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                  <option value="LOST">LOST</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </label>

              <label className="asset-filter-field">
                <span>Department</span>
                <select value={filters.department_id} onChange={(event) => setFilters((prev) => ({ ...prev, department_id: event.target.value }))}>
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="asset-filter-field">
                <span>Condition</span>
                <select value={filters.condition} onChange={(event) => setFilters((prev) => ({ ...prev, condition: event.target.value }))}>
                  <option value="">All conditions</option>
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="POOR">POOR</option>
                  <option value="DAMAGED">DAMAGED</option>
                </select>
              </label>
            </div>

            <div className="asset-view-toggle" role="tablist" aria-label="Asset view mode">
              <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                <i className="ti ti-list" aria-hidden="true"></i>
                Table
              </button>
              <button className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>
                <i className="ti ti-layout-grid" aria-hidden="true"></i>
                Cards
              </button>
            </div>
          </section>

          <div className="asset-main-grid">
            <section className="asset-panel" aria-label="Asset list">
              {loading ? (
                <div className="asset-loading-state">Loading assets…</div>
              ) : filteredAssets.length === 0 ? (
                <div className="empty-state">
                  <i className="ti ti-package-off" aria-hidden="true"></i>
                  <span>No assets match your filters</span>
                </div>
              ) : viewMode === 'table' ? (
                <div className="asset-table-wrap">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Department</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset)} className="asset-row">
                          <td>
                            <div className="asset-cell-main">
                              <img src={asset.image_url || 'https://placehold.co/56x56/png?text=Asset'} alt="" className="asset-thumb" />
                              <div>
                                <div className="asset-name">{asset.name}</div>
                                <div className="asset-meta">{asset.asset_tag} · {asset.serial_number}</div>
                              </div>
                            </div>
                          </td>
                          <td>{categories.find((category) => category.id === asset.category_id)?.name || '—'}</td>
                          <td>{asset.location}</td>
                          <td>{departments.find((department) => department.id === asset.department_id)?.name || '—'}</td>
                          <td>
                            <span className={`asset-status-chip ${STATUS_CLASS[asset.status] || 'status-gray'}`}>{asset.status}</span>
                            {asset.bookable && <span className="asset-bookable-badge">Bookable</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="asset-card-grid">
                  {filteredAssets.map((asset) => (
                    <button key={asset.id} className="asset-card" onClick={() => setSelectedAsset(asset)}>
                      <img src={asset.image_url || 'https://placehold.co/96x96/png?text=Asset'} alt="" className="asset-card-thumb" />
                      <div className="asset-card-body">
                        <div className="asset-card-title-row">
                          <h3>{asset.name}</h3>
                          <span className={`asset-status-chip ${STATUS_CLASS[asset.status] || 'status-gray'}`}>{asset.status}</span>
                        </div>
                        <p className="asset-card-meta">{asset.asset_tag}</p>
                        <p className="asset-card-meta">{categories.find((category) => category.id === asset.category_id)?.name || '—'} · {asset.location}</p>
                        <p className="asset-card-meta">Department: {departments.find((department) => department.id === asset.department_id)?.name || '—'}</p>
                        {asset.bookable && <span className="asset-bookable-badge">Bookable</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <aside className="asset-detail-panel" aria-label="Asset details">
              {selectedAssetDetails ? (
                <>
                  <div className="asset-detail-header">
                    <div>
                      <p className="asset-eyebrow">Full record</p>
                      <h2>{selectedAssetDetails.name}</h2>
                    </div>
                    <span className={`asset-status-chip ${STATUS_CLASS[selectedAssetDetails.status] || 'status-gray'}`}>{selectedAssetDetails.status}</span>
                  </div>

                  <div className="asset-detail-grid">
                    <div>
                      <span className="asset-detail-label">Asset tag</span>
                      <p>{selectedAssetDetails.asset_tag}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Serial number</span>
                      <p>{selectedAssetDetails.serial_number || '—'}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Category</span>
                      <p>{categories.find((category) => category.id === selectedAssetDetails.category_id)?.name || '—'}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Department</span>
                      <p>{departments.find((department) => department.id === selectedAssetDetails.department_id)?.name || '—'}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Location</span>
                      <p>{selectedAssetDetails.location}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Condition</span>
                      <p>{selectedAssetDetails.condition}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Purchase date</span>
                      <p>{selectedAssetDetails.purchase_date}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Purchase cost</span>
                      <p>₹{selectedAssetDetails.purchase_cost?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="asset-detail-label">Bookable</span>
                      <p>{selectedAssetDetails.bookable ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {selectedAssetDetails.image_url && (
                    <div className="asset-media-box">
                      <img src={selectedAssetDetails.image_url} alt="" className="asset-media-image" />
                    </div>
                  )}

                  <div className="asset-subsection">
                    <h3>Allocation history</h3>
                    {allocationHistory.length === 0 ? (
                      <p className="asset-empty-text">No allocation history</p>
                    ) : (
                      allocationHistory.map((allocation) => (
                        <div className="asset-list-item" key={allocation.id}>
                          <div>
                            <strong>Employee #{allocation.employee_id}</strong>
                            <p>Status: {allocation.allocation_status}</p>
                          </div>
                          <span>{allocation.allocated_at}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="asset-subsection">
                    <h3>Maintenance history</h3>
                    {maintenanceHistory.length === 0 ? (
                      <p className="asset-empty-text">No maintenance requests</p>
                    ) : (
                      maintenanceHistory.map((request) => (
                        <div className="asset-list-item" key={request.id}>
                          <div>
                            <strong>{request.description}</strong>
                            <p>{request.status} · {request.priority}</p>
                          </div>
                          <span>{request.created_at}</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state detail-empty">
                  <i className="ti ti-focus" aria-hidden="true"></i>
                  <span>Select an asset to view its full record</span>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {showForm && (
        <div className="asset-modal-overlay" role="presentation" onClick={() => setShowForm(false)}>
          <div className="asset-modal" role="dialog" aria-modal="true" aria-labelledby="asset-form-title" onClick={(event) => event.stopPropagation()}>
            <div className="asset-modal-header">
              <div>
                <p className="asset-eyebrow">Register asset</p>
                <h2 id="asset-form-title">New asset record</h2>
              </div>
              <button className="asset-icon-btn" onClick={() => setShowForm(false)} aria-label="Close form">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form className="asset-form" onSubmit={submitAsset}>
              <div className="asset-form-grid">
                <label className="asset-form-field">
                  <span>Name</span>
                  <input name="name" value={form.name} onChange={handleFormChange} />
                  {errors.name && <small>{errors.name}</small>}
                </label>

                <label className="asset-form-field">
                  <span>Asset tag</span>
                  <input name="asset_tag" value={form.asset_tag} readOnly />
                </label>

                <label className="asset-form-field">
                  <span>Category</span>
                  <select name="category_id" value={form.category_id} onChange={handleFormChange}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <small>{errors.category_id}</small>}
                </label>

                <label className="asset-form-field">
                  <span>Serial number</span>
                  <input name="serial_number" value={form.serial_number} onChange={handleFormChange} />
                </label>

                <label className="asset-form-field">
                  <span>Purchase date</span>
                  <input type="date" name="purchase_date" value={form.purchase_date} onChange={handleFormChange} />
                  {errors.purchase_date && <small>{errors.purchase_date}</small>}
                </label>

                <label className="asset-form-field">
                  <span>Purchase cost</span>
                  <input type="number" name="purchase_cost" value={form.purchase_cost} onChange={handleFormChange} />
                  {errors.purchase_cost && <small>{errors.purchase_cost}</small>}
                </label>

                <label className="asset-form-field">
                  <span>Condition</span>
                  <select name="condition" value={form.condition} onChange={handleFormChange}>
                    <option value="">Select condition</option>
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="POOR">POOR</option>
                    <option value="DAMAGED">DAMAGED</option>
                  </select>
                  {errors.condition && <small>{errors.condition}</small>}
                </label>

                <label className="asset-form-field">
                  <span>Location</span>
                  <input name="location" value={form.location} onChange={handleFormChange} />
                  {errors.location && <small>{errors.location}</small>}
                </label>

                <label className="asset-form-field">
                  <span>Department</span>
                  <select name="department_id" value={form.department_id} onChange={handleFormChange}>
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && <small>{errors.department_id}</small>}
                </label>

                <label className="asset-form-field asset-form-toggle">
                  <span>Bookable</span>
                  <input type="checkbox" name="bookable" checked={form.bookable} onChange={handleFormChange} />
                </label>

                <label className="asset-form-field">
                  <span>Image upload</span>
                  <input type="file" name="image_url" onChange={handleFileChange} />
                </label>

                <label className="asset-form-field">
                  <span>Document upload</span>
                  <input type="file" name="document_url" onChange={handleFileChange} />
                </label>
              </div>

              <div className="asset-modal-actions">
                <button type="button" className="asset-secondary-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="asset-primary-btn">
                  Save asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
