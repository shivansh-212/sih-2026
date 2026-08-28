import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  Check, 
  FileCheck, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export function ConflictAuditModal({ property, onClose, onResolve }) {
  const [resolved, setResolved] = useState(false);
  const [resolutionAction, setResolutionAction] = useState('');

  if (!property) return null;

  const handleResolve = (actionName) => {
    setResolutionAction(actionName);
    setResolved(true);
    if (onResolve) {
      onResolve(property.property_id, actionName);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '740px', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'var(--danger-bg)' }}>
          <h3 style={{ color: 'var(--danger)' }}>
            <ShieldAlert size={20} />
            <span>AI Cadastral Data Audit — Discrepancy Resolution</span>
          </h3>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Discrepancy Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>
                Flagged Discrepancy
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {property.property_id}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                {property.village}, {property.block} • {property.district}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                AI Confidence Score
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                {Number(property.confidence_score || 42).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Conflict Analysis Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* SVAMITVA Layer */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#0f9d58' }}>
                <MapPin size={15} />
                <span>SVAMITVA Drone Record</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div><strong>Flight ID:</strong> DRN-2025-08-PRY</div>
                <div><strong>Centroid:</strong> 25.4340 N, 81.8520 E</div>
                <div><strong>Survey Method:</strong> High-res Orthomosaic Drone</div>
                <div><strong>Calculated Area:</strong> 980 m²</div>
              </div>
            </div>

            {/* e-Naksha Layer */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#f4b400' }}>
                <MapPin size={15} />
                <span>e-Naksha Cadastral Record</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div><strong>Map Sheet:</strong> UP-SH-413 (Plot #108)</div>
                <div><strong>Centroid:</strong> 25.4385 N, 81.8548 E</div>
                <div><strong>Survey Method:</strong> Digitized Revenue Map Sheet</div>
                <div><strong>Registered Area:</strong> 1,120 m²</div>
              </div>
            </div>
          </div>

          {/* Spatial Discrepancy Diagnostics */}
          <div
            style={{
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} color="#e37400" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--warning)' }}>
                Spatial Distance Difference: 487 Meters
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                The digitized historical revenue cadastral sheet (e-Naksha) exhibits an offset of 487m relative to the high-precision GPS drone imagery.
                Recommended Action: <strong>Deploy field surveyor for on-ground physical boundary pegging</strong> or <strong>adopt SVAMITVA high-precision drone centroid</strong>.
              </p>
            </div>
          </div>

          {/* Resolution Result Banner if taken */}
          {resolved ? (
            <div
              style={{
                background: 'var(--verified-bg)',
                border: '1px solid var(--verified-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--verified)',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              <Check size={18} />
              <span>Resolution Applied: <strong>{resolutionAction}</strong>. Audit trail updated.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="section-subtitle">Select Resolution Strategy</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  className="secondary-drawer-btn"
                  onClick={() => handleResolve('SVAMITVA Drone Centroid Approved')}
                  style={{ height: 'auto', padding: '10px', textAlign: 'center', fontSize: '11.5px' }}
                >
                  Adopt SVAMITVA (High-Res Drone)
                </button>

                <button
                  className="secondary-drawer-btn"
                  onClick={() => handleResolve('e-Naksha Revenue Registry Approved')}
                  style={{ height: 'auto', padding: '10px', textAlign: 'center', fontSize: '11.5px' }}
                >
                  Adopt e-Naksha (Historical Title)
                </button>

                <button
                  className="action-btn primary"
                  onClick={() => handleResolve('Scheduled for Field Ground Survey Re-visit')}
                  style={{ height: 'auto', padding: '10px', textAlign: 'center', fontSize: '11.5px' }}
                >
                  Dispatch Ground Surveyor
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
