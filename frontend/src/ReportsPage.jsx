import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import './ReportsPage.css';
import './AppShell.css';

const CURRENT_USER = {
  id: 1,
  full_name: 'Swara',
  role: 'ADMIN',
};

const INITIAL_ASSETS = [
  { id: 1, name: 'MacBook Pro 16"', department_id: 1, condition: 'GOOD', status: 'ALLOCATED' },
  { id: 2, name: 'Dell Monitor 27"', department_id: 1, condition: 'POOR', status: 'AVAILABLE' },
  { id: 3, name: 'Epson Projector', department_id: 2, condition: 'DAMAGED', status: 'UNDER_MAINTENANCE' },
  { id: 4, name: 'Ergonomic Chair', department_id: 2, condition: 'GOOD', status: 'AVAILABLE' },
];

const INITIAL_ALLOCATIONS = [
  { id: 1, asset_id: 1, allocation_status: 'ACTIVE' },
  { id: 2, asset_id: 1, allocation_status: 'ACTIVE' },
  { id: 3, asset_id: 2, allocation_status: 'RETURNED' },
  { id: 4, asset_id: 3, allocation_status: 'ACTIVE' },
];

const INITIAL_MAINTENANCE = [
  { id: 1, asset_id: 1, category_id: 1 },
  { id: 2, asset_id: 1, category_id: 1 },
  { id: 3, asset_id: 3, category_id: 3 },
];

const INITIAL_BOOKINGS = [
  { id: 1, resource_name: 'Conference Room A', start_time: '2026-07-12T09:00:00' },
  { id: 2, resource_name: 'Conference Room A', start_time: '2026-07-12T10:00:00' },
  { id: 3, resource_name: 'Projector #2', start_time: '2026-07-13T11:00:00' },
];

const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Operations' },
];

function BarChartCard({ title, data, labels, exportLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window.Chart === 'undefined') return;
    const chart = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
    return () => chart.destroy();
  }, [data, labels, title]);

  return (
    <div className="report-card">
      <div className="report-card-header">
        <h3>{title}</h3>
        <button className="report-export-btn" onClick={() => window.alert(`Export stub for ${exportLabel}`)}>
          Export
        </button>
      </div>
      <div className="report-chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function PieChartCard({ title, data, labels, colors, exportLabel }) {
  const total = data.reduce((sum, value) => sum + value, 0);
  const segments = data.reduce((acc, value, index) => {
    if (value <= 0) return acc;
    const start = acc.start;
    const end = start + (value / total) * 360;
    acc.parts.push(`${colors[index % colors.length]} ${start}deg ${end}deg`);
    acc.start = end;
    return acc;
  }, { parts: [], start: 0 });

  const pieStyle = {
    background: segments.parts.length > 0
      ? `conic-gradient(${segments.parts.join(', ')})`
      : '#e5e7eb',
  };

  return (
    <div className="report-card">
      <div className="report-card-header">
        <h3>{title}</h3>
        <button className="report-export-btn" onClick={() => window.alert(`Export stub for ${exportLabel}`)}>
          Export
        </button>
      </div>
      <div className="report-chart-wrap report-pie-wrap">
        <div className="report-pie-chart" style={pieStyle} />
        <div className="report-legend">
          {labels.map((label, index) => (
            <div key={label} className="report-legend-item">
              <span className="report-legend-swatch" style={{ background: colors[index % colors.length] }} />
              <span>{label}</span>
              <strong>{data[index]}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChartCard({ title, data, labels, exportLabel }) {
  const max = Math.max(...data, 1);
  const points = data.map((value, index) => `${(index / Math.max(data.length - 1, 1)) * 100},${100 - (value / max) * 80 - 10}`).join(' ');

  return (
    <div className="report-card">
      <div className="report-card-header">
        <h3>{title}</h3>
        <button className="report-export-btn" onClick={() => window.alert(`Export stub for ${exportLabel}`)}>
          Export
        </button>
      </div>
      <div className="report-chart-wrap report-line-wrap">
        <svg viewBox="0 0 100 100" className="report-line-chart" role="img" aria-label={title}>
          <line x1="0" y1="90" x2="100" y2="90" className="report-line-axis" />
          <polyline points={points} className="report-line-polyline" />
        </svg>
        <div className="report-axis-labels">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const utilizationData = useMemo(() => {
    const allocationCounts = INITIAL_ALLOCATIONS.reduce((acc, allocation) => {
      acc[allocation.asset_id] = (acc[allocation.asset_id] || 0) + 1;
      return acc;
    }, {});
    return INITIAL_ASSETS.map((asset) => allocationCounts[asset.id] || 0);
  }, []);

  const departmentData = useMemo(() => {
    const counts = INITIAL_DEPARTMENTS.reduce((acc, department) => ({ ...acc, [department.id]: 0 }), {});
    INITIAL_ALLOCATIONS.filter((allocation) => allocation.allocation_status === 'ACTIVE').forEach((allocation) => {
      const asset = INITIAL_ASSETS.find((item) => item.id === allocation.asset_id);
      if (asset) counts[asset.department_id] += 1;
    });
    return INITIAL_DEPARTMENTS.map((department) => counts[department.id] || 0);
  }, []);

  const maintenanceData = useMemo(() => {
    const counts = INITIAL_ASSETS.reduce((acc, asset) => ({ ...acc, [asset.id]: 0 }), {});
    INITIAL_MAINTENANCE.forEach((entry) => { counts[entry.asset_id] += 1; });
    return INITIAL_ASSETS.map((asset) => counts[asset.id] || 0);
  }, []);

  const heatmapCells = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, index) => index);
    const matrix = days.map(() => hours.map(() => 0));
    INITIAL_BOOKINGS.forEach((booking) => {
      const date = new Date(booking.start_time);
      const day = date.getDay();
      const hour = date.getHours();
      const row = day === 0 ? 6 : day - 1;
      matrix[row][hour] += 1;
    });
    return { days, hours, matrix };
  }, []);

  const retirementWatch = useMemo(() => {
    return INITIAL_ASSETS.filter((asset) => asset.condition === 'POOR' || asset.condition === 'DAMAGED');
  }, []);

  const statusBreakdown = useMemo(() => {
    const counts = { AVAILABLE: 0, ALLOCATED: 0, UNDER_MAINTENANCE: 0, LOST: 0, RETIRED: 0 };
    INITIAL_ASSETS.forEach((asset) => {
      counts[asset.status] = (counts[asset.status] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      data: Object.values(counts),
      colors: ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#6b7280'],
    };
  }, []);

  const trendData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [2, 3, 4, 5, 6, 7],
  }), []);

  return (
    <div className="app-shell">
      <Sidebar user={CURRENT_USER} />
      <div className="app-content">
        <main className="reports-page">
          <header className="reports-topbar">
            <div>
              <p className="reports-eyebrow">AssetFlow / Reports</p>
              <h1 className="reports-title">Reports & Analytics</h1>
            </div>
          </header>

          {loading ? (
            <div className="reports-loading">Loading analytics…</div>
          ) : (
            <div className="reports-grid">
              <BarChartCard title="Asset utilization" data={utilizationData} labels={INITIAL_ASSETS.map((asset) => asset.name)} exportLabel="asset-utilization" />
              <PieChartCard title="Asset status distribution" data={statusBreakdown.data} labels={statusBreakdown.labels} colors={statusBreakdown.colors} exportLabel="asset-status" />
              <LineChartCard title="Allocation trend" data={trendData.data} labels={trendData.labels} exportLabel="allocation-trend" />
              <BarChartCard title="Department allocation summary" data={departmentData} labels={INITIAL_DEPARTMENTS.map((department) => department.name)} exportLabel="department-allocation" />
              <BarChartCard title="Maintenance frequency" data={maintenanceData} labels={INITIAL_ASSETS.map((asset) => asset.name)} exportLabel="maintenance-frequency" />

              <div className="report-card">
                <div className="report-card-header">
                  <h3>Resource booking heatmap</h3>
                  <button className="report-export-btn" onClick={() => window.alert('Export stub for booking-heatmap')}>Export</button>
                </div>
                <div className="heatmap-grid" role="img" aria-label="Booking density heatmap">
                  <div className="heatmap-axis" />
                  {heatmapCells.days.map((day) => <div key={day} className="heatmap-day">{day}</div>)}
                  {heatmapCells.hours.map((hour) => (
                    <React.Fragment key={hour}>
                      <div className="heatmap-hour">{String(hour).padStart(2, '0')}:00</div>
                      {heatmapCells.matrix.map((row, index) => (
                        <div key={`${hour}-${index}`} className={`heatmap-cell level-${row[hour]}`} title={`${heatmapCells.days[index]} ${hour}:00 → ${row[hour]} booking(s)`} />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="report-card report-table-card">
                <div className="report-card-header">
                  <h3>Assets nearing retirement or due for maintenance</h3>
                  <button className="report-export-btn" onClick={() => window.alert('Export stub for asset-watchlist')}>Export</button>
                </div>
                {retirementWatch.length === 0 ? (
                  <div className="empty-state">No watchlist items today</div>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr><th>Asset</th><th>Condition</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {retirementWatch.map((asset) => (
                        <tr key={asset.id}>
                          <td>{asset.name}</td>
                          <td>{asset.condition}</td>
                          <td>{asset.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
