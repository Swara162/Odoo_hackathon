// src/components/PageHeader.jsx
import React from 'react';
import './PageHeader.css';

/**
 * Shared page header used across all inner pages.
 *
 * Props:
 *  - eyebrow   {string}      small breadcrumb label, e.g. "AssetFlow / Audit"
 *  - title     {string}      main page title (rendered as <h1>)
 *  - subtitle  {string?}     optional subtitle / description
 *  - icon      {ReactNode?}  optional Lucide icon before the eyebrow text
 *  - actions   {ReactNode?}  optional right-side slot (buttons, dropdowns, etc.)
 *  - divider   {boolean?}    whether to render the separator line below (default true)
 */
export default function PageHeader({ eyebrow, title, subtitle, icon, actions, divider = true }) {
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          {eyebrow && (
            <p className="page-header-eyebrow">
              {icon && <span className="page-header-icon">{icon}</span>}
              {eyebrow}
            </p>
          )}
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>

        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>

      {divider && <div className="page-header-divider" />}
    </>
  );
}
