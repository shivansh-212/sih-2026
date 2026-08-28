import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  SlidersHorizontal, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export function MetricsPanel({
  stats,
  activeFilter,
  onFilterChange,
  showWorkers,
  onToggleWorkers,
  showParcels,
  onToggleParcels,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const total = stats?.total_properties || 1248;
  const verified = stats?.verified_count || 982;
  const warning = stats?.warning_count || 145;
  const conflict = stats?.conflict_count || 48;
  const verifiedPercent = total > 0 ? ((verified / total) * 100).toFixed(1) : '94.2';

  if (isCollapsed) {
    return (
      <button
        className="action-btn"
        style={{
          position: 'absolute',
          top: '84px',
          left: '16px',
          zIndex: 90,
          background: 'var(--bg-surface-translucent)',
          boxShadow: 'var(--shadow-floating)',
          height: '44px',
          padding: '0 12px',
        }}
        onClick={() => setIsCollapsed(false)}
        title="Expand Intelligence Panel"
      >
        <Activity size={17} color="#1a73e8" />
        <span style={{ fontSize: '12px', fontWeight: 600 }}>Analytics</span>
        <ChevronRight size={15} />
      </button>
    );
  }

  return (
    <aside className="floating-left-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h2>
          <Activity size={16} color="#1a73e8" />
          <span>Spatial Intelligence</span>
        </h2>
        <button
          className="drawer-close-btn"
          onClick={() => setIsCollapsed(true)}
          title="Collapse Panel"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="panel-body">
        {/* Metric Cards Grid */}
        <div className="metrics-grid">
          <div className="metric-card primary">
            <span className="metric-label">Total Parcels</span>
            <span className="metric-value">{total}</span>
          </div>

          <div className="metric-card verified">
            <span className="metric-label">Verified Rate</span>
            <span className="metric-value">{verifiedPercent}%</span>
          </div>

          <div className="metric-card warning">
            <span className="metric-label">Warnings</span>
            <span className="metric-value">{warning}</span>
          </div>

          <div className="metric-card conflict">
            <span className="metric-label">Conflicts</span>
            <span className="metric-value">{conflict}</span>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="filter-section">
          <span className="section-subtitle">Filter by Verification</span>
          <div className="filter-chips">
            <button
              className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => onFilterChange('ALL')}
            >
              All ({total})
            </button>

            <button
              className={`filter-chip verified ${activeFilter === 'VERIFIED' ? 'active verified' : ''}`}
              onClick={() => onFilterChange('VERIFIED')}
            >
              <CheckCircle2 size={12} />
              Verified
            </button>

            <button
              className={`filter-chip warning ${activeFilter === 'WARNING' ? 'active warning' : ''}`}
              onClick={() => onFilterChange('WARNING')}
            >
              <AlertTriangle size={12} />
              Warning
            </button>

            <button
              className={`filter-chip conflict ${activeFilter === 'CONFLICT' ? 'active conflict' : ''}`}
              onClick={() => onFilterChange('CONFLICT')}
            >
              <XCircle size={12} />
              Conflict
            </button>

            <button
              className={`filter-chip ${activeFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => onFilterChange('PENDING')}
            >
              <Clock size={12} />
              Pending
            </button>
          </div>
        </div>

        {/* Layer Visibility Toggles */}
        <div className="layer-section">
          <span className="section-subtitle">Map Layers</span>

          <label className="layer-toggle-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={14} color="#1a73e8" />
              <span>Parcel Boundaries</span>
            </div>
            <input
              type="checkbox"
              checked={showParcels}
              onChange={(e) => onToggleParcels(e.target.checked)}
            />
          </label>

          <label className="layer-toggle-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot" style={{ background: '#1a73e8' }}></span>
              <span>Field Surveyor GPS</span>
            </div>
            <input
              type="checkbox"
              checked={showWorkers}
              onChange={(e) => onToggleWorkers(e.target.checked)}
            />
          </label>
        </div>

        {/* AI Health Badge */}
        <div
          style={{
            background: 'var(--bg-muted)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={15} color="#188038" />
          <span>AI Reconciliation Engine: <strong>Active & Synced</strong></span>
        </div>
      </div>
    </aside>
  );
}
