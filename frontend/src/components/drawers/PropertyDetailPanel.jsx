import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MapPin, 
  Sparkles, 
  Building, 
  Home, 
  Layers, 
  AlertOctagon, 
  ExternalLink, 
  CheckCircle2, 
  ShieldAlert, 
  FileText,
  User,
  Phone,
  Camera
} from 'lucide-react';

export function PropertyDetailPanel({
  property,
  onClose,
  onOpenIdentityResolution,
  onOpenConflictAudit,
}) {
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(property.property_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidence = Number(property.confidence_score || 94.5);
  const status = property.status || 'PENDING';

  // Determine confidence bar color
  let barColor = '#188038';
  if (confidence < 60) barColor = '#d93025';
  else if (confidence < 85) barColor = '#e37400';

  return (
    <aside className="property-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="property-id-badge"
              onClick={handleCopyId}
              title="Click to copy authoritative BHU-ID"
            >
              {property.property_id}
              {copied ? <Check size={14} color="#188038" /> : <Copy size={14} />}
            </span>
            <span className={`status-badge ${status.toLowerCase()}`}>
              {status}
            </span>
          </div>
          <div className="property-location-crumb">
            {property.village}, {property.block} • {property.district}, {property.state} (PIN {property.pincode})
          </div>
        </div>

        <button className="drawer-close-btn" onClick={onClose} title="Close Panel">
          <X size={18} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="drawer-content">
        {/* AI Confidence Meter Card */}
        <div className="ai-confidence-card">
          <div className="confidence-header">
            <div className="confidence-title">
              <Sparkles size={16} color="#1a73e8" />
              <span>AI Reconciliation Confidence</span>
            </div>
            <span className="confidence-score">{confidence.toFixed(1)}%</span>
          </div>

          <div className="confidence-bar-bg">
            <div
              className="confidence-bar-fill"
              style={{
                width: `${confidence}%`,
                background: barColor,
              }}
            />
          </div>

          <div className="confidence-footer-text">
            {confidence >= 85 ? (
              <span style={{ color: 'var(--verified)', fontWeight: 600 }}>
                High-confidence multi-source match across 3 government datasets.
              </span>
            ) : confidence >= 60 ? (
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                Possible match. Subtle geographic boundary difference detected.
              </span>
            ) : (
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                Discrepancy flagged. Location mismatch exceeds 150m threshold.
              </span>
            )}
          </div>
        </div>

        {/* Conflict Notice if Applicable */}
        {(status === 'CONFLICT' || status === 'WARNING' || confidence < 80) && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 700, fontSize: '12px' }}>
              <ShieldAlert size={16} />
              <span>Cadastral Data Discrepancy Flagged</span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {property.conflict_reason ||
                'SVAMITVA drone boundary differs by 487m from e-Naksha cadastral map sheet. Manual reconciliation recommended.'}
            </p>
            <button
              onClick={() => onOpenConflictAudit(property)}
              style={{
                alignSelf: 'flex-start',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--danger)',
                textDecoration: 'underline',
                paddingTop: '2px',
              }}
            >
              Inspect Conflict Details →
            </button>
          </div>
        )}

        {/* Multi-Source Datasets Integration */}
        <div className="sources-card">
          <span className="section-subtitle">Multi-Dataset Ingestion Status</span>

          <div className="source-item-row">
            <div className="source-brand">
              <span style={{ color: '#4285f4', fontWeight: 700 }}>Google</span>
              <span>Open Buildings / Maps</span>
            </div>
            <span className="source-status-chip matched">Matched</span>
          </div>

          <div className="source-item-row">
            <div className="source-brand">
              <span style={{ color: '#0f9d58', fontWeight: 700 }}>SVAMITVA</span>
              <span>Panchayati Raj Drone Layer</span>
            </div>
            <span className={`source-status-chip ${status === 'CONFLICT' ? 'conflict' : 'matched'}`}>
              {status === 'CONFLICT' ? 'Discrepancy' : 'Matched'}
            </span>
          </div>

          <div className="source-item-row">
            <div className="source-brand">
              <span style={{ color: '#f4b400', fontWeight: 700 }}>e-Naksha</span>
              <span>Cadastral Land Records</span>
            </div>
            <span className={`source-status-chip ${status === 'WARNING' ? 'pending' : status === 'CONFLICT' ? 'conflict' : 'matched'}`}>
              {status === 'WARNING' ? 'Partial' : status === 'CONFLICT' ? 'Discrepancy' : 'Matched'}
            </span>
          </div>
        </div>

        {/* Spatial & Structural Attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="section-subtitle">Parcel & Structure Specifications</span>
          <div className="attributes-grid">
            <div className="attr-box">
              <span className="attr-title">Coordinates</span>
              <span className="attr-val">
                {Number(property.latitude || 25.4358).toFixed(4)}, {Number(property.longitude || 81.8463).toFixed(4)}
              </span>
            </div>

            <div className="attr-box">
              <span className="attr-title">Parcel Area</span>
              <span className="attr-val">
                {property.area_sq_m ? `${property.area_sq_m} m²` : '1,250 m²'}
              </span>
            </div>

            <div className="attr-box">
              <span className="attr-title">Property Type</span>
              <span className="attr-val">{property.property_type || 'Residential'}</span>
            </div>

            <div className="attr-box">
              <span className="attr-title">Structure Frame</span>
              <span className="attr-val">{property.build_material || 'Brick / Masonry'}</span>
            </div>

            <div className="attr-box">
              <span className="attr-title">Floors & Roof</span>
              <span className="attr-val">
                {property.floors || 1} Floor • {property.roof_type || 'Flat RCC'}
              </span>
            </div>

            <div className="attr-box">
              <span className="attr-title">Physical State</span>
              <span className="attr-val">{property.condition || 'Good'}</span>
            </div>
          </div>
        </div>

        {/* Owner & Surveyor Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="section-subtitle">Ownership & Field Verification</span>
          <div className="attributes-grid">
            <div className="attr-box">
              <span className="attr-title">Citizen Owner</span>
              <span className="attr-val" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="#1a73e8" />
                {property.owner_name || 'Rameshwar Prasad'}
              </span>
            </div>

            <div className="attr-box">
              <span className="attr-title">Field Surveyor</span>
              <span className="attr-val">
                {property.field_worker || 'Sarah Jenkins (Surveyor)'}
              </span>
            </div>
          </div>
        </div>

        {/* Site Survey Photos */}
        {property.site_photos && property.site_photos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={13} />
              <span>Ground Survey Photos</span>
            </span>
            <div className="photos-strip">
              {property.site_photos.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Survey Site ${idx + 1}`}
                  className="photo-thumb"
                  onClick={() => window.open(url, '_blank')}
                  title="Click to view full photo"
                />
              ))}
            </div>
          </div>
        )}

        {/* Drawer Action Buttons */}
        <div className="drawer-actions">
          <button
            className="primary-drawer-btn"
            onClick={() => onOpenIdentityResolution(property)}
          >
            <Sparkles size={16} />
            <span>View Identity Resolution (3 Sources)</span>
          </button>

          <button
            className="secondary-drawer-btn"
            onClick={() => onOpenConflictAudit(property)}
          >
            <FileText size={15} />
            <span>Open AI Cadastral Audit</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
