import React, { useState, useMemo, useEffect } from 'react';
import AppShell from './AppShell';
import api from './api';
import { useToast } from './components/Toast';
import './OrganizationSetup.css';



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
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', data }

  const [form, setForm] = useState({ name: '', description: '', department_head_id: '', is_active: true });

  useEffect(() => {
    api.get('/admin/departments').then((r) => setDepartments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
      is_active: dept.is_active,
    });
    setModal({ mode: 'edit', id: dept.id });
  }

  function handleDeactivate(id) {
    api.put(`/admin/departments/${id}`, { is_active: false })
      .then(() => setDepartments((prev) => prev.map((d) => d.id === id ? { ...d, is_active: false } : d)))
      .catch(() => toast.error('Failed to deactivate department'));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (modal.mode === 'create') {
        const { data } = await api.post('/admin/departments', { name: form.name, description: form.description });
        setDepartments((prev) => [...prev, data]);
        toast.success('Department created');
      } else {
        const { data } = await api.put(`/admin/departments/${modal.id}`, { name: form.name, description: form.description, is_active: form.is_active });
        setDepartments((prev) => prev.map((d) => d.id === modal.id ? data : d));
        toast.success('Department updated');
      }
    } catch (err) {
      toast.error('Failed to save department');
    }
    setModal(null);
  }

  const resolveHead = (id) => users.find((u) => u.id === id)?.full_name || '—';

  if (loading) return <div className="org-empty">Loading departments…</div>;

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
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    api.get('/admin/categories').then((r) => setCategories(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/categories', { name: form.name, description: form.description });
      setCategories((prev) => [...prev, data]);
      toast.success('Category created');
    } catch (err) {
      toast.error('Failed to create category');
    }
    setModal(null);
  }

  if (loading) return <div className="org-empty">Loading categories…</div>;

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
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [promoteModal, setPromoteModal] = useState(null); // { user }
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    api.get('/admin/employees').then((r) => setEmployees(r.data)).catch(() => {}).finally(() => setLoadingEmps(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((u) => {
      const matchQ =
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchDepartment = departmentFilter === 'all' || u.department_id === Number(departmentFilter);
      return matchQ && matchStatus && matchRole && matchDepartment;
    });
  }, [employees, search, statusFilter, roleFilter, departmentFilter]);

  const { page, setPage, totalPages, slice } = usePagination(filtered);

  function openPromote(user) {
    setNewRole(user.role === 'EMPLOYEE' ? 'DEPARTMENT_HEAD' : user.role);
    setPromoteModal({ user });
  }

  async function handlePromote(e) {
    e.preventDefault();
    try {
      await api.put(`/admin/promote/${promoteModal.user.id}`, { role: newRole });
      setEmployees((prev) => prev.map((u) => u.id === promoteModal.user.id ? { ...u, role: newRole } : u));
      toast.success('Role updated successfully');
    } catch (err) {
      toast.error('Failed to update role');
    }
    setPromoteModal(null);
  }

  if (loadingEmps) return <div className="org-empty">Loading employees…</div>;

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
        <select className="org-filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="all">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="ASSET_MANAGER">Asset Manager</option>
          <option value="DEPARTMENT_HEAD">Dept Head</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <select className="org-filter-select" value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}>
          <option value="all">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
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
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ departments: 0, categories: 0, employees: 0 });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [depRes, catRes, usrRes] = await Promise.all([
          api.get('/admin/departments'),
          api.get('/admin/categories'),
          api.get('/admin/employees'),
        ]);
        setDepartments(depRes.data);
        setUsers(usrRes.data);
        setCounts({
          departments: depRes.data.length,
          categories: catRes.data.length,
          employees: usrRes.data.length,
        });
      } catch (err) {
        console.error('Failed to load org counts');
      }
    }
    fetchCounts();
  }, []);

  const tabCounts = counts;

  return (
    <AppShell title="Workspace Settings">
      {/* Page header */}
      <div className="org-page-header">
        <div>
          <h1 className="org-page-title">Workspace Settings</h1>
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
      {activeTab === 'departments' && <DepartmentsTab users={users} />}
      {activeTab === 'categories'  && <CategoriesTab />}
      {activeTab === 'employees'   && <EmployeesTab departments={departments} />}
    </AppShell>
  );
}
