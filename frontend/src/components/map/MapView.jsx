import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Layers,
  Plus,
  Minus,
  Maximize2,
  Satellite,
  Map as MapIcon,
  Check,
  Globe,
  Scan,
  Crosshair,
  Navigation,
  Crop,
  X
} from 'lucide-react';

// Tile configurations with maxNativeZoom to prevent "Map data not yet available" tile errors
const BASE_LAYERS = {
  google_sat: {
    id: 'google_sat',
    name: 'Google Satellite & Cadastral Hybrid',
    subname: 'High-Res Optical with Road & Parcel Labels',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: { maxZoom: 22, maxNativeZoom: 20, attribution: '© Google Satellite / Hybrid' },
    badge: 'Hybrid Sat',
    isGov: false,
  },
  satellite: {
    id: 'satellite',
    name: 'ISRO Bhuvan / Optical Satellite',
    subname: 'High-Resolution Satellite Imagery (~10m Scale)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 22, maxNativeZoom: 17, attribution: '© ISRO Bhuvan / NRSC / Esri Satellite' },
    badge: 'Satellite',
    isGov: true,
  },
  street: {
    id: 'street',
    name: 'Street Map (Light)',
    subname: 'Clean Vector Base for Land Parcels',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 22, maxNativeZoom: 19, subdomains: 'abcd', attribution: '© Carto / OpenStreetMap' },
    badge: 'Street',
    isGov: false,
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap India',
    subname: 'Standard Geographic Cartography',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 22, maxNativeZoom: 19, attribution: '© OpenStreetMap Contributors' },
    badge: 'OSM',
    isGov: false,
  },
  dark: {
    id: 'dark',
    name: 'Cadastral Dark',
    subname: 'High-contrast Night View',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 22, maxNativeZoom: 19, subdomains: 'abcd', attribution: '© Carto Dark' },
    badge: 'Dark',
    isGov: false,
  },
};

import { reverseGeocodeLGD, generateLocationCadastralProfile, getUserRealLocation } from '../../services/geocodingService';

export function MapView({
  properties = [],
  selectedProperty,
  onSelectProperty,
  detectedBuildings = [],
  selectedDetectedBuilding,
  onSelectDetectedBuilding,
  isScanning = false,
  workerLocation,
  showWorkers = true,
  showParcels = true,
  theme = 'light',
  onCropAreaScan,
  onNavigateToLocation,
  onLocationChange,
  activeLocation,
  isDrawerOpen = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseLayerRef = useRef(null);
  const polygonsGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const aiBuildingsGroupRef = useRef(null);
  const workerMarkerRef = useRef(null);
  const cropRectRef = useRef(null);
  const myLocationMarkerRef = useRef(null);

  const [currentBaseMap, setCurrentBaseMap] = useState('google_sat');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropBounds, setCropBounds] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Theme
  useEffect(() => {
    if (currentBaseMap === 'street' && theme === 'dark') setCurrentBaseMap('dark');
    else if (currentBaseMap === 'dark' && theme === 'light') setCurrentBaseMap('street');
  }, [theme]);

  const createBaseLayer = (layerKey) => {
    const config = BASE_LAYERS[layerKey] || BASE_LAYERS.osm || BASE_LAYERS.satellite;
    return L.tileLayer(config.url, {
      maxZoom: 22,
      maxNativeZoom: 18,
      ...(config.options || {}),
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = activeLocation?.lat || selectedProperty?.latitude || 25.4358;
    const initialLng = activeLocation?.lng || selectedProperty?.longitude || 81.8463;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    const initialLayer = createBaseLayer(currentBaseMap);
    initialLayer.addTo(map);
    baseLayerRef.current = initialLayer;

    polygonsGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    aiBuildingsGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Register global navigation helper
    window.__bhuMapNavigateTo = (lat, lng, zoom) => {
      map.flyTo([lat, lng], zoom || 17, { duration: 1.4 });
    };

    // Reverse geocode on map click to dynamically change village code & formula
    map.on('click', (e) => {
      if (cropRectRef.current) return;
      const { lat, lng } = e.latlng;
      const lgdProfile = reverseGeocodeLGD(lat, lng);
      if (onLocationChange) {
        onLocationChange(lgdProfile, true);
      }
    });

    // Continuously update active village, pincode, and formula on map pan/move
    let moveTimer = null;
    map.on('moveend', () => {
      if (cropRectRef.current) return;
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        const center = map.getCenter();
        if (center) {
          const lgdProfile = reverseGeocodeLGD(center.lat, center.lng);
          if (onLocationChange) {
            onLocationChange(lgdProfile, false); // false = update HUD and formula without toast notification
          }
        }
      }, 350);
    });

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      clearTimeout(moveTimer);
      delete window.__bhuMapNavigateTo;
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => mapInstanceRef.current?.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Switch base layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (baseLayerRef.current) mapInstanceRef.current.removeLayer(baseLayerRef.current);
    const newLayer = createBaseLayer(currentBaseMap);
    newLayer.addTo(mapInstanceRef.current);
    baseLayerRef.current = newLayer;
  }, [currentBaseMap]);

  // AI scanning auto-zoom
  useEffect(() => {
    if (isScanning || (Array.isArray(detectedBuildings) && detectedBuildings.length > 0)) {
      if (mapInstanceRef.current) {
        const centerLat = selectedProperty?.latitude || (detectedBuildings[0]?.latitude) || 25.4358;
        const centerLng = selectedProperty?.longitude || (detectedBuildings[0]?.longitude) || 81.8463;
        mapInstanceRef.current.flyTo([centerLat, centerLng], 18, { duration: 1.2 });
      }
    }
  }, [isScanning, detectedBuildings]);

  // ═══════════════════════════════════════════════════════
  // CROP AREA TOOL — Draw rectangle for AI building scan
  // ═══════════════════════════════════════════════════════
  const startCropMode = useCallback(() => {
    if (!mapInstanceRef.current) return;
    setIsCropMode(true);
    setCropBounds(null);

    // Clear any existing crop rectangle
    if (cropRectRef.current) {
      mapInstanceRef.current.removeLayer(cropRectRef.current);
      cropRectRef.current = null;
    }

    const map = mapInstanceRef.current;
    map.dragging.disable();
    map.getContainer().style.cursor = 'crosshair';

    let startLatLng = null;
    let tempRect = null;

    const onMouseDown = (e) => {
      startLatLng = e.latlng;
    };

    const onMouseMove = (e) => {
      if (!startLatLng) return;
      const bounds = L.latLngBounds(startLatLng, e.latlng);
      if (tempRect) {
        tempRect.setBounds(bounds);
      } else {
        tempRect = L.rectangle(bounds, {
          color: '#00e5ff',
          weight: 2.5,
          fillColor: 'rgba(0, 229, 255, 0.15)',
          fillOpacity: 1,
          dashArray: '6, 4',
        }).addTo(map);
      }
    };

    const onMouseUp = (e) => {
      if (!startLatLng) {
        map.off('mousedown', onMouseDown);
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
        map.getContainer().style.cursor = '';
        setIsCropMode(false);
        return;
      }
      const endLatLng = e.latlng || startLatLng;
      const bounds = L.latLngBounds(startLatLng, endLatLng);

      // Clean up temp and listeners
      if (tempRect) {
        try { map.removeLayer(tempRect); } catch (_) { }
        tempRect = null;
      }
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.dragging.enable();
      map.getContainer().style.cursor = '';

      if (!bounds.isValid() || Math.abs(bounds.getNorth() - bounds.getSouth()) < 0.00005 || Math.abs(bounds.getEast() - bounds.getWest()) < 0.00005) {
        setIsCropMode(false);
        return;
      }

      // Draw final crop rectangle
      const finalRect = L.rectangle(bounds, {
        color: '#00e5ff',
        weight: 3,
        fillColor: 'rgba(0, 229, 255, 0.18)',
        fillOpacity: 1,
        dashArray: '8, 4',
      }).addTo(map);

      cropRectRef.current = finalRect;

      const cropData = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center_lat: bounds.getCenter().lat,
        center_lng: bounds.getCenter().lng,
        layer_type: currentBaseMap,
      };
      setCropBounds(cropData);
      setIsCropMode(false);
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
  }, [currentBaseMap]);

  const cancelCropMode = useCallback(() => {
    if (!mapInstanceRef.current) return;
    setIsCropMode(false);
    setCropBounds(null);
    mapInstanceRef.current.dragging.enable();
    mapInstanceRef.current.getContainer().style.cursor = '';
    if (cropRectRef.current) {
      mapInstanceRef.current.removeLayer(cropRectRef.current);
      cropRectRef.current = null;
    }
  }, []);

  const confirmCropScan = useCallback(() => {
    if (cropBounds && onCropAreaScan) {
      onCropAreaScan({
        ...cropBounds,
        layer_type: currentBaseMap,
      });
    }
    // Clear the crop rectangle after scan
    if (cropRectRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(cropRectRef.current);
      cropRectRef.current = null;
    }
    setCropBounds(null);
  }, [cropBounds, currentBaseMap, onCropAreaScan]);

  // ═══════════════════════════════════════════════════════
  // MY LOCATION — GPS / Real Geographic Geolocation
  // ═══════════════════════════════════════════════════════
  const handleMyLocation = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    setIsLocating(true);

    try {
      const realProfile = await getUserRealLocation();
      const { lat, lng, name, village, pincode } = realProfile;
      const map = mapInstanceRef.current;

      if (map) {
        map.flyTo([lat, lng], 18, { duration: 1.5 });

        if (myLocationMarkerRef.current) {
          map.removeLayer(myLocationMarkerRef.current);
        }

        const locIcon = L.divIcon({
          className: 'my-location-marker',
          html: `<div style="
            width: 22px; height: 22px;
            background: #1a73e8;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 6px rgba(26,115,232,0.25), 0 3px 8px rgba(0,0,0,0.3);
            animation: locationPulse 2s ease-in-out infinite;
          "></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        myLocationMarkerRef.current = L.marker([lat, lng], { icon: locIcon })
          .addTo(map)
          .bindTooltip(
            `<div style="font-weight:700;font-size:11px">📍 ${name || village}</div>
             <div style="font-size:10px;color:#5f6368">${lat.toFixed(6)}, ${lng.toFixed(6)} • PIN ${pincode}</div>`,
            { direction: 'top', offset: [0, -14] }
          );

        if (onNavigateToLocation) {
          onNavigateToLocation(realProfile);
        }
      }
    } catch (err) {
      console.warn('[MapView] Real location detection notice:', err);
    } finally {
      setIsLocating(false);
    }
  }, [onNavigateToLocation]);

  // ═══════════════════════════════════════════════════════
  // Navigate to a specific location (called from parent)
  // ═══════════════════════════════════════════════════════
  const navigateTo = useCallback((lat, lng, zoom = 17) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.5 });
  }, []);

  // Expose navigateTo via ref-like pattern for parent
  useEffect(() => {
    if (onNavigateToLocation) {
      // Store function on window for parent access (lightweight approach)
      window.__bhuMapNavigateTo = navigateTo;
    }
    return () => { delete window.__bhuMapNavigateTo; };
  }, [navigateTo, onNavigateToLocation]);

  // ═══════════════════════════════════════════════════════
  // Render Official Registered Parcels & Markers
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonsGroupRef.current || !markersGroupRef.current) return;

    polygonsGroupRef.current.clearLayers();
    markersGroupRef.current.clearLayers();

    if (!showParcels) return;

    properties.forEach((prop) => {
      const isSelected = selectedProperty?.property_id === prop.property_id;
      const status = prop.status || 'PENDING';

      let strokeColor = '#1a73e8';
      let fillColor = 'rgba(26, 115, 232, 0.22)';

      if (status === 'VERIFIED') {
        strokeColor = '#188038';
        fillColor = 'rgba(24, 128, 56, 0.28)';
      } else if (status === 'WARNING') {
        strokeColor = '#e37400';
        fillColor = 'rgba(227, 116, 0, 0.28)';
      } else if (status === 'CONFLICT') {
        strokeColor = '#d93025';
        fillColor = 'rgba(217, 48, 37, 0.32)';
      }

      if (isSelected) {
        strokeColor = '#00e5ff';
        fillColor = 'rgba(0, 229, 255, 0.35)';
      }

      if (prop.polygon && prop.polygon.length >= 3) {
        const poly = L.polygon(prop.polygon, {
          color: strokeColor,
          weight: isSelected ? 3.5 : 2,
          fillColor: fillColor,
          fillOpacity: 1,
          dashArray: isSelected ? null : (status === 'PENDING' ? '4, 4' : null),
        });

        poly.on('click', () => onSelectProperty(prop));

        poly.bindTooltip(
          `<div style="font-weight: 700; font-family: monospace; font-size: 11px; color: ${strokeColor}">
            ${prop.property_id}
          </div>
          <div style="font-size: 10px; color: #5f6368">${prop.owner_name || 'Surface Land Parcel'}</div>
          <div style="font-size: 9px; color: #188038; font-weight: 600; margin-top: 2px;">🛰️ ISRO Bhuvan Verified</div>`,
          { sticky: true, direction: 'top', className: 'parcel-tooltip' }
        );

        polygonsGroupRef.current.addLayer(poly);
      }

      if (prop.latitude && prop.longitude) {
        const pinIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `<div style="
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            background: #ffffff;
            border: ${isSelected ? '3px solid #00e5ff' : `2.5px solid ${strokeColor}`};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            transform: translate(-50%, -50%);
          ">
            <div style="
              width: ${isSelected ? '12px' : '9px'};
              height: ${isSelected ? '12px' : '9px'};
              background: ${strokeColor};
              border-radius: 50%;
            "></div>
          </div>`,
          iconSize: [24, 24],
        });

        const marker = L.marker([prop.latitude, prop.longitude], { icon: pinIcon });
        marker.on('click', () => onSelectProperty(prop));
        markersGroupRef.current.addLayer(marker);
      }
    });
  }, [properties, selectedProperty, showParcels]);

  // ═══════════════════════════════════════════════════════
  // Render AI Detected Building Footprints
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapInstanceRef.current || !aiBuildingsGroupRef.current) return;
    aiBuildingsGroupRef.current.clearLayers();
    if (!Array.isArray(detectedBuildings) || detectedBuildings.length === 0) return;

    try {
      detectedBuildings.forEach((bldg) => {
        if (!bldg) return;
        const isSelected = selectedDetectedBuilding?.temp_id === bldg.temp_id;
        const strokeColor = isSelected ? '#ff9900' : '#00e5ff';
        const fillColor = isSelected ? 'rgba(255, 153, 0, 0.45)' : 'rgba(0, 229, 255, 0.32)';
        const code = bldg.cadastral_code || `${bldg.pincode || '212306'}-${bldg.village_code || 'LAK042'}-${bldg.house_number || 'H001'}`;

        if (Array.isArray(bldg.polygon) && bldg.polygon.length >= 3) {
          const poly = L.polygon(bldg.polygon, {
            color: strokeColor,
            weight: isSelected ? 3.5 : 2.5,
            fillColor: fillColor,
            fillOpacity: 1,
            dashArray: isSelected ? null : '3, 3',
          });

          poly.on('click', () => {
            if (onSelectDetectedBuilding) onSelectDetectedBuilding(bldg);
          });

          poly.bindTooltip(
            `<div style="font-weight: 800; font-family: monospace; font-size: 11.5px; color: ${strokeColor}">
              🏠 ${bldg.house_number || 'H001'} (${code})
            </div>
            <div style="font-size: 10px; color: #202124">Area: <strong>${bldg.area_sq_m || 120} m²</strong> | ${bldg.roof_type || 'Rooftop'}</div>
            <div style="font-size: 9.5px; color: #188038; font-weight: 700;">🎯 1m Optical Precision • AI Conf: ${Number(bldg.confidence_score || 96.5).toFixed(1)}%</div>`,
            { sticky: true, direction: 'top', className: 'bldg-ai-tooltip' }
          );

          aiBuildingsGroupRef.current.addLayer(poly);
        }

        if (bldg.latitude && bldg.longitude) {
          const lat = Number(bldg.latitude);
          const lng = Number(bldg.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            const labelIcon = L.divIcon({
              className: 'ai-bldg-label',
              html: `<div style="
                background: ${isSelected ? '#ff9900' : '#00e5ff'};
                color: #000000;
                font-size: 9.5px;
                font-weight: 800;
                padding: 2px 7px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                transform: translate(-50%, -50%);
                white-space: nowrap;
                border: 1px solid rgba(255,255,255,0.8);
              ">
                🏠 ${bldg.house_number || 'H001'}
              </div>`,
              iconSize: [32, 18],
            });

            const labelMarker = L.marker([lat, lng], { icon: labelIcon });
            labelMarker.on('click', () => {
              if (onSelectDetectedBuilding) onSelectDetectedBuilding(bldg);
            });
            aiBuildingsGroupRef.current.addLayer(labelMarker);
          }
        }
      });
    } catch (err) {
      console.warn('[MapView] AI building rendering notice:', err);
    }
  }, [detectedBuildings, selectedDetectedBuilding]);

  // Pan to selected AI building
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedDetectedBuilding) return;
    if (selectedDetectedBuilding.latitude && selectedDetectedBuilding.longitude) {
      mapInstanceRef.current.flyTo(
        [selectedDetectedBuilding.latitude, selectedDetectedBuilding.longitude],
        19, { duration: 1.0 }
      );
    }
  }, [selectedDetectedBuilding]);

  // Live worker marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!showWorkers || !workerLocation) {
      if (workerMarkerRef.current) {
        mapInstanceRef.current.removeLayer(workerMarkerRef.current);
        workerMarkerRef.current = null;
      }
      return;
    }

    const workerIcon = L.divIcon({
      className: 'worker-marker',
      html: `<div class="worker-pulse"></div><div class="worker-dot" title="Live Field Worker: ${workerLocation.worker_name || 'Alex'}"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLatLng([workerLocation.lat, workerLocation.lng]);
    } else {
      workerMarkerRef.current = L.marker([workerLocation.lat, workerLocation.lng], { icon: workerIcon })
        .addTo(mapInstanceRef.current)
        .bindTooltip(
          `<div style="font-weight: 700; font-size: 11px;">📍 Field Surveyor Active</div>
           <div style="font-size: 10px; color: #5f6368">${workerLocation.worker_name || 'Surveyor'}</div>`,
          { direction: 'top', offset: [0, -10] }
        );
    }
  }, [workerLocation, showWorkers]);

  // Pan to selected property
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedProperty) return;
    if (selectedProperty.latitude && selectedProperty.longitude) {
      mapInstanceRef.current.flyTo(
        [selectedProperty.latitude, selectedProperty.longitude],
        17, { duration: 1.2 }
      );
    }
  }, [selectedProperty]);

  // Fit all parcels
  const handleFitVillage = () => {
    if (!mapInstanceRef.current || properties.length === 0) return;
    const bounds = L.latLngBounds(
      properties.filter((p) => p.latitude && p.longitude).map((p) => [p.latitude, p.longitude])
    );
    if (bounds.isValid()) mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80] });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="map-viewport">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* AI Scanning Overlay */}
      {isScanning && (
        <div className="satellite-scan-overlay">
          <div className="radar-grid"></div>
          <div className="laser-sweep-line"></div>
          <div className="scan-status-badge">
            <Scan size={16} className="spin-animate" />
            <span>AI Optical 1m Footprint Detection (Tree & Road Filter Active)...</span>
          </div>
        </div>
      )}

      {/* Crop Mode Instruction Banner */}
      {isCropMode && (
        <div className="crop-mode-banner">
          <Crop size={18} />
          <span>Click and drag to draw a rectangle over the area you want AI to scan for buildings</span>
          <button className="crop-cancel-btn" onClick={cancelCropMode}>
            <X size={14} />
            Cancel
          </button>
        </div>
      )}

      {/* Crop Area Confirmation Floating Card */}
      {cropBounds && !isCropMode && (
        <div className="crop-confirm-card">
          <div className="crop-confirm-header">
            <Crop size={16} color="#1a73e8" />
            <span>Crop Area Selected</span>
          </div>
          <div className="crop-confirm-coords">
            <div className="coord-row">
              <span>N: {cropBounds.north.toFixed(6)}</span>
              <span>S: {cropBounds.south.toFixed(6)}</span>
            </div>
            <div className="coord-row">
              <span>E: {cropBounds.east.toFixed(6)}</span>
              <span>W: {cropBounds.west.toFixed(6)}</span>
            </div>
          </div>
          <div className="crop-confirm-actions">
            <button className="crop-scan-btn" onClick={confirmCropScan}>
              <Scan size={14} />
              Scan This Area for Houses
            </button>
            <button className="crop-clear-btn" onClick={cancelCropMode}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Dynamic LGD Village & Cadastral Formula Banner */}
      <div className="isro-bhuvan-banner">
        <div className="isro-flag-emblem">🇮🇳</div>
        <div className="isro-banner-details">
          <div className="isro-title">
            <span>{activeLocation?.village || 'Lakshmipur'}</span>
            <span className="formula-live-pill" title="Dynamic Cadastral Scheme for Active Sector">
              {activeLocation?.pincode || '212306'}-{activeLocation?.village_code || 'LAK042'}-H{'{NO}'}
            </span>
            <span className="isro-status-tag">
              <span className="bhuvan-live-dot"></span>
              LGD: {activeLocation?.lgd_code || activeLocation?.village_code || '162842'}
            </span>
          </div>
          <div className="isro-subtitle">
            {activeLocation?.block || 'Koraon'}, {activeLocation?.district || 'Prayagraj'}, {activeLocation?.state || 'UP'} • PIN {activeLocation?.pincode || '212306'}
          </div>
        </div>
      </div>

      {/* Floating Map Controls */}
      <div className={`map-floating-controls ${isDrawerOpen ? 'drawer-open' : ''}`}>
        {/* Layer Selector */}
        <div className="layer-picker-container">
          <button
            className={`map-control-btn ${isLayerMenuOpen ? 'active' : ''}`}
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            title="Select Base Map"
          >
            <Layers size={18} />
          </button>

          {isLayerMenuOpen && (
            <div className="layer-picker-menu">
              <div className="layer-picker-header">
                <span className="layer-picker-title">
                  <Globe size={14} color="#1a73e8" />
                  Geospatial Map Layers
                </span>
                <span className="gov-badge-sm">Bharat Sarkar</span>
              </div>
              <div className="layer-options-list">
                {Object.values(BASE_LAYERS).map((layer) => {
                  const isSelected = currentBaseMap === layer.id;
                  return (
                    <button
                      key={layer.id}
                      className={`layer-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setCurrentBaseMap(layer.id);
                        setIsLayerMenuOpen(false);
                      }}
                    >
                      <div className="layer-icon-wrapper">
                        {layer.isGov ? (
                          <span className="isro-mini-tag">ISRO</span>
                        ) : layer.id.includes('sat') ? (
                          <Satellite size={14} />
                        ) : (
                          <MapIcon size={14} />
                        )}
                      </div>
                      <div className="layer-text-group">
                        <div className="layer-item-name">{layer.name}</div>
                        <div className="layer-item-sub">{layer.subname}</div>
                      </div>
                      {isSelected && <Check size={16} className="layer-selected-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Crop Area Tool */}
        <button
          className={`map-control-btn ${isCropMode ? 'active' : ''}`}
          onClick={isCropMode ? cancelCropMode : startCropMode}
          title="Draw Crop Area for AI House Scan"
        >
          <Crop size={18} />
        </button>

        {/* My Location */}
        <button
          className={`map-control-btn ${isLocating ? 'active' : ''}`}
          onClick={handleMyLocation}
          title="Go to My Location (GPS)"
        >
          {isLocating ? <Navigation size={18} className="spin-animate" /> : <Crosshair size={18} />}
        </button>

        {/* Fit Village */}
        <button className="map-control-btn" onClick={handleFitVillage} title="Fit View to Village Parcels">
          <Maximize2 size={18} />
        </button>

        {/* Zoom */}
        <button className="map-control-btn" onClick={handleZoomIn} title="Zoom In">
          <Plus size={18} />
        </button>
        <button className="map-control-btn" onClick={handleZoomOut} title="Zoom Out">
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}
