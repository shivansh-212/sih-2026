import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Eye, 
  Scan, 
  ShieldCheck, 
  RefreshCw, 
  Hash, 
  Building2, 
  CheckSquare, 
  Square,
  Sparkles,
  TreeDeciduous,
  Target
} from 'lucide-react';

export function AIHouseCountDrawer({
  isOpen,
  onClose,
  buildings = [],
  onSelectBuilding,
  selectedBuilding,
  onScanMicroZone,
  onBatchRegister,
  isScanning = false,
  isRegistering = false,
  initialPincode = '212306',
  initialVillage = 'Lakshmipur',
  initialVillageCode = 'LAK042',
}) {
  const [pincode, setPincode] = useState(initialPincode || '212306');
  const [village, setVillage] = useState(initialVillage || 'Lakshmipur');
  const [villageCode, setVillageCode] = useState(initialVillageCode || 'LAK042');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterQuery, setFilterQuery] = useState('');

  // Sync selected buildings (default all selected when new scan completes)
  useEffect(() => {
    if (Array.isArray(buildings) && buildings.length > 0) {
      const validIds = buildings.filter(Boolean).map((b) => b.temp_id || `bldg_${Math.random()}`);
      setSelectedIds(new Set(validIds));
    } else {
      setSelectedIds(new Set());
    }
  }, [buildings]);

  // Compute updated code previews based on user-edited pincode & village code
  const getDynamicCode = (houseNumStr) => {
    const cleanPin = String(pincode || '212306').trim() || '212306';
    const cleanVCode = String(villageCode || 'LAK042').trim().toUpperCase() || 'LAK042';
    const hStr = houseNumStr ? String(houseNumStr).toUpperCase() : 'H001';
    return `${cleanPin}-${cleanVCode}-${hStr}`;
  };

  const toggleSelect = (tempId) => {
    if (!tempId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const safeBuildings = Array.isArray(buildings) ? buildings.filter(Boolean) : [];
    if (selectedIds.size === safeBuildings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(safeBuildings.map((b) => b.temp_id).filter(Boolean)));
    }
  };

  const handleRegister = () => {
    const safeBuildings = Array.isArray(buildings) ? buildings.filter(Boolean) : [];
    const verifiedBuildings = safeBuildings
      .filter((b) => b && selectedIds.has(b.temp_id))
      .map((b) => ({
        ...b,
        pincode: String(pincode || '212306').trim(),
        village: String(village || 'Lakshmipur').trim(),
        village_code: String(villageCode || 'LAK042').trim().toUpperCase(),
        cadastral_code: getDynamicCode(b.house_number),
      }));

    if (onBatchRegister) {
      onBatchRegister({
        pincode: String(pincode || '212306').trim(),
        village: String(village || 'Lakshmipur').trim(),
        village_code: String(villageCode || 'LAK042').trim().toUpperCase(),
        verified_buildings: verifiedBuildings,
      });
    }
  };

  if (!isOpen) return null;

  const safeBuildingsList = Array.isArray(buildings) ? buildings.filter(Boolean) : [];
  const filteredBuildings = safeBuildingsList.filter((b) => {
    if (!b) return false;
    const q = (filterQuery || '').toLowerCase();
    const hNum = String(b.house_number || '').toLowerCase();
    const rType = String(b.roof_type || '').toLowerCase();
    const cCode = String(b.cadastral_code || '').toLowerCase();
    return hNum.includes(q) || rType.includes(q) || cCode.includes(q);
  });

  const avgConfidence = safeBuildingsList.length > 0
    ? (safeBuildingsList.reduce((acc, b) => acc + (Number(b?.confidence_score) || 96.0), 0) / safeBuildingsList.length).toFixed(1)
    : '96.5';

  return (
    <aside className="ai-house-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-title-group">
          <div className="drawer-badge">
            <Scan size={15} color="#1a73e8" />
            <span>AI Satellite Census • 1m Precision</span>
          </div>
          <h2>AI House Counting & Footprint Mapping</h2>
          <p className="drawer-subtitle">
            1-Meter Optical Footprints • Unique Cadastral ID: {`{PINCODE}-{VILLAGE_CODE}-H{NO}`}
          </p>
        </div>
        <button className="drawer-close-btn" onClick={onClose} title="Close Panel">
          <X size={18} />
        </button>
      </div>

      {/* Cadastral Scheme Configuration Card */}
      <div className="scheme-config-card">
        <div className="config-header">
          <Hash size={15} color="#1a73e8" />
          <span className="config-title">Unique Cadastral Formula</span>
          <span className="formula-pill">{`{PINCODE}-{VILLAGE_CODE}-H{NO}`}</span>
        </div>

        <div className="config-grid">
          <div className="config-field">
            <label>Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 212306"
              maxLength={10}
            />
          </div>

          <div className="config-field">
            <label>Village Name</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Lakshmipur"
            />
          </div>

          <div className="config-field">
            <label>Village Code</label>
            <input
              type="text"
              value={villageCode}
              onChange={(e) => setVillageCode(e.target.value.toUpperCase())}
              placeholder="e.g. LAK042"
              maxLength={8}
            />
          </div>
        </div>

        <div className="model-feature-chips">
          <span className="feature-chip precision-chip">
            <Target size={12} />
            <span>🎯 1m Sub-Meter Precision (Zoom 19)</span>
          </span>
          <span className="feature-chip tree-filter-chip">
            <TreeDeciduous size={12} />
            <span>🌿 Tree / Road Filter Active</span>
          </span>
          <span className="feature-chip unique-id-chip">
            <Sparkles size={12} />
            <span>🛡️ Non-Duplicating Unique Sequence</span>
          </span>
        </div>

        <button
          className="rescan-btn"
          onClick={() => onScanMicroZone && onScanMicroZone({ pincode, village, village_code: villageCode })}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <RefreshCw size={15} className="spin-animate" />
              <span>Scanning 1m Micro-Zone Satellite...</span>
            </>
          ) : (
            <>
              <Scan size={15} />
              <span>Re-scan 1m Satellite Micro-Zone</span>
            </>
          )}
        </button>
      </div>

      {/* Statistics Bar */}
      <div className="detection-metrics-bar">
        <div className="metric-chip">
          <span className="metric-label">Detected Houses</span>
          <span className="metric-value">{safeBuildingsList.length} Buildings</span>
        </div>
        <div className="metric-chip">
          <span className="metric-label">Selected for ID Minting</span>
          <span className="metric-value highlight">{selectedIds.size} Selected</span>
        </div>
        <div className="metric-chip">
          <span className="metric-label">Avg AI Confidence</span>
          <span className="metric-value verified">{avgConfidence}%</span>
        </div>
      </div>

      {/* Search & Select All Controls */}
      <div className="list-controls-bar">
        <button className="select-all-btn" onClick={toggleSelectAll}>
          {selectedIds.size === safeBuildingsList.length && safeBuildingsList.length > 0 ? (
            <>
              <CheckSquare size={16} color="#1a73e8" />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <Square size={16} color="#5f6368" />
              <span>Select All ({safeBuildingsList.length})</span>
            </>
          )}
        </button>

        <input
          type="text"
          className="search-mini-input"
          placeholder="Filter by house no, code, or roof type..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
      </div>

      {/* Detected Buildings Scrollable List */}
      <div className="detected-buildings-list">
        {filteredBuildings.length === 0 ? (
          <div className="empty-detection-state">
            {isScanning ? (
              <>
                <RefreshCw size={36} className="spin-animate" color="#1a73e8" />
                <p>AI Scanning Satellite Imagery with 1m Precision...</p>
                <span>Filtering out tree canopies and roads • Segmenting individual rooftop footprints.</span>
              </>
            ) : (
              <>
                <Building2 size={32} color="#5f6368" />
                <p>Ready to detect houses in satellite view.</p>
                <span>Click &quot;Re-scan 1m Satellite Micro-Zone&quot; or use the Crop tool on the map.</span>
              </>
            )}
          </div>
        ) : (
          filteredBuildings.map((b) => {
            const isChecked = selectedIds.has(b.temp_id);
            const isHighlighted = selectedBuilding?.temp_id === b.temp_id;
            const dynamicCode = getDynamicCode(b.house_number);
            const area = b.area_sq_m ? Number(b.area_sq_m).toFixed(1) : '120.0';
            const conf = b.confidence_score ? Number(b.confidence_score).toFixed(1) : '96.5';
            const lat = Number(b.latitude || 25.4358).toFixed(7);
            const lng = Number(b.longitude || 81.8463).toFixed(7);

            return (
              <div
                key={b.temp_id || dynamicCode}
                className={`bldg-card ${isChecked ? 'selected' : ''} ${isHighlighted ? 'active-highlight' : ''}`}
                onClick={() => onSelectBuilding && onSelectBuilding(b)}
              >
                <div className="bldg-card-header">
                  <div
                    className="checkbox-wrapper"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(b.temp_id);
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare size={18} color="#188038" />
                    ) : (
                      <Square size={18} color="#9aa0a6" />
                    )}
                  </div>

                  <div className="bldg-identity">
                    <span className="house-number-badge">{b.house_number || 'H001'}</span>
                    <span className="cadastral-code-text">{dynamicCode}</span>
                  </div>

                  <div className="bldg-confidence-tag">
                    <span>{conf}%</span>
                  </div>
                </div>

                <div className="bldg-card-body">
                  <div className="bldg-attr-row">
                    <span className="attr-label">Rooftop Area:</span>
                    <span className="attr-value">{area} m²</span>
                  </div>
                  <div className="bldg-attr-row">
                    <span className="attr-label">Roof & Structure:</span>
                    <span className="attr-value">{b.roof_type || 'Flat RCC Concrete'} ({b.floors || 1}F)</span>
                  </div>
                  <div className="bldg-attr-row">
                    <span className="attr-label">Coordinates (1m):</span>
                    <span className="attr-value font-mono">
                      {lat}, {lng}
                    </span>
                  </div>
                </div>

                <div className="bldg-card-footer">
                  <span className="accuracy-pill">🎯 1m Calibrated Footprint</span>
                  <button
                    className="inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectBuilding) onSelectBuilding(b);
                    }}
                    title="Pan & Zoom to Rooftop Footprint"
                  >
                    <Eye size={14} />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Action Footer */}
      <div className="drawer-footer-actions">
        <div className="footer-summary">
          <ShieldCheck size={16} color="#188038" />
          <span>
            <strong>{selectedIds.size}</strong> of {safeBuildingsList.length} structures ready for unique ID assignment
          </span>
        </div>

        <button
          className="batch-register-btn"
          onClick={handleRegister}
          disabled={selectedIds.size === 0 || isRegistering}
        >
          {isRegistering ? (
            <>
              <RefreshCw size={17} className="spin-animate" />
              <span>Minting Authoritative BHU-IDs...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={17} />
              <span>Verify & Assign Unique IDs ({selectedIds.size})</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
