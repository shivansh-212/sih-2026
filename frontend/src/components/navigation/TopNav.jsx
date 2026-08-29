import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  X, 
  MapPin, 
  Database, 
  ShieldCheck, 
  PlusCircle, 
  Sparkles, 
  UserCheck, 
  Layers, 
  ChevronDown,
  Sun,
  Moon,
  Scan,
  Navigation,
  Globe,
  Loader2,
  Compass,
  Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  searchWorldwide, 
  generateLocationCadastralProfile, 
  getUserRealLocation 
} from '../../services/geocodingService';

export function TopNav({
  properties = [],
  onSelectProperty,
  onOpenCapture,
  onOpenAdmin,
  onOpenAIReconcile,
  onOpenAudit,
  onOpenHouseCount,
  onNavigateToLocation,
  selectedVillage,
  onSelectVillage,
  theme = 'light',
  onToggleTheme,
}) {
  const { user, isAdmin, switchRole, setIsAuthModalOpen } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced search for properties & worldwide locations
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setLocationSuggestions([]);
      setIsDropdownOpen(false);
      setIsSearchingLocation(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();

    // 1. Search local registered properties
    const filteredProps = properties.filter((p) => {
      const propId = p.property_id?.toLowerCase() || '';
      const village = p.village?.toLowerCase() || '';
      const block = p.block?.toLowerCase() || '';
      const pincode = p.pincode || '';
      const owner = p.owner_name?.toLowerCase() || '';
      return (
        propId.includes(q) ||
        village.includes(q) ||
        block.includes(q) ||
        pincode.includes(q) ||
        owner.includes(q)
      );
    });
    setSuggestions(filteredProps.slice(0, 4));

    // 2. Debounced worldwide location geocoding search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearchingLocation(true);
    const timer = setTimeout(async () => {
      try {
        const locResults = await searchWorldwide(searchQuery, controller.signal);
        if (!controller.signal.aborted) {
          setLocationSuggestions(locResults);
          setIsDropdownOpen(true);
          setIsSearchingLocation(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setIsSearchingLocation(false);
        }
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, properties]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProperty = (prop) => {
    onSelectProperty(prop);
    setSearchQuery(prop.property_id);
    setIsDropdownOpen(false);
  };

  const handleSelectLocation = (loc) => {
    setSearchQuery(loc.name);
    setIsDropdownOpen(false);
    if (onNavigateToLocation) {
      onNavigateToLocation(loc);
    }
  };

  const handleMyLocation = async () => {
    setIsDropdownOpen(false);
    setSearchQuery('Detecting Real Location...');
    try {
      const realProfile = await getUserRealLocation();
      setSearchQuery(realProfile.name || realProfile.village);
      if (onNavigateToLocation) {
        onNavigateToLocation(realProfile);
      }
    } catch (err) {
      console.warn('Location detection notice:', err);
      setSearchQuery('My Location');
    }
  };

  return (
    <header className="top-nav">
      {/* Brand Card */}
      <div className="brand-card">
        <div className="brand-emblem">भू</div>
        <div className="brand-text">
          <h1>
            BHU-ID
            <span className="brand-badge">Surface GIS</span>
          </h1>
          <p>ULPIN-ready spatial identity layer</p>
        </div>
      </div>

      {/* Search Bar with Worldwide Locations & Auto-Formula */}
      <div className="search-container" ref={searchRef}>
        <div className="search-box">
          {isSearchingLocation ? (
            <Loader2 size={18} className="search-icon spin-animate" color="#1a73e8" />
          ) : (
            <Search size={18} className="search-icon" />
          )}
          <input
            type="text"
            className="search-input"
            placeholder="Search Google Maps coords, Plus Code, URL, village, address (25.4358, 81.8463 / 7JVW52GR+PQ / Koraon / Tokyo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (locationSuggestions.length > 0) {
                  handleSelectLocation(locationSuggestions[0]);
                } else if (suggestions.length > 0) {
                  handleSelectProperty(suggestions[0]);
                }
              }
            }}
            onFocus={() => {
              setIsDropdownOpen(true);
            }}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => {
                setSearchQuery('');
                setIsDropdownOpen(false);
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isDropdownOpen && (suggestions.length > 0 || locationSuggestions.length > 0 || !searchQuery.trim()) && (
          <div className="search-dropdown">
            {/* Worldwide Geocoded Locations */}
            {locationSuggestions.length > 0 && (
              <>
                <div className="search-section-label">
                  <Globe size={13} color="#1a73e8" />
                  <span>Worldwide Locations & Auto-Formula</span>
                </div>
                {locationSuggestions.map((loc, idx) => (
                  <div
                    key={`${loc.name}_${loc.lat}_${idx}`}
                    className="search-result-item location-result"
                    onClick={() => handleSelectLocation(loc)}
                  >
                    <div className="result-main">
                      <span className="location-flag-badge">{loc.flag || '📍'}</span>
                      <div className="result-text-container">
                        <div className="result-title-row">
                          <span className="result-title">{loc.name}</span>
                          <span className="formula-mini-pill" title="Auto-Generated Cadastral Scheme">
                            {loc.pincode}-{loc.village_code}-H{'{NO}'}
                          </span>
                        </div>
                        <div className="result-sub">
                          {loc.subtext} {loc.pincode ? `• PIN ${loc.pincode}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="location-go-badge">Navigate →</span>
                  </div>
                ))}
              </>
            )}

            {/* Registered Properties in DB */}
            {suggestions.length > 0 && (
              <>
                <div className="search-section-label">
                  <MapPin size={13} color="#188038" />
                  <span>Registered BHU-ID Properties</span>
                </div>
                {suggestions.map((p) => (
                  <div
                    key={p.id || p.property_id}
                    className="search-result-item"
                    onClick={() => handleSelectProperty(p)}
                  >
                    <div className="result-main">
                      <MapPin size={16} color="#1a73e8" />
                      <div>
                        <div className="result-title">{p.property_id}</div>
                        <div className="result-sub">
                          {p.village}, {p.block} • PIN {p.pincode} • {p.owner_name}
                        </div>
                      </div>
                    </div>
                    <span className={`status-badge ${p.status?.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Default Quick Hubs when focused with empty query */}
            {!searchQuery.trim() && (
              <>
                <div className="search-section-label">
                  <Compass size={13} color="#1a73e8" />
                  <span>Quick Worldwide Hubs & Smart Cities</span>
                </div>
                {[
                  { name: 'Noida Sector 62', subtext: 'Gautam Buddh Nagar, Uttar Pradesh', lat: 28.6273, lng: 77.3714, pincode: '201309', village_code: 'NOI062', flag: '🇮🇳' },
                  { name: 'Delhi (New Delhi)', subtext: 'Connaught Place, National Capital Territory', lat: 28.6139, lng: 77.2090, pincode: '110001', village_code: 'DEL001', flag: '🇮🇳' },
                  { name: 'Babhani Hethar', subtext: 'Deoria District, Uttar Pradesh', lat: 26.1223, lng: 83.7812, pincode: '274001', village_code: 'BAB001', flag: '🇮🇳' },
                  { name: 'Lakshmipur', subtext: 'Koraon, Prayagraj, UP (Default GIS)', lat: 25.4358, lng: 81.8463, pincode: '212306', village_code: 'LAK042', flag: '🇮🇳' },
                  { name: 'Bangalore (Bengaluru)', subtext: 'Karnataka Tech Hub', lat: 12.9716, lng: 77.5946, pincode: '560001', village_code: 'BLR001', flag: '🇮🇳' },
                  { name: 'Mumbai', subtext: 'Maharashtra Capital Hub', lat: 19.0760, lng: 72.8777, pincode: '400001', village_code: 'BOM001', flag: '🇮🇳' },
                  { name: 'Tokyo', subtext: 'Chiyoda, Tokyo Metropolis, Japan', lat: 35.6762, lng: 139.6503, pincode: '100-0001', village_code: 'TOK100', flag: '🇯🇵' },
                  { name: 'New York City', subtext: 'Manhattan, New York, USA', lat: 40.7128, lng: -74.0060, pincode: '10001', village_code: 'NYC100', flag: '🇺🇸' },
                  { name: 'London', subtext: 'Westminster, Greater London, UK', lat: 51.5074, lng: -0.1278, pincode: 'SW1A 1AA', village_code: 'LON001', flag: '🇬🇧' },
                  { name: 'Paris', subtext: 'Île-de-France, France', lat: 48.8566, lng: 2.3522, pincode: '75001', village_code: 'PAR750', flag: '🇫🇷' },
                ].map((loc) => {
                  const prof = generateLocationCadastralProfile(loc);
                  return (
                    <div
                      key={loc.name}
                      className="search-result-item location-result"
                      onClick={() => handleSelectLocation(prof)}
                    >
                      <div className="result-main">
                        <span className="location-flag-badge">{loc.flag}</span>
                        <div className="result-text-container">
                          <div className="result-title-row">
                            <span className="result-title">{loc.name}</span>
                            <span className="formula-mini-pill">
                              {prof.pincode}-{prof.village_code}-H{'{NO}'}
                            </span>
                          </div>
                          <div className="result-sub">{loc.subtext} • PIN {prof.pincode}</div>
                        </div>
                      </div>
                      <span className="location-go-badge">Go →</span>
                    </div>
                  );
                })}
              </>
            )}

            {/* My Location Quick Action */}
            <div className="search-result-item my-location-item" onClick={handleMyLocation}>
              <div className="result-main">
                <Navigation size={16} color="#1a73e8" />
                <div>
                  <div className="result-title">📍 Use My Location (Live GPS)</div>
                  <div className="result-sub">Calibrate geospatial view to current coordinates</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Right */}
      <div className="nav-actions">
        {/* Dataset Sync Status Pill */}
        <div className="dataset-pill" title="Datasets: Google, SVAMITVA, e-Naksha synchronized">
          <span className="status-dot pulse"></span>
          <span>3 Sources Active</span>
        </div>

        {/* AI Satellite House Counting Button */}
        <button 
          className="action-btn highlight-scan" 
          onClick={onOpenHouseCount} 
          title="AI Satellite House Counting & Footprint Identification"
        >
          <Scan size={16} color="#00a884" />
          <span>AI House Count</span>
        </button>

        {/* Quick Field Capture Action */}
        <button className="action-btn primary" onClick={onOpenCapture}>
          <PlusCircle size={17} />
          <span>Capture Parcel</span>
        </button>

        {/* AI Reconciliation Quick Trigger */}
        <button className="action-btn" onClick={onOpenAIReconcile} title="View AI Identity Resolution">
          <Sparkles size={16} color="#1a73e8" />
          <span>Identity Engine</span>
        </button>

        {/* Admin Data Ingestion Suite (Admin only) */}
        {isAdmin && (
          <button className="action-btn" onClick={onOpenAdmin} title="Admin Data Ingestion & Ingestion Hub">
            <Database size={16} color="#188038" />
            <span>Data Ingestion</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbc04" /> : <Moon size={18} color="#5f6368" />}
        </button>

        {/* User Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            className="action-btn"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <UserCheck size={16} color="#1a73e8" />
            <span>{isAdmin ? 'Admin' : 'Field Surveyor'}</span>
            <ChevronDown size={14} />
          </button>

          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '58px',
                right: 0,
                width: '210px',
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-floating)',
                padding: '8px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Simulate Role
              </div>
              <button
                className="search-result-item"
                style={{ width: '100%', border: 'none', background: isAdmin ? 'var(--primary-light)' : 'transparent' }}
                onClick={() => {
                  switchRole('ADMIN');
                  setIsUserMenuOpen(false);
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Administrator</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Full Ingestion & AI Matching</div>
                </div>
              </button>

              <button
                className="search-result-item"
                style={{ width: '100%', border: 'none', background: !isAdmin ? 'var(--primary-light)' : 'transparent' }}
                onClick={() => {
                  switchRole('USER');
                  setIsUserMenuOpen(false);
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Field Surveyor</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mobile Capture & Inspection</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
