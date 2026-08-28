import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { api, TelemetryWebSocket } from './services/api';
import {
  TopNav,
  MapView,
  MetricsPanel,
  PropertyDetailPanel,
  IdentityResolutionModal,
  ConflictAuditModal,
  FieldCaptureModal,
  AdminModal,
  LiveToastFeed,
  AIHouseCountDrawer,
} from './components';

function MainApp() {
  // Theme State (Light / Dark)
  const [theme, setTheme] = useState(() => localStorage.getItem('bhu_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bhu_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Main Data States
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Layer Visibility
  const [showWorkers, setShowWorkers] = useState(true);
  const [showParcels, setShowParcels] = useState(true);

  // Live Telemetry
  const [workerLocation, setWorkerLocation] = useState({
    lat: 25.4358,
    lng: 81.8463,
    worker_name: 'Alex (Field Surveyor)',
  });
  const [toasts, setToasts] = useState([]);

  // Modal & Drawer States
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [isHouseCountOpen, setIsHouseCountOpen] = useState(false);

  // AI Satellite House Detection States
  const [detectedBuildings, setDetectedBuildings] = useState([]);
  const [selectedDetectedBuilding, setSelectedDetectedBuilding] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Helper to add toast
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Fetch properties and stats
  const loadData = useCallback(async () => {
    try {
      const resProps = await api.properties.list(1, 100);
      if (resProps && resProps.data) {
        setProperties(resProps.data);
      }
      const resStats = await api.properties.getStats();
      if (resStats) {
        setStats(resStats);
      }
    } catch (err) {
      console.warn('Failed to fetch initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup WebSocket Telemetry
  useEffect(() => {
    const telemetry = new TelemetryWebSocket((msg) => {
      if (msg.type === 'WORKER_LOCATION_UPDATE') {
        setWorkerLocation({
          lat: msg.lat,
          lng: msg.lng,
          worker_name: msg.worker_name || 'Alex (Surveyor)',
        });
      } else if (msg.type === 'PROPERTY_CAPTURED') {
        addToast({
          type: 'PROPERTY_CAPTURED',
          title: 'New Property Registered',
          message: `Minted BHU-ID ${msg.property_id} in ${msg.village}`,
        });
        loadData();
      } else if (msg.type === 'CADASTRAL_BATCH_REGISTERED') {
        addToast({
          type: 'MATCHING_COMPLETE',
          title: 'Satellite Census Registered',
          message: msg.message || 'Batch registered verified house footprints.',
        });
        loadData();
      } else if (msg.type === 'CONNECTION_ESTABLISHED') {
        addToast({
          type: 'MATCHING_COMPLETE',
          title: 'SmartLens GIS Connected',
          message: 'Connected to live real-time geospatial registry.',
        });
      }
    });

    return () => {
      telemetry.disconnect();
    };
  }, [addToast, loadData]);

  // Filter Properties based on activeFilter
  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFilteredProperties(properties);
    } else {
      setFilteredProperties(properties.filter((p) => p.status === activeFilter));
    }
  }, [activeFilter, properties]);

  // Select Property Handler
  const handleSelectProperty = (prop) => {
    setIsHouseCountOpen(false);
    setSelectedProperty(prop);
  };

  // Property Captured Handler
  const handlePropertyCaptured = (newProp) => {
    setProperties((prev) => [newProp, ...prev]);
    setSelectedProperty(newProp);
    addToast({
      type: 'PROPERTY_CAPTURED',
      title: 'Authoritative BHU-ID Minted',
      message: `${newProp.property_id} created for ${newProp.owner_name}.`,
    });
  };

  // Conflict Resolved Handler
  const handleConflictResolved = (propId, actionName) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.property_id === propId
          ? { ...p, status: 'VERIFIED', confidence_score: 96.0 }
          : p
      )
    );
    if (selectedProperty && selectedProperty.property_id === propId) {
      setSelectedProperty((prev) => ({
        ...prev,
        status: 'VERIFIED',
        confidence_score: 96.0,
      }));
    }
    addToast({
      type: 'MATCHING_COMPLETE',
      title: 'Discrepancy Reconciled',
      message: `${propId}: ${actionName}`,
    });
  };

  // Active Geographic Sector & Cadastral Scheme
  const [activeLocation, setActiveLocation] = useState({
    pincode: '212306',
    village: 'Lakshmipur',
    village_code: 'LAK042',
    lat: 25.4358,
    lng: 81.8463,
    name: 'Lakshmipur',
  });

  // Trigger AI House Scanning
  const handleScanMicroZone = async (params = {}) => {
    setIsScanning(true);
    try {
      const centerLat = selectedProperty?.latitude || activeLocation.lat || 25.4358;
      const centerLng = selectedProperty?.longitude || activeLocation.lng || 81.8463;

      const res = await api.properties.detectHouses({
        latitude: centerLat,
        longitude: centerLng,
        pincode: params.pincode || activeLocation.pincode || '212306',
        village: params.village || activeLocation.village || 'Lakshmipur',
        village_code: params.village_code || activeLocation.village_code || 'LAK042',
        radius_meters: 80.0,
        existing_properties: properties,
      });

      if (res && res.buildings) {
        setDetectedBuildings(res.buildings);
        if (res.buildings.length > 0) {
          setSelectedDetectedBuilding(res.buildings[0]);
        }
        addToast({
          type: 'MATCHING_COMPLETE',
          title: 'Satellite Footprint Detection Complete',
          message: `Detected ${res.buildings.length} rooftop structures with 1m precision (Trees & Roads Filtered).`,
        });
      }
    } catch (err) {
      console.warn('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Open AI House Count Drawer
  const handleOpenHouseCount = () => {
    setSelectedProperty(null);
    setIsHouseCountOpen(true);
    handleScanMicroZone({
      pincode: activeLocation.pincode,
      village: activeLocation.village,
      village_code: activeLocation.village_code,
    });
  };

  // Crop Area AI Scan — user draws a rectangle on the map
  const handleCropAreaScan = async (cropBounds) => {
    setSelectedProperty(null);
    setIsHouseCountOpen(true);
    setIsScanning(true);
    try {
      const res = await api.properties.detectHouses({
        latitude: cropBounds.center_lat,
        longitude: cropBounds.center_lng,
        pincode: activeLocation.pincode || '212306',
        village: activeLocation.village || 'Lakshmipur',
        village_code: activeLocation.village_code || 'LAK042',
        radius_meters: 120.0,
        existing_properties: properties,
        bounds: {
          north: cropBounds.north,
          south: cropBounds.south,
          east: cropBounds.east,
          west: cropBounds.west,
        },
      });

      if (res && res.buildings) {
        setDetectedBuildings(res.buildings);
        if (res.buildings.length > 0) {
          setSelectedDetectedBuilding(res.buildings[0]);
        }
        addToast({
          type: 'MATCHING_COMPLETE',
          title: 'Crop Area Scan Complete (1m Precision)',
          message: `Detected ${res.buildings.length} houses with unique IDs in selected area.`,
        });
      }
    } catch (err) {
      console.warn('Crop area scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Navigate to Location (from worldwide search or preset)
  const handleNavigateToLocation = (location) => {
    const nextPin = String(location.pincode || '212306').trim();
    const nextVillage = String(location.village || location.name || 'Sector').trim();
    const nextVCode = String(location.village_code || 'VIL001').trim().toUpperCase();

    setActiveLocation({
      pincode: nextPin,
      village: nextVillage,
      village_code: nextVCode,
      lat: location.lat,
      lng: location.lng,
      name: location.name,
      state: location.state,
    });

    if (window.__bhuMapNavigateTo) {
      window.__bhuMapNavigateTo(location.lat, location.lng, 17);
    }
    addToast({
      type: 'MATCHING_COMPLETE',
      title: `Navigated to ${location.name}`,
      message: `Cadastral Scheme Set: ${nextPin}-${nextVCode}-H{NO}`,
    });
  };

  // Batch Register Verified Buildings
  const handleBatchRegister = async (payload) => {
    setIsRegistering(true);
    try {
      const res = await api.properties.batchAssignCodes(payload);
      if (res && res.success) {
        addToast({
          type: 'PROPERTY_CAPTURED',
          title: 'Authoritative Codes Assigned & Stored',
          message: `Successfully verified and stored ${res.registered_count} houses in database under ${payload.village}.`,
        });
        loadData();
        setDetectedBuildings([]);
        setSelectedDetectedBuilding(null);
        setIsHouseCountOpen(false);
      }
    } catch (err) {
      console.error('Batch registration failed:', err);
      addToast({
        type: 'MATCHING_COMPLETE',
        title: 'Registration Error',
        message: 'Could not complete batch registration. Please try again.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bhu-app">
      {/* Floating Top Navigation */}
      <TopNav
        properties={properties}
        onSelectProperty={handleSelectProperty}
        onOpenCapture={() => setIsCaptureOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenHouseCount={handleOpenHouseCount}
        onNavigateToLocation={handleNavigateToLocation}
        onOpenAIReconcile={() => {
          if (!selectedProperty && properties.length > 0) {
            setSelectedProperty(properties[0]);
          }
          setIsIdentityOpen(true);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Full-Viewport Geospatial Map */}
      <MapView
        properties={filteredProperties}
        selectedProperty={selectedProperty}
        onSelectProperty={handleSelectProperty}
        detectedBuildings={detectedBuildings}
        selectedDetectedBuilding={selectedDetectedBuilding}
        onSelectDetectedBuilding={setSelectedDetectedBuilding}
        isScanning={isScanning}
        workerLocation={workerLocation}
        showWorkers={showWorkers}
        showParcels={showParcels}
        theme={theme}
        onCropAreaScan={handleCropAreaScan}
        onNavigateToLocation={handleNavigateToLocation}
        isDrawerOpen={Boolean(selectedProperty || isHouseCountOpen)}
      />

      {/* Floating Left Analytics & Filter Panel */}
      <MetricsPanel
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showWorkers={showWorkers}
        onToggleWorkers={setShowWorkers}
        showParcels={showParcels}
        onToggleParcels={setShowParcels}
      />

      {/* Floating Right Property Detail Drawer */}
      {selectedProperty && !isHouseCountOpen && (
        <PropertyDetailPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onOpenIdentityResolution={() => setIsIdentityOpen(true)}
          onOpenConflictAudit={() => setIsConflictOpen(true)}
        />
      )}

      {/* AI Satellite House Counting & Cadastral Assignment Drawer */}
      <AIHouseCountDrawer
        isOpen={isHouseCountOpen}
        onClose={() => setIsHouseCountOpen(false)}
        buildings={detectedBuildings}
        selectedBuilding={selectedDetectedBuilding}
        onSelectBuilding={setSelectedDetectedBuilding}
        onScanMicroZone={handleScanMicroZone}
        onBatchRegister={handleBatchRegister}
        isScanning={isScanning}
        isRegistering={isRegistering}
        initialPincode={activeLocation.pincode || '212306'}
        initialVillage={activeLocation.village || 'Lakshmipur'}
        initialVillageCode={activeLocation.village_code || 'LAK042'}
      />

      {/* Identity Resolution Modal */}
      {isIdentityOpen && (
        <IdentityResolutionModal
          property={selectedProperty || properties[0]}
          onClose={() => setIsIdentityOpen(false)}
        />
      )}

      {/* AI Cadastral Audit & Conflict Resolution Modal */}
      {isConflictOpen && (
        <ConflictAuditModal
          property={selectedProperty || properties[2]}
          onClose={() => setIsConflictOpen(false)}
          onResolve={handleConflictResolved}
        />
      )}

      {/* Field Surveyor Mobile Parcel Capture Modal */}
      {isCaptureOpen && (
        <FieldCaptureModal
          onClose={() => setIsCaptureOpen(false)}
          onCaptured={handlePropertyCaptured}
          currentCenter={
            selectedProperty
              ? { lat: selectedProperty.latitude, lng: selectedProperty.longitude }
              : { lat: 25.4358, lng: 81.8463 }
          }
        />
      )}

      {/* Admin Dataset Ingestion & AI Matching Suite */}
      {isAdminOpen && (
        <AdminModal
          onClose={() => setIsAdminOpen(false)}
          onDataUpdated={loadData}
        />
      )}

      {/* Real-time WebSocket Toast Notifications */}
      <LiveToastFeed
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

