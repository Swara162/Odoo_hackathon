import React, { useState, useMemo } from 'react';
import AppShell from './AppShell';
import './OrganizationSetup.css';

// ─────────────────────────────────────────────
// Mock data — matches DB schema field names exactly
// ─────────────────────────────────────────────

const MOCK_USERS = [
  { id: 1, full_name: 'Admin User',    email: 'admin@company.com',   role: 'ADMIN',           department_id: null, phone: '+91 98000 00001', is_active: true },
  { id: 2, full_name: 'Priya Sharma',  email: 'priya@company.com',   role: 'DEPARTMENT_HEAD', department_id: 1,    phone: '+91 98000 00002', is_active: true },
  { id: 3, full_name: 'Ravi Menon',    email: 'ravi@company.com',    role: 'ASSET_MANAGER',   department_id: 2,    phone: '+91 98000 00003', is_active: true },
  { id: 4, full_name: 'Anjali Verma',  email: 'anjali@company.com',  role: 'EMPLOYEE',        department_id: 1,    phone: '+91 98000 00004', is_active: true },
  { id: 5, full_name: 'Siddharth Roy', email: 'sid@company.com',     role: 'EMPLOYEE',        department_id: 3,    phone: '+91 98000 00005', is_active: false },
  { id: 6, full_name: 'Meera Nair',    email: 'meera@company.com',   role: 'EMPLOYEE',        department_id: 2,    phone: '+91 98000 00006', is_active: true },
];

const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Engineering',  description: 'Software and infra teams', department_head_id: 2, is_active: true,  created_at: '2024-01-10' },
  { id: 2, name: 'Operations',   description: 'Logistics and ops',        department_head_id: 3, is_active: true,  created_at: '2024-01-12' },
  { id: 3, name: 'HR',           description: 'Human resources',          department_head_id: null, is_active: false, created_at: '2024-02-01' },
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Laptops',        description: 'All laptop devices',       created_at: '2024-01-10' },
  { id: 2, name: 'Projectors',     description: 'Projection equipment',     created_at: '2024-01-15' },
  { id: 3, name: 'Office Chairs',  description: 'Ergonomic seating',        created_at: '2024-02-01' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const PAGE_SIZE = 8;

const ROLE_CHIP = {
  ADMIN:           { label: 'Admin',          cls: 'chip-red'    },
  ASSET_MANAGER:   { label: 'Asset Manager',  cls: 'chip-blue'   },
  DEPARTMENT_HEAD: { label: 'Dept Head',      cls: 'chip-purple' },
  EMPLOYEE:        { label: 'Employee',       cls: 'chip-gray'   },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusChip({ active }) {
  return (
    <span className={`chip ${active ? 'chip-green' : 'chip-gray'}`}>
      <i className={`ti ${active ? 'ti-circle-check' : 'ti-circle-x'}`} aria-hidden="true"></i>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleChip({ role }) {
  const cfg = ROLE_CHIP[role] || { label: role, cls: 'chip-gray' };
  return <span className={`chip ${cfg.cls}`}>{cfg.label}</span>;
}

// ─────────────────────────────────────────────
// Pagination hook
// ─────────────────────────────────────────────
function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { page: safePage, setPage, totalPages, slice };
}

function Pagination({ page, totalPages, setPage, total }) {
  if (totalPages <= 1) return null;
  return (
    <div className="org-pagination">
      <span>Showing page {page} of {totalPages} ({total} records)</span>
      <div className="pagination-btns">
        <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
          <i className="ti ti-chevron-left" aria-hidden="true"></i>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? 'current' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          <i className="ti ti-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEPARTMENTS TAB
// ─────────────────────────────────────────────
function DepartmentsTab({ users }) {
  const [departments, setDepartments] = useState(MOCK_DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', data }

  const [form, setForm] = useState({ name: '', description: '', department_head_id: '', is_active: true });

  // ── Filtering ──
  const filtered = useMemo(() => {
    return departments.filter((d) => {
      const q = search.toLowerCase();
      const matchQ = d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? d.is_active : !d.is_active);
      return matchQ && matchStatus;
    });
  }, [departments, search, statusFilter]);

  const { page, setPage, totalPages, slice } = usePagination(filtered);

  function openCreate() {
    setForm({ name: '', description: '', department_head_id: '', is_active: true });
    setModal({ mode: 'create' });
  }

  function openEdit(dept) {
    setForm({
      name: dept.name,
      description: dept.description || '',
      department_head_id: dept.department_head_id ?? '',
      is_active: dept.is_active,
    });
    setModal({ mode: 'edit', id: dept.id });
  }

  function handleDeactivate(id) {
    // TODO: PATCH /departments/:id { is_active: false }
    setDepartments((prev) => prev.map((d) => d.id === id ? { ...d, is_active: false } : d));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (modal.mode === 'create') {
      // TODO: POST /departments { name, description, department_head_id, is_active }
      const newDept = {
        id: Date.now(),
        name: form.name,
        description: form.description,
        department_head_id: form.department_head_id ? Number(form.department_head_id) : null,
        is_active: form.is_active,
        created_at: new Date().toISOString().split('T')[0],
      };
      setDepartments((prev) => [...prev, newDept]);
    } else {
      // TODO: PATCH /departments/:id { name, description, department_head_id, is_active }
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === modal.id
            ? { ...d, name: form.name, description: form.description, department_head_id: form.department_head_id ? Number(form.department_head_id) : null, is_active: form.is_active }
            : d
        )
      );
    }
    setModal(null);
  }

  const resolveHead = (id) => users.find((u) => u.id === id)?.full_name || '—';

  return (
    <>
      {/* Toolbar */}
      <div className="org-toolbar">
        <div className="org-search-wrapper">
          <i className="ti ti-search org-search-icon" aria-hidden="true"></i>
          <input
            className="org-search-input"
            placeholder="Search departments…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="org-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn-primary" onClick={openCreate}>
          <i className="ti ti-plus" aria-hidden="true"></i>
          Create department
        </button>
      </div>

      {/* Table */}
      <div className="org-card">
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Head</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="org-empty">
                      <i className="ti ti-building-off" aria-hidden="true"></i>
                      <p className="org-empty-title">No departments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                slice.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <div className="cell-primary">{dept.name}</div>
                      {dept.description && <div className="cell-secondary">{dept.description}</div>}
                    </td>
                    <td>{resolveHead(dept.department_head_id)}</td>
                    <td><StatusChip active={dept.is_active} /></td>
                    <td>{formatDate(dept.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn" onClick={() => openEdit(dept)}>
                          <i className="ti ti-pencil" aria-hidden="true"></i> Edit
                        </button>
                        {dept.is_active && (
                          <button className="action-btn action-btn-danger" onClick={() => handleDeactivate(dept.id)}>
                            <i className="ti ti-ban" aria-hidden="true"></i> Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} />
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal.mode === 'create' ? 'Create department' : 'Edit department'}</h3>
              <button className="modal-close-btn" onClick={() => setModal(null)}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label htmlFor="dept-name">Department name *</label>
                  <input
                    id="dept-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="dept-desc">Description</label>
                  <textarea
                    id="dept-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description…"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="dept-head">Department head</label>
                  <select
                    id="dept-head"
                    value={form.department_head_id}
                    onChange={(e) => setForm({ ...form, department_head_id: e.target.value })}
                  >
                    <option value="">— No head assigned —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">Active</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {modal.mode === 'create' ? 'Create' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// CATEGORIES TAB
// ─────────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  }, [categories, search]);

  const { page, setPage, totalPages, slice } = usePagination(filtered);

  function openCreate() {
    setForm({ name: '', description: '' });
    setModal(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: POST /categories { name, description }
    const newCat = {
      id: Date.now(),
      name: form.name,
      description: form.description,
      created_at: new Date().toISOString().split('T')[0],
    };
    setCategories((prev) => [...prev, newCat]);
    setModal(null);
  }

  return (
    <>
      <div className="org-toolbar">
        <div className="org-search-wrapper">
          <i className="ti ti-search org-search-icon" aria-hidden="true"></i>
          <input
            className="org-search-input"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <i className="ti ti-plus" aria-hidden="true"></i>
          Add category
        </button>
      </div>

      <div className="org-card">
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="org-empty">
                      <i className="ti ti-tag-off" aria-hidden="true"></i>
                      <p className="org-empty-title">No categories found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                slice.map((cat) => (
                  <tr key={cat.id}>
                    <td><span className="cell-primary">{cat.name}</span></td>
                    <td style={{ color: '#6b7280' }}>{cat.description || '—'}</td>
                    <td>{formatDate(cat.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} />
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add category</h3>
              <button className="modal-close-btn" onClick={() => setModal(null)}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label htmlFor="cat-name">Category name *</label>
                  <input
                    id="cat-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Laptops"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description…"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Add category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// EMPLOYEES TAB
// ─────────────────────────────────────────────
function EmployeesTab({ departments }) {
  const [employees, setEmployees] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [promoteModal, setPromoteModal] = useState(null); // { user }
  const [newRole, setNewRole] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((u) => {
      const matchQ =
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
      return matchQ && matchStatus;
    });
  }, [employees, search, statusFilter]);

  const { page, setPage, totalPages, slice } = usePagination(filtered);

  function openPromote(user) {
    setNewRole(user.role === 'EMPLOYEE' ? 'DEPARTMENT_HEAD' : user.role);
    setPromoteModal({ user });
  }

  function handlePromote(e) {
    e.preventDefault();
    // TODO: PATCH /users/:id/role { role: newRole }
    // IMPORTANT: Server must validate that role ≠ ADMIN before saving.
    setEmployees((prev) =>
      prev.map((u) => u.id === promoteModal.user.id ? { ...u, role: newRole } : u)
    );
    setPromoteModal(null);
  }

  const resolveDept = (id) => departments.find((d) => d.id === id)?.name || '—';

  return (
    <>
      <div className="org-toolbar">
        <div className="org-search-wrapper">
          <i className="ti ti-search org-search-icon" aria-hidden="true"></i>
          <input
            className="org-search-input"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="org-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="org-card">
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="org-empty">
                      <i className="ti ti-users-group" aria-hidden="true"></i>
                      <p className="org-empty-title">No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                slice.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-primary">{user.full_name}</div>
                      {user.phone && <div className="cell-secondary">{user.phone}</div>}
                    </td>
                    <td style={{ color: '#6b7280' }}>{user.email}</td>
                    <td>{resolveDept(user.department_id)}</td>
                    <td><RoleChip role={user.role} /></td>
                    <td><StatusChip active={user.is_active} /></td>
                    <td>
                      <div className="row-actions">
                        {/* Only non-ADMINs can be promoted */}
                        {user.role !== 'ADMIN' && (
                          <button className="action-btn" onClick={() => openPromote(user)}>
                            <i className="ti ti-arrow-up-circle" aria-hidden="true"></i> Promote
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} />
      </div>

      {/* Promote modal */}
      {promoteModal && (
        <div className="modal-overlay" onClick={() => setPromoteModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change role — {promoteModal.user.full_name}</h3>
              <button className="modal-close-btn" onClick={() => setPromoteModal(null)}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
            <form onSubmit={handlePromote}>
              <div className="modal-body">
                <div className="info-note">
                  <i className="ti ti-info-circle" aria-hidden="true"></i>
                  <span>
                    Role changes are applied server-side. The ADMIN role cannot be set from this interface.
                    Only <strong>Department Head</strong> and <strong>Asset Manager</strong> can be granted here.
                  </span>
                </div>
                <div className="form-field">
                  <label htmlFor="promote-role">New role</label>
                  <select
                    id="promote-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    required
                  >
                    {/* ADMIN is intentionally omitted — never let client-side set ADMIN */}
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                    <option value="ASSET_MANAGER">Asset Manager</option>
                  </select>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Current role: <RoleChip role={promoteModal.user.role} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setPromoteModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Apply change</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
const TABS = [
  { key: 'departments', label: 'Departments', icon: 'ti-building' },
  { key: 'categories',  label: 'Categories',  icon: 'ti-tag'      },
  { key: 'employees',   label: 'Employees',   icon: 'ti-users'    },
];

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('departments');

  // Shared data — departments are needed in Employees tab to resolve dept names
  const [departments] = useState(MOCK_DEPARTMENTS);

  const tabCounts = {
    departments: MOCK_DEPARTMENTS.length,
    categories:  MOCK_CATEGORIES.length,
    employees:   MOCK_USERS.length,
  };

  return (
    <AppShell title="Organization Setup">
      {/* Page header */}
      <div className="org-page-header">
        <div>
          <h1 className="org-page-title">Organization Setup</h1>
          <p className="org-page-subtitle">Manage departments, asset categories, and team members.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="org-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`org-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`ti ${tab.icon}`} aria-hidden="true"></i>
            {tab.label}
            <span className="tab-count">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'departments' && <DepartmentsTab users={MOCK_USERS} />}
      {activeTab === 'categories'  && <CategoriesTab />}
      {activeTab === 'employees'   && <EmployeesTab departments={departments} />}
    </AppShell>
  );
}
