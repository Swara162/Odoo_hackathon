import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import OrganizationSetup from './OrganizationSetup';
import Dashboard from './Dashboard';
import AssetDirectory from './AssetDirectory';
import AllocationPage from './AllocationPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"        element={<div className="auth-layout"><LoginPage /></div>} />
        <Route path="/signup"       element={<div className="auth-layout"><SignupPage /></div>} />
        <Route path="/organization" element={<OrganizationSetup />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/assets"       element={<AssetDirectory />} />
        <Route path="/allocation"   element={<AllocationPage />} />
        {/* Fallback: redirect to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

