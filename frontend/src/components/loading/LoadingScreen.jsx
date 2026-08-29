import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Activity, 
  Radio, 
  Cloud,
  Zap,
} from 'lucide-react';
import './LoadingScreen.css';

const LOADING_STAGES = [
  { threshold: 20, label: 'INITIALIZING 4X4 FIELD TELEMETRY...', status: ['ACQUIRING', 'BOOTING', 'CALIBRATING', 'DISCONNECTED'] },
  { threshold: 45, label: 'LOCKING HARDWARE GPS & IMU COVERT ARRAY...', status: ['ACQUIRED', 'STABILIZING', 'CALIBRATING', 'CONNECTING'] },
  { threshold: 75, label: 'CALIBRATING SATELLITE ROOFTOP SENSORS...', status: ['ACQUIRED', 'STABILIZING', 'CALIBRATING', 'SYNCING'] },
  { threshold: 92, label: 'SYNCING CADASTRAL GIS DATABASE...', status: ['ACQUIRED', 'CALIBRATED', 'ACTIVE', 'SYNCING'] },
  { threshold: 100, label: 'BHU-ID MINTING ENGINE READY', status: ['ACQUIRED', 'CALIBRATED', 'ACTIVE', 'CONNECTED'] },
];

export function LoadingScreen({ isLoading = true, onFinish }) {
  const [progress, setProgress] = useState(12);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 500);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + step, 95);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isLoading, onFinish]);

  if (!visible) return null;

  const currentStage =
    LOADING_STAGES.find((s) => progress <= s.threshold) ||
    LOADING_STAGES[LOADING_STAGES.length - 1];

  return (
    <div className={`sih-loading-overlay ${!isLoading ? 'fade-out' : ''}`}>
      {/* Ambient Full-Viewport Background Clouds (Outside of the Box) */}
      <div className="sih-ambient-clouds-bg" aria-hidden="true">
        {/* Ambient Cloud 1 (Top Right Drift) */}
        <svg className="sih-ambient-cloud cloud-pos-1" viewBox="0 0 100 35" fill="none">
          <path
            d="M10 26C10 20.5 14.5 16 20 16C21.5 16 22.8 16.3 24 16.9C26.2 12.8 30.5 10 35.5 10C43 10 49 16 49 23.5C52.5 24.2 55 27.3 55 31C55 35.4 51.4 39 47 39H20C14.5 39 10 34.5 10 29"
            fill="currentColor"
          />
        </svg>

        {/* Ambient Cloud 2 (Mid-High Left Parallax) */}
        <svg className="sih-ambient-cloud cloud-pos-2" viewBox="0 0 100 35" fill="none">
          <path
            d="M10 26C10 20.5 14.5 16 20 16C21.5 16 22.8 16.3 24 16.9C26.2 12.8 30.5 10 35.5 10C43 10 49 16 49 23.5C52.5 24.2 55 27.3 55 31C55 35.4 51.4 39 47 39H20C14.5 39 10 34.5 10 29"
            fill="currentColor"
          />
        </svg>

        {/* Ambient Cloud 3 (Mid-Low Right Drift) */}
        <svg className="sih-ambient-cloud cloud-pos-3" viewBox="0 0 100 35" fill="none">
          <path
            d="M10 26C10 20.5 14.5 16 20 16C21.5 16 22.8 16.3 24 16.9C26.2 12.8 30.5 10 35.5 10C43 10 49 16 49 23.5C52.5 24.2 55 27.3 55 31C55 35.4 51.4 39 47 39H20C14.5 39 10 34.5 10 29"
            fill="currentColor"
          />
        </svg>

        {/* Ambient Cloud 4 (Bottom Viewport Drift) */}
        <svg className="sih-ambient-cloud cloud-pos-4" viewBox="0 0 100 35" fill="none">
          <path
            d="M10 26C10 20.5 14.5 16 20 16C21.5 16 22.8 16.3 24 16.9C26.2 12.8 30.5 10 35.5 10C43 10 49 16 49 23.5C52.5 24.2 55 27.3 55 31C55 35.4 51.4 39 47 39H20C14.5 39 10 34.5 10 29"
            fill="currentColor"
          />
        </svg>

        {/* Ambient Cloud 5 (Upper Viewport Drift) */}
        <svg className="sih-ambient-cloud cloud-pos-5" viewBox="0 0 100 35" fill="none">
          <path
            d="M10 26C10 20.5 14.5 16 20 16C21.5 16 22.8 16.3 24 16.9C26.2 12.8 30.5 10 35.5 10C43 10 49 16 49 23.5C52.5 24.2 55 27.3 55 31C55 35.4 51.4 39 47 39H20C14.5 39 10 34.5 10 29"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Top Badge */}
      <div className="sih-top-badge">
        <span className="sih-badge-sq">■</span>
        <span>SIH-2026 // ROUGH TERRAIN FIELD SURVEYOR</span>
      </div>

      {/* Main Card - Chrome Offline Dino Palette */}
      <div className="sih-loading-card">
        {/* Emblem */}
        <div className="sih-app-emblem">
          <span className="sih-emblem-char">भू</span>
        </div>

        {/* Title */}
        <h2 className="sih-app-title">भू-आईडी</h2>
        <div className="sih-app-sub">BHU-ID GIS PLATFORM</div>

        {/* Recon Pill */}
        <div className="sih-recon-pill">
          <span>🚙</span>
          <span>4X4 FIELD RECONNAISSANCE • ROUGH ROAD SYNC</span>
        </div>

        {/* Inset Illustration Box */}
        <div className="sih-illustration-box">
          <svg
            className="sih-svg-canvas"
            viewBox="0 0 600 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="scene-clip">
                <rect x="0" y="0" width="600" height="180" rx="14" />
              </clipPath>
            </defs>

            <g clipPath="url(#scene-clip)">
              {/* 1. Scrolling Clouds Layer (Chrome Offline Grey Tones) */}
              <g className="sih-clouds-layer">
                {/* Cloud 1 */}
                <path
                  d="M180 34C180 29.5 183.5 26 188 26C189.2 26 190.3 26.3 191.2 26.8C193 23.5 196.5 21 200.5 21C206.5 21 211.5 26 211.5 32C214.5 32.6 216.5 35.2 216.5 38.2C216.5 41.8 213.5 44.8 210 44.8H188C183.5 44.8 180 41.2 180 36.8"
                  fill="#D8D8D8"
                  opacity="0.85"
                />
                {/* Cloud 2 */}
                <path
                  d="M480 38C480 32.5 484.5 28 490 28C491.5 28 492.8 28.3 494 28.9C496.2 24.8 500.5 22 505.5 22C513 22 519 28 519 35.5C522.5 36.2 525 39.3 525 43C525 47.4 521.4 51 517 51H490C484.5 51 480 46.5 480 41"
                  fill="#D8D8D8"
                  opacity="0.85"
                />
                {/* Cloud 3 (Duplicate for seamless loop) */}
                <path
                  d="M780 34C780 29.5 783.5 26 788 26C789.2 26 790.3 26.3 791.2 26.8C793 23.5 796.5 21 800.5 21C806.5 21 811.5 26 811.5 32C814.5 32.6 816.5 35.2 816.5 38.2C816.5 41.8 813.5 44.8 810 44.8H788C783.5 44.8 780 41.2 780 36.8"
                  fill="#D8D8D8"
                  opacity="0.85"
                />
                {/* Cloud 4 (Duplicate for seamless loop) */}
                <path
                  d="M1080 38C1080 32.5 1084.5 28 1090 28C1091.5 28 1092.8 28.3 1094 28.9C1096.2 24.8 1100.5 22 1105.5 22C1113 22 1119 28 1119 35.5C1122.5 36.2 1125 39.3 1125 43C1125 47.4 1121.4 51 1117 51H1090C1084.5 51 1080 46.5 1080 41"
                  fill="#D8D8D8"
                  opacity="0.85"
                />
              </g>

              {/* 2. Scrolling Distant Mountains (Far Parallax Layer) */}
              <g className="sih-mountains-far">
                <path
                  d="M0 145L70 125L140 138L210 115L290 135L360 118L440 132L510 120L600 138L670 125L740 138L810 115L890 135L960 118L1040 132L1110 120L1200 138V155H0V145Z"
                  fill="#E5E5E5"
                  opacity="0.6"
                />
              </g>

              {/* 3. Scrolling Mid-Distance Hills (Near Parallax Layer) */}
              <g className="sih-mountains-near">
                <path
                  d="M0 150L90 138L180 146L260 130L340 144L420 132L500 142L600 134L690 138L780 146L860 130L940 144L1020 132L1100 142L1200 134V155H0V150Z"
                  fill="#CCCCCC"
                  opacity="0.75"
                />
              </g>

              {/* 4. Ground Line (Signature Chrome Dino Horizon Line) */}
              <path d="M0 152H600" stroke="#535353" strokeWidth="1.8" />

              {/* 5. Scrolling Terrain Rocks & Pixel Horizon Texture */}
              <g className="sih-ground-rocks">
                {/* Group 1 (0 to 600px) */}
                <ellipse cx="60" cy="155" rx="5" ry="2" fill="#535353" />
                <ellipse cx="180" cy="154" rx="4" ry="1.5" fill="#757575" />
                <ellipse cx="290" cy="155" rx="7" ry="2.5" fill="#535353" />
                <ellipse cx="370" cy="154" rx="5" ry="2" fill="#757575" />
                <ellipse cx="460" cy="155" rx="6" ry="2" fill="#535353" />
                <ellipse cx="530" cy="154" rx="4" ry="1.5" fill="#757575" />
                {/* Group 2 Duplicate (600 to 1200px for seamless loop) */}
                <ellipse cx="660" cy="155" rx="5" ry="2" fill="#535353" />
                <ellipse cx="780" cy="154" rx="4" ry="1.5" fill="#757575" />
                <ellipse cx="890" cy="155" rx="7" ry="2.5" fill="#535353" />
                <ellipse cx="970" cy="154" rx="5" ry="2" fill="#757575" />
                <ellipse cx="1060" cy="155" rx="6" ry="2" fill="#535353" />
                <ellipse cx="1130" cy="154" rx="4" ry="1.5" fill="#757575" />
              </g>

              {/* 6. 4x4 Field Reconnaissance Vehicle Group (Suspension Bounces & Tyres Roll) */}
              <g className="sih-vehicle-group">
                {/* Roof Antenna Signal Pulse Waves */}
                <circle cx="42" cy="-4" r="4" fill="none" stroke="#535353" strokeWidth="1.5" className="signal-wave" />
                <circle cx="42" cy="-4" r="8" fill="none" stroke="#535353" strokeWidth="1.2" className="signal-wave-2" />
                <circle cx="42" cy="-4" r="12" fill="none" stroke="#535353" strokeWidth="1.0" className="signal-wave" />

                {/* Roof Rack & GPS Dome Mount */}
                <rect x="14" y="6" width="54" height="3" rx="1.5" fill="#535353" />
                <line x1="22" y1="9" x2="22" y2="12" stroke="#535353" strokeWidth="2" />
                <line x1="58" y1="9" x2="58" y2="12" stroke="#535353" strokeWidth="2" />
                
                {/* Roof Sensor Pod */}
                <rect x="36" y="2" width="12" height="5" rx="2.5" fill="#757575" stroke="#535353" strokeWidth="1" />
                <line x1="42" y1="2" x2="42" y2="-2" stroke="#535353" strokeWidth="2" strokeLinecap="round" />
                <circle cx="42" cy="-3" r="2.5" fill="#535353" />

                {/* Vehicle Body Chassis */}
                {/* Main White/Silver Monocoque Body */}
                <path
                  d="M6 22L14 12H60L74 22H86C88.2 22 90 23.8 90 26V37C90 38.5 88.8 39.5 87.5 39.5H80C80 34 75 30 69 30C63 30 58 34 58 39.5H36C36 34 31 30 25 30C19 30 14 34 14 39.5H4C2.5 39.5 1.5 38.5 1.5 37V26C1.5 23.8 3.5 22 6 22Z"
                  fill="#FFFFFF"
                  stroke="#535353"
                  strokeWidth="2"
                />

                {/* Dark Protective Side Cladding / Lower Rock Sliders */}
                <path d="M36 37H58V39.5H36V37Z" fill="#535353" />

                {/* Front Black Bumper / Bull Bar */}
                <rect x="87" y="27" width="5" height="11" rx="1.5" fill="#535353" stroke="#222222" strokeWidth="1" />
                {/* Front Headlight */}
                <rect x="85" y="24" width="4" height="4" rx="1" fill="#757575" />

                {/* Rear Spare Mount & Bumper */}
                <rect x="0" y="26" width="3" height="11" rx="1" fill="#535353" />

                {/* Window Cutouts & Tint (Retro Monochrome) */}
                {/* Rear Cargo Window */}
                <path d="M16 14H28V21H10L16 14Z" fill="#E5E5E5" opacity="0.95" stroke="#535353" strokeWidth="1.2" />
                {/* Rear Passenger Window */}
                <rect x="31" y="14" width="16" height="7" rx="1" fill="#E5E5E5" opacity="0.95" stroke="#535353" strokeWidth="1.2" />
                {/* Front Driver Window */}
                <path d="M50 14H60L67 21H50V14Z" fill="#E5E5E5" opacity="0.95" stroke="#535353" strokeWidth="1.2" />

                {/* Door Seam Lines & Handles */}
                <line x1="48.5" y1="14" x2="48.5" y2="37" stroke="#CCCCCC" strokeWidth="1.2" />
                <rect x="44" y="24" width="3.5" height="1.5" rx="0.5" fill="#535353" />
                <rect x="62" y="24" width="3.5" height="1.5" rx="0.5" fill="#535353" />

                {/* Black Wheel Arch Fenders */}
                <path d="M14 39.5C14 33.5 19 29 25 29C31 29 36 33.5 36 39.5" stroke="#535353" strokeWidth="3" fill="none" />
                <path d="M58 39.5C58 33.5 63 29 69 29C75 29 80 33.5 80 39.5" stroke="#535353" strokeWidth="3" fill="none" />

                {/* Rear Rolling Wheel (Spins/Rolls Continuously around center) */}
                <g className="rolling-wheel-rear">
                  {/* Black Off-Road Tire */}
                  <circle cx="25" cy="40" r="11" fill="#333333" stroke="#111111" strokeWidth="1.5" />
                  {/* Tire Tread Grooves */}
                  <line x1="25" y1="29.5" x2="25" y2="32" stroke="#757575" strokeWidth="1.8" />
                  <line x1="25" y1="48" x2="25" y2="50.5" stroke="#757575" strokeWidth="1.8" />
                  <line x1="14.5" y1="40" x2="17" y2="40" stroke="#757575" strokeWidth="1.8" />
                  <line x1="33" y1="40" x2="35.5" y2="40" stroke="#757575" strokeWidth="1.8" />
                  {/* Rim */}
                  <circle cx="25" cy="40" r="7.5" fill="#757575" stroke="#535353" strokeWidth="1" />
                  {/* 4-Spoke White Alloy Pattern */}
                  <line x1="25" y1="33" x2="25" y2="47" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="18" y1="40" x2="32" y2="40" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="20" y1="35" x2="30" y2="45" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="20" y1="45" x2="30" y2="35" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                  {/* White Center Hubcap */}
                  <circle cx="25" cy="40" r="2.8" fill="#FFFFFF" />
                  <circle cx="25" cy="40" r="1.2" fill="#222222" />
                </g>

                {/* Front Rolling Wheel (Spins/Rolls Continuously around center) */}
                <g className="rolling-wheel-front">
                  {/* Black Off-Road Tire */}
                  <circle cx="69" cy="40" r="11" fill="#333333" stroke="#111111" strokeWidth="1.5" />
                  {/* Tire Tread Grooves */}
                  <line x1="69" y1="29.5" x2="69" y2="32" stroke="#757575" strokeWidth="1.8" />
                  <line x1="69" y1="48" x2="69" y2="50.5" stroke="#757575" strokeWidth="1.8" />
                  <line x1="58.5" y1="40" x2="61" y2="40" stroke="#757575" strokeWidth="1.8" />
                  <line x1="77" y1="40" x2="79.5" y2="40" stroke="#757575" strokeWidth="1.8" />
                  {/* Rim */}
                  <circle cx="69" cy="40" r="7.5" fill="#757575" stroke="#535353" strokeWidth="1" />
                  {/* 4-Spoke White Alloy Pattern */}
                  <line x1="69" y1="33" x2="69" y2="47" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="62" y1="40" x2="76" y2="40" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="64" y1="35" x2="74" y2="45" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="64" y1="45" x2="74" y2="35" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                  {/* White Center Hubcap */}
                  <circle cx="69" cy="40" r="2.8" fill="#FFFFFF" />
                  <circle cx="69" cy="40" r="1.2" fill="#222222" />
                </g>
              </g>

              {/* 7. Space Satellite in Orbit */}
              <g transform="translate(305, 30)">
                {/* Solar Panels Left */}
                <rect x="-24" y="-7" width="18" height="14" rx="1.5" fill="#757575" stroke="#535353" strokeWidth="1" />
                <line x1="-15" y1="-7" x2="-15" y2="7" stroke="#A0A0A0" strokeWidth="0.8" />

                {/* Satellite Core */}
                <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#F0F0F0" stroke="#535353" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="2" fill="#535353" />

                {/* Solar Panels Right */}
                <rect x="6" y="-7" width="18" height="14" rx="1.5" fill="#757575" stroke="#535353" strokeWidth="1" />
                <line x1="15" y1="-7" x2="15" y2="7" stroke="#A0A0A0" strokeWidth="0.8" />

                {/* Dish */}
                <path d="M-4 6L0 12L4 6" stroke="#535353" strokeWidth="1.5" fill="none" />
              </g>

              {/* 8. Base Station Tower on Right */}
              <g transform="translate(485, 110)">
                {/* Signal Waves */}
                <circle cx="10" cy="-6" r="4" fill="none" stroke="#535353" strokeWidth="1.5" className="signal-wave" />
                <circle cx="10" cy="-6" r="7" fill="none" stroke="#535353" strokeWidth="1.2" className="signal-wave-2" />

                {/* Antenna Mast */}
                <rect x="7" y="10" width="6" height="32" rx="2" fill="#757575" />
                <line x1="10" y1="-4" x2="10" y2="10" stroke="#535353" strokeWidth="2" />
                <circle cx="10" cy="-4" r="3" fill="#535353" />
              </g>

              {/* 9. Signal Transmission Arcs */}
              {/* Vehicle -> Satellite */}
              <path
                d="M135 90 C 180 30, 240 25, 295 32"
                fill="none"
                stroke="#757575"
                strokeWidth="1.5"
                className="signal-arc"
              />

              {/* Satellite -> Base Station */}
              <path
                d="M325 35 C 380 38, 440 60, 485 102"
                fill="none"
                stroke="#757575"
                strokeWidth="1.5"
                className="signal-arc"
              />
            </g>
          </svg>

          {/* Progress Status Row */}
          <div className="sih-progress-header">
            <div className="sih-status-text">
              <Zap size={12} className="sih-bolt-icon" />
              <span>{currentStage.label}</span>
            </div>
            <span className="sih-percent-text">{progress}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="sih-progress-track">
            <div className="sih-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 4 Bottom Diagnostic Tiles */}
        <div className="sih-diag-grid">
          {/* 1. GPS Lock */}
          <div className="sih-diag-tile">
            <div className="sih-diag-icon-box">
              <MapPin size={14} color="#535353" />
            </div>
            <div className="sih-diag-info">
              <span className="sih-diag-label">GPS LOCK</span>
              <span className={`sih-diag-status ${currentStage.status[0] === 'ACQUIRED' ? 'success' : 'active'}`}>
                {currentStage.status[0]}
              </span>
            </div>
          </div>

          {/* 2. IMU System */}
          <div className="sih-diag-tile">
            <div className="sih-diag-icon-box">
              <Activity size={14} color="#535353" />
            </div>
            <div className="sih-diag-info">
              <span className="sih-diag-label">IMU SYSTEM</span>
              <span className={`sih-diag-status ${currentStage.status[1] === 'CALIBRATED' ? 'success' : 'active'}`}>
                {currentStage.status[1]}
              </span>
            </div>
          </div>

          {/* 3. Sensor Array */}
          <div className="sih-diag-tile">
            <div className="sih-diag-icon-box">
              <Radio size={14} color="#535353" />
            </div>
            <div className="sih-diag-info">
              <span className="sih-diag-label">SENSOR ARRAY</span>
              <span className={`sih-diag-status ${currentStage.status[2] === 'ACTIVE' ? 'success' : 'active'}`}>
                {currentStage.status[2]}
              </span>
            </div>
          </div>

          {/* 4. Data Link */}
          <div className="sih-diag-tile">
            <div className="sih-diag-icon-box">
              <Cloud size={14} color="#535353" />
            </div>
            <div className="sih-diag-info">
              <span className="sih-diag-label">DATA LINK</span>
              <span className={`sih-diag-status ${currentStage.status[3] === 'CONNECTED' ? 'success' : 'active'}`}>
                {currentStage.status[3]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
