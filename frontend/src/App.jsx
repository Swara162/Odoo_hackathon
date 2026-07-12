import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import OrganizationSetup from './OrganizationSetup';
import Dashboard from './Dashboard';
import AssetDirectory from './AssetDirectory';
import AllocationPage from './AllocationPage';
import ResourceBookingPage from './ResourceBookingPage';
import MaintenancePage from './MaintenancePage';
import AuditPage from './AuditPage';
import ReportsPage from './ReportsPage';
import ActivityNotificationsPage from './ActivityNotificationsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div className="auth-layout"><LoginPage /></div>} />
        <Route path="/signup" element={<div className="auth-layout"><SignupPage /></div>} />
        <Route path="/organization" element={<OrganizationSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<AssetDirectory />} />
        <Route path="/allocation" element={<AllocationPage />} />
        <Route path="/bookings" element={<ResourceBookingPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<ActivityNotificationsPage />} />
        <Route path="/activity-logs" element={<ActivityNotificationsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

