import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { formatDisplayDate } from './utils/dateFormat';
import './Dashboard.css';
import './AppShell.css';

// ═══════════════════════════════════════════════
//  MOCK DATA — matches DB schema field names
// ═══════════════════════════════════════════════

const CURRENT_USER = {
  id: 1, full_name: 'Swara', email: 'swara@company.com', role: 'ADMIN',
  department_id: null, phone: '+91 98000 00001', is_active: true,
};

const MOCK_USERS = [
  CURRENT_USER,
  { id: 2, full_name: 'Priya Sharma',  email: 'priya@company.com',  role: 'DEPARTMENT_HEAD', department_id: 1, phone: '+91 98000 00002', is_active: true },
  { id: 3, full_name: 'Ravi Menon',    email: 'ravi@company.com',   role: 'ASSET_MANAGER',   department_id: 2, phone: '+91 98000 00003', is_active: true },
  { id: 4, full_name: 'Anjali Verma',  email: 'anjali@company.com', role: 'EMPLOYEE',        department_id: 1, phone: '+91 98000 00004', is_active: true },
  { id: 5, full_name: 'Siddharth Roy', email: 'sid@company.com',    role: 'EMPLOYEE',        department_id: 3, phone: '+91 98000 00005', is_active: true },
  { id: 6, full_name: 'Meera Nair',    email: 'meera@company.com',  role: 'EMPLOYEE',        department_id: 2, phone: '+91 98000 00006', is_active: true },
];

const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Engineering',  description: 'Software and infra', department_head_id: 2, is_active: true, created_at: '2024-01-10' },
  { id: 2, name: 'Operations',   description: 'Logistics and ops',  department_head_id: 3, is_active: true, created_at: '2024-01-12' },
  { id: 3, name: 'HR',           description: 'Human resources',    department_head_id: null, is_active: true, created_at: '2024-02-01' },
];

const MOCK_ASSETS = [
  { id: 1, name: 'MacBook Pro 16"',    asset_tag: 'AST-001', category_id: 1, department_id: 1, status: 'ALLOCATED',         purchase_price: 189999, condition: 'GOOD',   created_at: '2024-01-15' },
  { id: 2, name: 'Dell Monitor 27"',   asset_tag: 'AST-002', category_id: 2, department_id: 1, status: 'AVAILABLE',         purchase_price: 32000,  condition: 'GOOD',   created_at: '2024-01-20' },
  { id: 3, name: 'Epson Projector',    asset_tag: 'AST-003', category_id: 3, department_id: 2, status: 'AVAILABLE',         purchase_price: 65000,  condition: 'GOOD',   created_at: '2024-02-05' },
  { id: 4, name: 'Ergonomic Chair',    asset_tag: 'AST-004', category_id: 4, department_id: 2, status: 'UNDER_MAINTENANCE', purchase_price: 25000,  condition: 'FAIR',   created_at: '2024-02-10' },
  { id: 5, name: 'Logitech Webcam',    asset_tag: 'AST-005', category_id: 5, department_id: 3, status: 'AVAILABLE',         purchase_price: 8500,   condition: 'GOOD',   created_at: '2024-03-01' },
  { id: 6, name: 'ThinkPad X1 Carbon', asset_tag: 'AST-006', category_id: 1, department_id: 1, status: 'ALLOCATED',         purchase_price: 145000, condition: 'GOOD',   created_at: '2024-03-10' },
  { id: 7, name: 'Cisco IP Phone',     asset_tag: 'AST-007', category_id: 6, department_id: 3, status: 'LOST',              purchase_price: 18000,  condition: 'POOR',   created_at: '2024-03-15' },
  { id: 8, name: 'HP LaserJet Pro',    asset_tag: 'AST-008', category_id: 7, department_id: 2, status: 'RETIRED',           purchase_price: 35000,  condition: 'POOR',   created_at: '2024-01-05' },
  { id: 9, name: 'iPad Pro 12.9"',     asset_tag: 'AST-009', category_id: 8, department_id: 1, status: 'ALLOCATED',         purchase_price: 112000, condition: 'GOOD',   created_at: '2024-04-01' },
  { id: 10, name: 'Samsung Monitor',   asset_tag: 'AST-010', category_id: 2, department_id: 3, status: 'AVAILABLE',         purchase_price: 28000,  condition: 'GOOD',   created_at: '2024-04-12' },
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const daysAgo = (n) => new Date(today.getTime() - n * 86400000).toISOString().split('T')[0];
const daysLater = (n) => new Date(today.getTime() + n * 86400000).toISOString().split('T')[0];

const MOCK_ALLOCATIONS = [
  { id: 1, asset_id: 1, user_id: 4, allocation_status: 'ACTIVE',   allocated_date: daysAgo(30), expected_return: daysAgo(5),  actual_return: null, approved_by: 1, notes: '' },
  { id: 2, asset_id: 6, user_id: 2, allocation_status: 'ACTIVE',   allocated_date: daysAgo(20), expected_return: daysLater(3), actual_return: null, approved_by: 1, notes: '' },
  { id: 3, asset_id: 9, user_id: 5, allocation_status: 'ACTIVE',   allocated_date: daysAgo(10), expected_return: daysAgo(2),  actual_return: null, approved_by: 1, notes: '' },
  { id: 4, asset_id: 3, user_id: 6, allocation_status: 'RETURNED', allocated_date: daysAgo(60), expected_return: daysAgo(30), actual_return: daysAgo(28), approved_by: 1, notes: '' },
];

const MOCK_TRANSFER_REQUESTS = [
  { id: 1, asset_id: 2, from_department_id: 1, to_department_id: 2, requested_by: 4, approved_by: null, status: 'PENDING',  reason: 'Team relocation', created_at: daysAgo(2) },
  { id: 2, asset_id: 5, from_department_id: 3, to_department_id: 1, requested_by: 5, approved_by: null, status: 'PENDING',  reason: 'Project need',    created_at: daysAgo(1) },
  { id: 3, asset_id: 3, from_department_id: 2, to_department_id: 3, requested_by: 3, approved_by: 1,    status: 'APPROVED', reason: 'Training',        created_at: daysAgo(5) },
];

const MOCK_RESOURCE_BOOKINGS = [
  { id: 1, resource_name: 'Conference Room A', booked_by: 2, start_time: `${todayStr}T09:00:00`, end_time: `${todayStr}T10:30:00`, purpose: 'Sprint planning',   status: 'ONGOING',  created_at: daysAgo(1) },
  { id: 2, resource_name: 'Projector #2',      booked_by: 4, start_time: `${todayStr}T14:00:00`, end_time: `${todayStr}T15:00:00`, purpose: 'Client demo',       status: 'UPCOMING', created_at: daysAgo(1) },
  { id: 3, resource_name: 'Meeting Room B',    booked_by: 6, start_time: `${todayStr}T16:00:00`, end_time: `${todayStr}T17:00:00`, purpose: 'Team retrospective', status: 'UPCOMING', created_at: todayStr },
  { id: 4, resource_name: 'Training Lab',      booked_by: 3, start_time: daysLater(1) + 'T10:00:00', end_time: daysLater(1) + 'T12:00:00', purpose: 'Onboarding session', status: 'UPCOMING', created_at: todayStr },
];

const MOCK_MAINTENANCE_REQUESTS = [
  { id: 1, asset_id: 4, requested_by: 3, technician_name: 'Suresh K.',  priority: 'HIGH',   status: 'IN_PROGRESS', description: 'Broken armrest',        created_at: todayStr },
  { id: 2, asset_id: 7, requested_by: 5, technician_name: 'Rahul P.',   priority: 'MEDIUM', status: 'PENDING',     description: 'Screen flickering',     created_at: todayStr },
  { id: 3, asset_id: 8, requested_by: 6, technician_name: 'Amit S.',    priority: 'LOW',    status: 'APPROVED',    description: 'Toner replacement',     created_at: daysAgo(1) },
  { id: 4, asset_id: 1, requested_by: 4, technician_name: 'Suresh K.',  priority: 'HIGH',   status: 'RESOLVED',    description: 'Battery replacement',   created_at: daysAgo(3) },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, user_id: 1, notification_type: 'WARNING', title: 'Overdue Return',         message: 'MacBook Pro 16" is 5 days overdue.',         is_read: false, created_at: daysAgo(0) + 'T08:15:00' },
  { id: 2, user_id: 1, notification_type: 'INFO',    title: 'New Transfer Request',   message: 'Anjali Verma requested Dell Monitor transfer.', is_read: false, created_at: daysAgo(0) + 'T07:30:00' },
  { id: 3, user_id: 1, notification_type: 'SUCCESS', title: 'Maintenance Resolved',   message: 'Battery replacement on MacBook completed.',  is_read: true,  created_at: daysAgo(1) + 'T16:00:00' },
  { id: 4, user_id: 1, notification_type: 'INFO',    title: 'Booking Confirmed',      message: 'Conference Room A booked for sprint planning.', is_read: true,  created_at: daysAgo(1) + 'T10:00:00' },
  { id: 5, user_id: 1, notification_type: 'ERROR',   title: 'Asset Reported Lost',    message: 'Cisco IP Phone marked as lost by Siddharth.', is_read: true,  created_at: daysAgo(2) + 'T14:00:00' },
];

const MOCK_ACTIVITY_LOGS = [
  { id: 1, user_id: 4, action: 'CREATE',  entity_type: 'BOOKING',      entity_id: 2, description: 'Booked Projector #2 for client demo',       created_at: daysAgo(0) + 'T09:00:00' },
  { id: 2, user_id: 3, action: 'UPDATE',  entity_type: 'MAINTENANCE',  entity_id: 1, description: 'Started repair on Ergonomic Chair',          created_at: daysAgo(0) + 'T08:30:00' },
  { id: 3, user_id: 1, action: 'APPROVE', entity_type: 'TRANSFER',     entity_id: 3, description: 'Approved Epson Projector transfer to HR',     created_at: daysAgo(1) + 'T15:00:00' },
  { id: 4, user_id: 2, action: 'CREATE',  entity_type: 'ASSET',        entity_id: 10, description: 'Registered Samsung Monitor (AST-010)',       created_at: daysAgo(1) + 'T11:00:00' },
  { id: 5, user_id: 1, action: 'UPDATE',  entity_type: 'AUDIT',        entity_id: 1, description: 'Completed quarterly asset audit',             created_at: daysAgo(2) + 'T14:00:00' },
  { id: 6, user_id: 5, action: 'CREATE',  entity_type: 'MAINTENANCE',  entity_id: 2, description: 'Reported screen flickering on Cisco IP Phone', created_at: daysAgo(2) + 'T10:00:00' },
];

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}

const resolveUser = (id) => MOCK_USERS.find((u) => u.id === id)?.full_name || '—';
const resolveAsset = (id) => MOCK_ASSETS.find((a) => a.id === id)?.name || '—';
const resolveDept = (id) => MOCK_DEPARTMENTS.find((d) => d.id === id)?.name || '—';

const ENTITY_ICON = {
  ASSET:       { cls: 'act-icon-asset',       icon: 'ti-package' },
  BOOKING:     { cls: 'act-icon-booking',      icon: 'ti-calendar-event' },
  MAINTENANCE: { cls: 'act-icon-maintenance',  icon: 'ti-tool' },
  AUDIT:       { cls: 'act-icon-audit',        icon: 'ti-clipboard-check' },
  TRANSFER:    { cls: 'act-icon-transfer',     icon: 'ti-arrows-exchange' },
};

const NOTIF_ICON = {
  INFO:    { cls: 'notif-icon-info',    icon: 'ti-info-circle' },
  WARNING: { cls: 'notif-icon-warning', icon: 'ti-alert-triangle' },
  SUCCESS: { cls: 'notif-icon-success', icon: 'ti-circle-check' },
  ERROR:   { cls: 'notif-icon-error',   icon: 'ti-circle-x' },
};

const MAINT_CHIP = {
  PENDING:     'chip-amber',
  APPROVED:    'chip-blue',
  IN_PROGRESS: 'chip-purple',
  RESOLVED:    'chip-green',
};

const BOOKING_CHIP = {
  UPCOMING:  'chip-blue',
  ONGOING:   'chip-green',
  COMPLETED: 'chip-gray',
  CANCELLED: 'chip-red',
};

// ═══════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════

/* ── Loading skeleton grid ── */
function SkeletonKPIs() {
  return (
    <div className="kpi-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-kpi" />
      ))}
    </div>
  );
}
function SkeletonCards({ count = 2 }) {
  return (
    <div className="dash-two-col">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

/* ── KPI Card ── */
function KPICard({ icon, iconCls, label, value, trend, trendDir }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon-wrap ${iconCls}`}>
        <i className={`ti ${icon}`} aria-hidden="true"></i>
      </div>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {trend && (
        <span className={`kpi-trend ${trendDir === 'up' ? 'kpi-trend-up' : 'kpi-trend-down'}`}>
          <i className={`ti ${trendDir === 'up' ? 'ti-trending-up' : 'ti-trending-down'}`} aria-hidden="true"></i>
          {trend}
        </span>
      )}
    </div>
  );
}

/* ── Search ── */
function TopbarSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found = [];
    MOCK_ASSETS.forEach((a) => { if (a.name.toLowerCase().includes(q) || a.asset_tag.toLowerCase().includes(q)) found.push({ type: 'Asset', label: a.name, sub: a.asset_tag, icon: 'ti-package' }); });
    MOCK_USERS.forEach((u) => { if (u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) found.push({ type: 'User', label: u.full_name, sub: u.email, icon: 'ti-user' }); });
    MOCK_RESOURCE_BOOKINGS.forEach((b) => { if (b.resource_name.toLowerCase().includes(q) || b.purpose.toLowerCase().includes(q)) found.push({ type: 'Booking', label: b.resource_name, sub: b.purpose, icon: 'ti-calendar-event' }); });
    return found.slice(0, 8);
  }, [query]);

  return (
    <div className="dash-search-wrap">
      <i className="ti ti-search search-icon" aria-hidden="true"></i>
      <input
        className="dash-search-input"
        placeholder="Search assets, employees or bookings..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        aria-label="Search assets, employees or bookings"
      />
      {focused && query.trim() && (
        <div className="dash-search-results">
          {results.length === 0 ? (
            <div className="search-no-results">No results for "{query}"</div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="search-result-item" tabIndex={0}>
                <i className={`ti ${r.icon}`} aria-hidden="true"></i>
                <span>{r.label}</span>
                <span className="search-result-type">{r.type}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simulate API loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  // ── Computed KPIs ──
  const kpis = useMemo(() => {
    const assetsAvailable = MOCK_ASSETS.filter((a) => a.status === 'AVAILABLE').length;
    const assetsAllocated = MOCK_ALLOCATIONS.filter((a) => a.allocation_status === 'ACTIVE').length;
    const maintenanceToday = MOCK_MAINTENANCE_REQUESTS.filter((m) => m.created_at === todayStr && m.status !== 'RESOLVED').length;
    const activeBookings = MOCK_RESOURCE_BOOKINGS.filter((b) => b.status === 'UPCOMING' || b.status === 'ONGOING').length;
    const pendingTransfers = MOCK_TRANSFER_REQUESTS.filter((t) => t.status === 'PENDING').length;
    const upcomingReturns = MOCK_ALLOCATIONS.filter((a) => {
      if (a.allocation_status !== 'ACTIVE') return false;
      const d = daysBetween(todayStr, a.expected_return);
      return d >= 0 && d <= 7;
    }).length;
    return { assetsAvailable, assetsAllocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns };
  }, []);

  // ── Overdue allocations ──
  const overdueAllocations = useMemo(() => {
    return MOCK_ALLOCATIONS
      .filter((a) => a.allocation_status === 'ACTIVE' && new Date(todayStr) > new Date(a.expected_return))
      .map((a) => ({
        ...a,
        assetName: resolveAsset(a.asset_id),
        employeeName: resolveUser(a.user_id),
        daysOverdue: daysBetween(a.expected_return, todayStr),
      }));
  }, []);

  // ── Asset status summary ──
  const assetStatusSummary = useMemo(() => {
    const statusMap = { AVAILABLE: 0, ALLOCATED: 0, UNDER_MAINTENANCE: 0, LOST: 0, RETIRED: 0 };
    MOCK_ASSETS.forEach((a) => { if (statusMap[a.status] !== undefined) statusMap[a.status]++; });
    return statusMap;
  }, []);
  const totalAssets = MOCK_ASSETS.length;

  // ── Upcoming maintenance (non-RESOLVED) ──
  const upcomingMaintenance = useMemo(() => {
    return MOCK_MAINTENANCE_REQUESTS
      .filter((m) => m.status !== 'RESOLVED')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, []);

  // ── Today's bookings ──
  const todaysBookings = useMemo(() => {
    return MOCK_RESOURCE_BOOKINGS.filter((b) => b.start_time.startsWith(todayStr));
  }, []);

  // ── Department overview ──
  const deptOverview = useMemo(() => {
    return MOCK_DEPARTMENTS.filter((d) => d.is_active).map((dept) => {
      const deptAssets = MOCK_ASSETS.filter((a) => a.department_id === dept.id);
      const allocated = deptAssets.filter((a) => a.status === 'ALLOCATED').length;
      const available = deptAssets.filter((a) => a.status === 'AVAILABLE').length;
      return { ...dept, totalAssets: deptAssets.length, allocated, available };
    });
  }, []);

  // ── Recent activity (latest 6) ──
  const recentActivity = useMemo(() => {
    return [...MOCK_ACTIVITY_LOGS]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);
  }, []);

  // ── Recent notifications ──
  const recentNotifs = useMemo(() => {
    return [...MOCK_NOTIFICATIONS]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, []);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;

  const initials = CURRENT_USER.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── STATUS BAR CONFIG ──
  const statusBars = [
    { label: 'Available',         count: assetStatusSummary.AVAILABLE,         barCls: 'bar-green' },
    { label: 'Allocated',         count: assetStatusSummary.ALLOCATED,         barCls: 'bar-blue' },
    { label: 'Under Maintenance', count: assetStatusSummary.UNDER_MAINTENANCE, barCls: 'bar-amber' },
    { label: 'Lost',              count: assetStatusSummary.LOST,              barCls: 'bar-red' },
    { label: 'Retired',           count: assetStatusSummary.RETIRED,           barCls: 'bar-gray' },
  ];

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className={sidebarOpen ? 'sidebar open' : ''} style={sidebarOpen ? {} : undefined}>
        <Sidebar user={CURRENT_USER} />
      </div>

      <div className="app-content">
        {/* ── Topbar ── */}
        <header className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <i className="ti ti-menu-2" aria-hidden="true"></i>
          </button>
          <div className="dash-topbar-left">
            <span className="dash-welcome">{getGreeting()}, {CURRENT_USER.full_name} 👋</span>
            <span className="dash-welcome-sub">Here's an overview of your organization's assets.</span>
          </div>
          <div className="dash-topbar-right">
            <TopbarSearch />
            <button className="dash-notif-btn" aria-label={`Notifications, ${unreadCount} unread`} onClick={() => navigate('/notifications')}>
              <i className="ti ti-bell" aria-hidden="true"></i>
              {unreadCount > 0 && <span className="dash-notif-badge">{unreadCount}</span>}
            </button>
            <div className="dash-topbar-avatar" title={CURRENT_USER.full_name}>{initials}</div>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="dash-body">
          {loading ? (
            <>
              <SkeletonKPIs />
              <SkeletonCards count={2} />
              <SkeletonCards count={2} />
            </>
          ) : (
            <>
              {/* ── KPI Cards ── */}
              <section aria-label="Key metrics">
                <div className="kpi-grid">
                  <KPICard icon="ti-package"           iconCls="kpi-icon-green"  label="Assets Available"    value={kpis.assetsAvailable}   trend="+2 this week"   trendDir="up" />
                  <KPICard icon="ti-user-check"        iconCls="kpi-icon-blue"   label="Assets Allocated"    value={kpis.assetsAllocated}   trend="3 active"       trendDir="up" />
                  <KPICard icon="ti-tool"              iconCls="kpi-icon-amber"  label="Maintenance Today"   value={kpis.maintenanceToday}  trend="1 in progress"  trendDir="down" />
                  <KPICard icon="ti-calendar-event"    iconCls="kpi-icon-purple" label="Active Bookings"     value={kpis.activeBookings}    trend="2 upcoming"     trendDir="up" />
                  <KPICard icon="ti-arrows-exchange"   iconCls="kpi-icon-teal"   label="Pending Transfers"   value={kpis.pendingTransfers}  trend="2 pending"      trendDir="down" />
                  <KPICard icon="ti-clock-hour-4"      iconCls="kpi-icon-red"    label="Upcoming Returns"    value={kpis.upcomingReturns}   trend="Within 7 days"  trendDir="up" />
                </div>
              </section>

              {/* ── Overdue Returns ── */}
              <section aria-label="Overdue returns">
                <div className="overdue-panel">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-alert-triangle" aria-hidden="true"></i> Overdue Returns</h2>
                    <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{overdueAllocations.length} overdue</span>
                  </div>
                  <div className="dash-card-body">
                    {overdueAllocations.length === 0 ? (
                      <div className="empty-state">
                        <i className="ti ti-circle-check" aria-hidden="true"></i>
                        <span className="empty-state-text">No overdue assets</span>
                      </div>
                    ) : (
                      overdueAllocations.map((a) => (
                        <div className="overdue-row" key={a.id}>
                          <i className="ti ti-alert-circle overdue-warn-icon" aria-hidden="true"></i>
                          <div className="overdue-info">
                            <div className="overdue-asset">{a.assetName}</div>
                            <div className="overdue-meta">{a.employeeName} · Expected {formatDisplayDate(a.expected_return)}</div>
                          </div>
                          <span className="overdue-days">{a.daysOverdue} days overdue</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* ── Quick Actions ── */}
              <section aria-label="Quick actions">
                <h2 className="dash-section-title"><i className="ti ti-bolt" aria-hidden="true"></i> Quick Actions</h2>
                <div className="quick-actions-grid" style={{ marginTop: 12 }}>
                  {/* TODO: Wire onClick to navigate('/assets/new') */}
                  <button className="quick-action-card" onClick={() => navigate('/assets')}>
                    <div className="qa-icon qa-icon-blue"><i className="ti ti-plus" aria-hidden="true"></i></div>
                    <div className="qa-content">
                      <div className="qa-title">Register Asset</div>
                      <div className="qa-desc">Add a new asset to the inventory with all details.</div>
                    </div>
                  </button>
                  {/* TODO: Wire onClick to navigate('/bookings/new') */}
                  <button className="quick-action-card" onClick={() => navigate('/bookings')}>
                    <div className="qa-icon qa-icon-green"><i className="ti ti-calendar-plus" aria-hidden="true"></i></div>
                    <div className="qa-content">
                      <div className="qa-title">Book Resource</div>
                      <div className="qa-desc">Reserve a meeting room, projector, or shared resource.</div>
                    </div>
                  </button>
                  {/* TODO: Wire onClick to navigate('/maintenance/new') */}
                  <button className="quick-action-card" onClick={() => navigate('/maintenance')}>
                    <div className="qa-icon qa-icon-amber"><i className="ti ti-tools" aria-hidden="true"></i></div>
                    <div className="qa-content">
                      <div className="qa-title">Raise Maintenance Request</div>
                      <div className="qa-desc">Report an issue or schedule preventive maintenance.</div>
                    </div>
                  </button>
                </div>
              </section>

              {/* ── Row: Recent Activity + Notifications ── */}
              <div className="dash-two-col">
                {/* Recent Activity */}
                <section className="dash-card" aria-label="Recent activity">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-list-details" aria-hidden="true"></i> Recent Activity</h2>
                    <button className="dash-view-all" onClick={() => navigate('/activity-logs')}>View all</button>
                  </div>
                  <div className="dash-card-body">
                    {recentActivity.length === 0 ? (
                      <div className="empty-state">
                        <i className="ti ti-history" aria-hidden="true"></i>
                        <span className="empty-state-text">No recent activity</span>
                      </div>
                    ) : (
                      <div className="activity-list">
                        {recentActivity.map((act) => {
                          const ent = ENTITY_ICON[act.entity_type] || ENTITY_ICON.ASSET;
                          return (
                            <div className="activity-item" key={act.id}>
                              <div className={`activity-icon-wrap ${ent.cls}`}>
                                <i className={`ti ${ent.icon}`} aria-hidden="true"></i>
                              </div>
                              <div className="activity-body">
                                <div className="activity-action">{resolveUser(act.user_id)} · {act.action}</div>
                                <div className="activity-desc">{act.description}</div>
                                <div className="activity-meta">
                                  <span>{relativeTime(act.created_at)}</span>
                                  <span>{act.entity_type}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* Recent Notifications */}
                <section className="dash-card" aria-label="Recent notifications">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-bell" aria-hidden="true"></i> Recent Notifications</h2>
                    <button className="dash-view-all" onClick={() => navigate('/notifications')}>View All</button>
                  </div>
                  <div className="dash-card-body" style={{ paddingLeft: 28 }}>
                    {recentNotifs.length === 0 ? (
                      <div className="empty-state">
                        <i className="ti ti-bell-off" aria-hidden="true"></i>
                        <span className="empty-state-text">No notifications</span>
                      </div>
                    ) : (
                      <div className="notif-list">
                        {recentNotifs.map((n) => {
                          const ic = NOTIF_ICON[n.notification_type] || NOTIF_ICON.INFO;
                          return (
                            <div className={`notif-item ${!n.is_read ? 'unread' : ''}`} key={n.id}>
                              {!n.is_read && <div className="notif-unread-dot" />}
                              <div className={`notif-icon-wrap ${ic.cls}`}>
                                <i className={`ti ${ic.icon}`} aria-hidden="true"></i>
                              </div>
                              <div className="notif-body">
                                <div className="notif-title">{n.title}</div>
                                <div className="notif-msg">{n.message}</div>
                                <div className="notif-time">{relativeTime(n.created_at)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* ── Row: Asset Status Summary + Department Overview ── */}
              <div className="dash-two-col">
                {/* Asset Status Summary */}
                <section className="dash-card" aria-label="Asset status summary">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-chart-pie" aria-hidden="true"></i> Asset Status Summary</h2>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{totalAssets} total assets</span>
                  </div>
                  <div className="dash-card-body">
                    <div className="status-bar-list">
                      {statusBars.map((s) => (
                        <div className="status-bar-row" key={s.label}>
                          <div className="status-bar-label">
                            <span className="status-bar-name">{s.label}</span>
                            <span className="status-bar-count">{s.count}</span>
                          </div>
                          <div className="status-bar-track">
                            <div
                              className={`status-bar-fill ${s.barCls}`}
                              style={{ width: `${totalAssets ? (s.count / totalAssets) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Department Overview */}
                <section className="dash-card" aria-label="Department overview">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-building" aria-hidden="true"></i> Department Overview</h2>
                  </div>
                  <div className="dash-card-body">
                    {deptOverview.length === 0 ? (
                      <div className="empty-state">
                        <i className="ti ti-building-off" aria-hidden="true"></i>
                        <span className="empty-state-text">No departments</span>
                      </div>
                    ) : (
                      <div className="dept-list">
                        {deptOverview.map((d) => (
                          <div className="dept-row" key={d.id}>
                            <div className="dept-row-header">
                              <span className="dept-name">{d.name}</span>
                              <div className="dept-counts">
                                <span>{d.totalAssets} total</span>
                                <span>{d.allocated} allocated</span>
                                <span>{d.available} available</span>
                              </div>
                            </div>
                            <div className="dept-bar-track">
                              {d.totalAssets > 0 && (
                                <>
                                  <div className="dept-bar-alloc" style={{ width: `${(d.allocated / d.totalAssets) * 100}%` }} />
                                  <div className="dept-bar-avail" style={{ width: `${(d.available / d.totalAssets) * 100}%` }} />
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* ── Row: Upcoming Maintenance + Upcoming Bookings ── */}
              <div className="dash-two-col">
                {/* Upcoming Maintenance */}
                <section className="dash-card" aria-label="Upcoming maintenance">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-tool" aria-hidden="true"></i> Upcoming Maintenance</h2>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{upcomingMaintenance.length} requests</span>
                  </div>
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          <th>Priority</th>
                          <th>Technician</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingMaintenance.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className="empty-state"><i className="ti ti-tool-off" aria-hidden="true"></i><span className="empty-state-text">No maintenance requests</span></div>
                            </td>
                          </tr>
                        ) : (
                          upcomingMaintenance.map((m) => (
                            <tr key={m.id}>
                              <td style={{ fontWeight: 600 }}>{resolveAsset(m.asset_id)}</td>
                              <td>
                                <span className={`priority-dot priority-${m.priority.toLowerCase()}`}>{m.priority}</span>
                              </td>
                              <td>{m.technician_name}</td>
                              <td><span className={`chip ${MAINT_CHIP[m.status] || 'chip-gray'}`}>{m.status.replace('_', ' ')}</span></td>
                              <td style={{ color: '#6b7280' }}>{new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Upcoming Bookings */}
                <section className="dash-card" aria-label="Today's bookings">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title"><i className="ti ti-calendar-event" aria-hidden="true"></i> Today's Bookings</h2>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{todaysBookings.length} bookings</span>
                  </div>
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Resource</th>
                          <th>Booked By</th>
                          <th>Time</th>
                          <th>Purpose</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaysBookings.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className="empty-state"><i className="ti ti-calendar-off" aria-hidden="true"></i><span className="empty-state-text">No bookings today</span></div>
                            </td>
                          </tr>
                        ) : (
                          todaysBookings.map((b) => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600 }}>{b.resource_name}</td>
                              <td>{resolveUser(b.booked_by)}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>{formatTime(b.start_time)} – {formatTime(b.end_time)}</td>
                              <td style={{ color: '#6b7280' }}>{b.purpose}</td>
                              <td><span className={`chip ${BOOKING_CHIP[b.status] || 'chip-gray'}`}>{b.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
