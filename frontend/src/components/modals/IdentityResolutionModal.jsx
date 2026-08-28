import React from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowDown, 
  Layers, 
  Database, 
  ShieldCheck, 
  Cpu,
  MapPin
} from 'lucide-react';

export function IdentityResolutionModal({ property, onClose }) {
  if (!property) return null;

  const confidence = Number(property.confidence_score || 96.8);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '820px', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3>
            <Sparkles size={18} color="#1a73e8" />
            <span>Property Identity Resolution Engine</span>
          </h3>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="identity-convergence-canvas">
            {/* Step 1: 3 Source Datasets Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Step 1: Multi-Source Cadastral Ingestion
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Independent records gathered across government & global open geospatial repositories
              </p>
            </div>

            {/* 3 Source Cards */}
            <div className="sources-row">
              {/* Source 1: Google */}
              <div className="source-card-v google">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#4285f4' }}>
                    <Database size={15} />
                    <span>Google Datasets</span>
                  </div>
                  <span className="source-status-chip matched">Active</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <div><strong>ID:</strong> G-IND-UP-4821</div>
                  <div><strong>Coords:</strong> {Number(property.latitude || 25.4358).toFixed(4)}, {Number(property.longitude || 81.8463).toFixed(4)}</div>
                  <div><strong>Polygon:</strong> Building Footprint (0.8m res)</div>
                  <div><strong>Layer:</strong> Google Open Buildings v3</div>
                </div>
              </div>

              {/* Source 2: SVAMITVA */}
              <div className="source-card-v svamitva">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#0f9d58' }}>
                    <ShieldCheck size={15} />
                    <span>SVAMITVA Drone</span>
                  </div>
                  <span className="source-status-chip matched">Active</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <div><strong>Flight:</strong> DRN-2025-08-PRY</div>
                  <div><strong>Village:</strong> {property.village}</div>
                  <div><strong>Abadi Area:</strong> {property.area_sq_m || 1250} m²</div>
                  <div><strong>Authority:</strong> MoPR Survey of India</div>
                </div>
              </div>

              {/* Source 3: e-Naksha */}
              <div className="source-card-v enaksha">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#f4b400' }}>
                    <Layers size={15} />
                    <span>e-Naksha Cadastre</span>
                  </div>
                  <span className="source-status-chip matched">Active</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <div><strong>Sheet No:</strong> UP-SH-412</div>
                  <div><strong>Khasra/Khata:</strong> Plot #108/2</div>
                  <div><strong>Owner Record:</strong> {property.owner_name}</div>
                  <div><strong>Land Registry:</strong> Revenue Dept UP</div>
                </div>
              </div>
            </div>

            {/* Convergence Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
              <ArrowDown size={28} className="animate-bounce" />
            </div>

            {/* Step 2: AI Matching Engine */}
            <div className="convergence-engine-node">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Cpu size={20} />
                <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                  AI-Assisted Multi-Feature Matching Engine
                </h4>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.9 }}>
                Deterministic feature scoring compares spatial coordinates, phonetic place names, and geometric boundaries.
              </p>

              {/* Feature Weights Breakdown */}
              <div className="feature-weights-grid">
                <div className="weight-pill">
                  <span>Village Normalization</span>
                  <strong>25%</strong>
                </div>
                <div className="weight-pill">
                  <span>Spatial Proximity (&lt;50m)</span>
                  <strong>25%</strong>
                </div>
                <div className="weight-pill">
                  <span>Block Code Match</span>
                  <strong>20%</strong>
                </div>
                <div className="weight-pill">
                  <span>Pincode Validation</span>
                  <strong>15%</strong>
                </div>
                <div className="weight-pill">
                  <span>Geometry Overlap</span>
                  <strong>10%</strong>
                </div>
                <div className="weight-pill">
                  <span>Attribute Similarity</span>
                  <strong>5%</strong>
                </div>
              </div>
            </div>

            {/* Convergence Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#188038' }}>
              <ArrowDown size={28} />
            </div>

            {/* Step 3: Unified Persistent Authoritative Identity */}
            <div className="unified-identity-node">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--verified-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--verified)',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--verified)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Authoritative Surface Property Identity
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                    {property.property_id}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Persistent ULPIN-ready identifier minted in central registry
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Reconciliation Confidence
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--verified)', fontFamily: 'var(--font-mono)' }}>
                  {confidence.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="action-btn primary" onClick={onClose}>
            Done Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
