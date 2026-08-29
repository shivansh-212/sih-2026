import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Crosshair, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  User, 
  Plus,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';

export function FieldCaptureModal({ onClose, onCaptured, currentCenter }) {
  const [formData, setFormData] = useState({
    village: 'Lakshmipur',
    block: 'Koraon',
    district: 'Prayagraj',
    state: 'Uttar Pradesh',
    pincode: '212306',
    latitude: currentCenter ? currentCenter.lat.toFixed(6) : '25.437000',
    longitude: currentCenter ? currentCenter.lng.toFixed(6) : '81.847500',
    area_sq_m: '850',
    property_type: 'Residential (Detached)',
    build_material: 'Brick / Masonry',
    floors: '1',
    roof_type: 'Flat RCC',
    condition: 'Good',
    owner_name: 'Rajesh Sharma',
    owner_phone: '+91 98395 11223',
  });

  const [checkingDup, setCheckingDup] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  // Check duplicate near coordinates
  const handleCheckDuplicates = async () => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    setCheckingDup(true);
    try {
      const res = await api.properties.checkDuplicate(lat, lng, 50);
      if (res && res.has_duplicate) {
        setDuplicateWarning(res.duplicates[0]);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      setDuplicateWarning(null);
    }
    setCheckingDup(false);
  };

  // Get browser GPS
  const handleGetGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
        },
        () => {
          // fallback slight offset
          setFormData((prev) => ({
            ...prev,
            latitude: (25.436 + (Math.random() - 0.5) * 0.005).toFixed(6),
            longitude: (81.847 + (Math.random() - 0.5) * 0.005).toFixed(6),
          }));
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      area_sq_m: parseFloat(formData.area_sq_m),
      floors: parseInt(formData.floors, 10),
    };

    const res = await api.properties.capture(payload);
    setIsSubmitting(false);

    if (res && res.success) {
      const prop = res.data || res.property || res;
      if (prop && prop.property_id) {
        setSuccessResult(prop);
        if (onCaptured) onCaptured(prop);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '680px', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3>
            <MapPin size={18} color="#1a73e8" />
            <span>Field Surveyor Mobile Parcel Capture</span>
          </h3>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {successResult ? (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--verified-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--verified)',
                }}
              >
                <CheckCircle2 size={38} />
              </div>

              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Persistent BHU-ID Minted!
                </h4>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-block',
                    marginTop: '8px',
                  }}
                >
                  {successResult.property_id}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Property captured in <strong>{successResult.village}</strong> and broadcasted via real-time WebSocket telemetry.
                </p>
              </div>

              <button className="action-btn primary" onClick={onClose} style={{ marginTop: '12px' }}>
                View on Map
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Coordinates Section */}
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="section-subtitle" style={{ color: 'var(--primary)' }}>
                    Spatial Coordinates (WGS84)
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="filter-chip"
                      onClick={handleGetGPS}
                      title="Acquire GPS from device"
                    >
                      <Crosshair size={12} />
                      Acquire GPS
                    </button>
                    <button
                      type="button"
                      className="filter-chip"
                      onClick={handleCheckDuplicates}
                      title="Run duplicate check (<50m)"
                    >
                      Check 50m Duplicates
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Latitude</label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Longitude</label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Duplicate Warning Callout */}
                {duplicateWarning && (
                  <div
                    style={{
                      background: 'var(--warning-bg)',
                      border: '1px solid var(--warning-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px',
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <AlertTriangle size={16} color="#e37400" />
                    <span>
                      Potential Duplicate Found: <strong>{duplicateWarning.property_id}</strong> is within 50m of these coordinates.
                    </span>
                  </div>
                )}
              </div>

              {/* Administrative Hierarchy */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Village</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Block</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Pincode</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Structural Characteristics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Property Type</label>
                  <select
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px', fontSize: '13px' }}
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  >
                    <option value="Residential (Detached)">Residential (Detached)</option>
                    <option value="Residential (Semi-Detached)">Residential (Semi-Detached)</option>
                    <option value="Commercial Single Story">Commercial Single Story</option>
                    <option value="Agricultural Parcel">Agricultural Parcel</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Structure Material</label>
                  <select
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px', fontSize: '13px' }}
                    value={formData.build_material}
                    onChange={(e) => setFormData({ ...formData, build_material: e.target.value })}
                  >
                    <option value="Brick / Masonry">Brick / Masonry</option>
                    <option value="Concrete Frame">Concrete Frame</option>
                    <option value="Steel Frame & Masonry">Steel Frame & Masonry</option>
                    <option value="Adobe / Mud Brick">Adobe / Mud Brick</option>
                  </select>
                </div>
              </div>

              {/* Citizen Owner Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Citizen / Owner Name</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated Area (m²)</label>
                  <input
                    type="number"
                    className="search-input"
                    style={{ background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: '100%', marginTop: '4px' }}
                    value={formData.area_sq_m}
                    onChange={(e) => setFormData({ ...formData, area_sq_m: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-footer" style={{ margin: '0 -24px -24px -24px' }}>
                <button type="button" className="action-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="action-btn primary" disabled={isSubmitting}>
                  <Sparkles size={16} />
                  <span>{isSubmitting ? 'Minting BHU-ID...' : 'Submit & Mint Authoritative ID'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
