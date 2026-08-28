/**
 * Worldwide Geocoding & Automatic Cadastral Formula Service.
 * Allows searching any place in the entire world by:
 * - City / Village / Locality name (e.g., 'Noida', 'Tokyo', 'Babhani Hethar', 'Paris', 'Prayagraj')
 * - Pincode / Postal code / Zip code (e.g., '201309', '110001', '90210', '75001', '274001', '560001')
 * - GPS Coordinates (e.g., '28.6273, 77.3714' or '40.7128, -74.0060')
 * 
 * Automatically generates the unique Cadastral Formula for that location:
 * {PINCODE}-{VILLAGE_CODE}-H{NO}
 */

// Popular global & Indian locations for instantaneous offline suggestions
const GLOBAL_GAZETTEER = [
  // India Metros & Smart Cities
  { name: 'Noida', subtext: 'Sector 62, Gautam Buddh Nagar, UP', lat: 28.6273, lng: 77.3714, pincode: '201309', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Delhi', subtext: 'Connaught Place, New Delhi', lat: 28.6139, lng: 77.2090, pincode: '110001', state: 'Delhi', country: 'India', flag: '🇮🇳' },
  { name: 'Babhani Hethar', subtext: 'Deoria District, Uttar Pradesh', lat: 26.1223, lng: 83.7812, pincode: '274001', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Lakshmipur', subtext: 'Koraon, Prayagraj, UP', lat: 25.4358, lng: 81.8463, pincode: '212306', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Mumbai', subtext: 'Fort, Brihanmumbai, Maharashtra', lat: 19.0760, lng: 72.8777, pincode: '400001', state: 'Maharashtra', country: 'India', flag: '🇮🇳' },
  { name: 'Bangalore', subtext: 'MG Road, Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, pincode: '560001', state: 'Karnataka', country: 'India', flag: '🇮🇳' },
  { name: 'Hyderabad', subtext: 'Hitec City / Cyberabad, Telangana', lat: 17.3850, lng: 78.4867, pincode: '500001', state: 'Telangana', country: 'India', flag: '🇮🇳' },
  { name: 'Chennai', subtext: 'George Town, Tamil Nadu', lat: 13.0827, lng: 80.2707, pincode: '600001', state: 'Tamil Nadu', country: 'India', flag: '🇮🇳' },
  { name: 'Kolkata', subtext: 'BBD Bagh, West Bengal', lat: 22.5726, lng: 88.3639, pincode: '700001', state: 'West Bengal', country: 'India', flag: '🇮🇳' },
  { name: 'Lucknow', subtext: 'Hazratganj, Uttar Pradesh', lat: 26.8467, lng: 80.9462, pincode: '226001', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Varanasi', subtext: 'Ghats / Kashi, Uttar Pradesh', lat: 25.3176, lng: 82.9739, pincode: '221001', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Prayagraj', subtext: 'Civil Lines / Sangam, UP', lat: 25.4358, lng: 81.8463, pincode: '211001', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Ayodhya', subtext: 'Ram Janmabhoomi, Uttar Pradesh', lat: 26.7922, lng: 82.1998, pincode: '224123', state: 'Uttar Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Jaipur', subtext: 'Pink City, Rajasthan', lat: 26.9124, lng: 75.7873, pincode: '302001', state: 'Rajasthan', country: 'India', flag: '🇮🇳' },
  { name: 'Ahmedabad', subtext: 'Gujarat Smart City Hub', lat: 23.0225, lng: 72.5714, pincode: '380001', state: 'Gujarat', country: 'India', flag: '🇮🇳' },
  { name: 'Pune', subtext: 'Shivajinagar, Maharashtra', lat: 18.5204, lng: 73.8567, pincode: '411001', state: 'Maharashtra', country: 'India', flag: '🇮🇳' },
  { name: 'Chandigarh', subtext: 'Sector 17, Punjab / Haryana', lat: 30.7333, lng: 76.7794, pincode: '160017', state: 'Chandigarh', country: 'India', flag: '🇮🇳' },
  { name: 'Patna', subtext: 'Gandhi Maidan, Bihar', lat: 25.5941, lng: 85.1376, pincode: '800001', state: 'Bihar', country: 'India', flag: '🇮🇳' },
  { name: 'Bhopal', subtext: 'Arera Colony, Madhya Pradesh', lat: 23.2599, lng: 77.4126, pincode: '462001', state: 'Madhya Pradesh', country: 'India', flag: '🇮🇳' },
  { name: 'Indore', subtext: 'Rajwada, Madhya Pradesh', lat: 22.7196, lng: 75.8577, pincode: '452001', state: 'Madhya Pradesh', country: 'India', flag: '🇮🇳' },

  // Global Metros & Major World Hubs
  { name: 'New York', subtext: 'Manhattan, New York, USA', lat: 40.7128, lng: -74.0060, pincode: '10001', state: 'New York', country: 'USA', flag: '🇺🇸' },
  { name: 'London', subtext: 'Westminster, Greater London, UK', lat: 51.5074, lng: -0.1278, pincode: 'SW1A 1AA', state: 'England', country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Paris', subtext: 'Île-de-France, France', lat: 48.8566, lng: 2.3522, pincode: '75001', state: 'Île-de-France', country: 'France', flag: '🇫🇷' },
  { name: 'Tokyo', subtext: 'Chiyoda, Tokyo, Japan', lat: 35.6762, lng: 139.6503, pincode: '100-0001', state: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { name: 'Dubai', subtext: 'Downtown Dubai, UAE', lat: 25.2048, lng: 55.2708, pincode: '00000', state: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Singapore', subtext: 'Central Area, Singapore', lat: 1.3521, lng: 103.8198, pincode: '018989', state: 'Central', country: 'Singapore', flag: '🇸🇬' },
  { name: 'Sydney', subtext: 'CBD, New South Wales, Australia', lat: -33.8688, lng: 151.2093, pincode: '2000', state: 'New South Wales', country: 'Australia', flag: '🇦🇺' },
  { name: 'Berlin', subtext: 'Mitte, Berlin, Germany', lat: 52.5200, lng: 13.4050, pincode: '10115', state: 'Berlin', country: 'Germany', flag: '🇩🇪' },
  { name: 'Toronto', subtext: 'Downtown, Ontario, Canada', lat: 43.6532, lng: -79.3832, pincode: 'M5H 2N2', state: 'Ontario', country: 'Canada', flag: '🇨🇦' },
  { name: 'San Francisco', subtext: 'Silicon Valley, California, USA', lat: 37.7749, lng: -122.4194, pincode: '94102', state: 'California', country: 'USA', flag: '🇺🇸' },
];

/**
 * Clean and standardize village/city code (6 alphanumeric characters)
 * e.g., 'Noida' -> 'NOI062', 'Tokyo' -> 'TOK100', 'Babhani Hethar' -> 'BAB001'
 */
export function generateVillageCode(name, pincode = '') {
  if (!name) return 'VIL001';
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = cleanName.slice(0, 3).padEnd(3, 'X');

  // If pincode has numbers, use last 3 digits
  const pinDigits = String(pincode).replace(/\D/g, '');
  if (pinDigits.length >= 3) {
    const numPart = pinDigits.slice(-3);
    return `${prefix}${numPart}`;
  }

  // Otherwise generate deterministic numeric suffix from name hash
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const suffix = String(Math.abs(hash) % 900 + 100);
  return `${prefix}${suffix}`;
}

/**
 * Generate authoritative Cadastral Formula for any location
 */
export function generateLocationCadastralProfile(item) {
  const pin = String(item.pincode || '212306').trim() || '212306';
  const villageName = item.name || item.village || 'Sector';
  const vCode = item.village_code || generateVillageCode(villageName, pin);
  const formula = `{PINCODE}-{VILLAGE_CODE}-H{NO}`;
  const previewCode = `${pin}-${vCode}-H001`;

  return {
    ...item,
    pincode: pin,
    village: villageName,
    village_code: vCode,
    cadastral_formula: formula,
    preview_code: previewCode,
  };
}

/**
 * Search worldwide locations by city, village, pincode, or coordinates.
 * Combines:
 * 1. Direct GPS coordinate parsing
 * 2. Instant local high-speed gazetteer
 * 3. Live OpenStreetMap Nominatim worldwide geocoding API
 */
export async function searchWorldwide(query, signal) {
  if (!query || !query.trim()) return [];

  const q = query.trim();
  const results = [];
  const seenKeys = new Set();

  // 1. Direct GPS Coordinate Match (e.g., '28.6273, 77.3714' or '28.6273 77.3714')
  const coordRegex = /^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/;
  const coordMatch = q.match(coordRegex);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const pin = `${Math.abs(Math.floor(lat * 100)) % 900000 + 100000}`;
      const item = generateLocationCadastralProfile({
        name: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        subtext: `Direct Spatial Coordinate Point`,
        lat,
        lng,
        pincode: pin,
        village: `GeoPoint`,
        country: 'Global Coordinate',
        flag: '🧭',
        isGPS: true,
      });
      results.push(item);
      seenKeys.add(`${lat.toFixed(4)}_${lng.toFixed(4)}`);
    }
  }

  // 2. High-speed Built-in Global Gazetteer Match
  const qLower = q.toLowerCase();
  for (const loc of GLOBAL_GAZETTEER) {
    const nameMatch = loc.name.toLowerCase().includes(qLower);
    const subMatch = loc.subtext.toLowerCase().includes(qLower);
    const pinMatch = loc.pincode.toLowerCase().includes(qLower);
    const stateMatch = (loc.state || '').toLowerCase().includes(qLower);
    const countryMatch = (loc.country || '').toLowerCase().includes(qLower);

    if (nameMatch || subMatch || pinMatch || stateMatch || countryMatch) {
      const key = `${loc.lat.toFixed(3)}_${loc.lng.toFixed(3)}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push(generateLocationCadastralProfile(loc));
      }
    }
  }

  // 3. Live Worldwide Nominatim Geocoding API
  // Only query online API if query is at least 2 characters
  if (q.length >= 2) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=6`;
      const res = await fetch(url, {
        signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'BhuID-Unified-Geospatial-Search/2.0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const addr = item.address || {};
              const villageName = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || item.name || q;
              const stateName = addr.state || addr.region || addr.province || '';
              const countryName = addr.country || '';
              const postcode = addr.postcode || (GLOBAL_GAZETTEER[0]?.pincode || '212306');
              
              // Country flag helper
              const cCode = (addr.country_code || '').toUpperCase();
              let flag = '🌍';
              if (cCode === 'IN') flag = '🇮🇳';
              else if (cCode === 'US') flag = '🇺🇸';
              else if (cCode === 'GB') flag = '🇬🇧';
              else if (cCode === 'FR') flag = '🇫🇷';
              else if (cCode === 'JP') flag = '🇯🇵';
              else if (cCode === 'AE') flag = '🇦🇪';
              else if (cCode === 'DE') flag = '🇩🇪';
              else if (cCode === 'CA') flag = '🇨🇦';
              else if (cCode === 'AU') flag = '🇦🇺';

              const subtextParts = [stateName, countryName].filter(Boolean);

              results.push(generateLocationCadastralProfile({
                name: villageName,
                subtext: subtextParts.join(', ') || item.display_name.slice(0, 45),
                lat,
                lng,
                pincode: postcode,
                village: villageName,
                state: stateName,
                country: countryName,
                flag,
              }));
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[GeocodingService] Online search notice (using offline gazetteer):', err);
      }
    }
  }

  return results.slice(0, 8);
}
