# BHU-ID — Unified Surface Property Identity Platform

An enterprise-grade, map-first geospatial identity platform that combines property records from multiple heterogeneous sources (Google Open Buildings, SVAMITVA Drone photogrammetry, e-Naksha cadastral maps), performs AI-assisted 1-meter precision rooftop detection with active tree/vegetation masking, and assigns authoritative, non-duplicating Cadastral IDs: `{PINCODE}-{VILLAGE_CODE}-H{NO}`.

---

## 🌟 Live Access URLs

| Interface | Local Machine | Friends on Same Wi-Fi / LAN |
|---|---|---|
| **Interactive Map & GIS UI** | [http://localhost:5173/](http://localhost:5173/) | `http://192.168.239.19:5173/` |
| **FastAPI Swagger API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | `http://192.168.239.19:8000/docs` |
| **Real-time Telemetry WebSocket** | `ws://localhost:8000/ws` | `ws://192.168.239.19:8000/ws` |

---

## 🚀 Key Features

### 1. 🎯 1-Meter Precision AI Optical House Detection & Tree Masking
- **Tree & Vegetation Masking**: Excess Green Index ($ExG = 2G - R - B > 16$) and chroma thresholding completely eliminate tree canopies, bushes, and garden foliage from detection results.
- **Road & Ground Filtering**: Filters linear roads ($aspect\_ratio > 3.8$) and uniform dirt.
- **1-Meter Calibrated Geodesic Conversions**: Sub-meter WGS84 coordinate calculation accurate to 7 decimal places ($\approx 1.1\text{ cm}$).
- **Roof Material Classification**: Distinguishes `Flat RCC Concrete`, `Gable Tile / Clay`, and `Corrugated Metal / Tin` directly from optical spectral albedo.

### 2. 🛡️ Authoritative Non-Duplicating Cadastral Scheme
- Formula: `{PINCODE}-{VILLAGE_CODE}-H{NO}` (e.g. `212306-LAK042-H013`).
- **Database Non-Duplication**: Automatically queries existing properties under the given Pincode & Village Code and numbers newly detected houses sequentially ($H_{max} + 1$).
- **Spatial Exclusion**: Any detected candidate within 8 meters of an already registered property is filtered out and will **never be shown or allowed to duplicate**.

### 3. 🌍 Worldwide Multi-Modal Location Search
- Search any worldwide location by **City / Village Name**, **Postal / PIN Code** (e.g. `201309`, `10001`, `75001`), or **GPS Coordinates** (`28.6273, 77.3714`).
- Automatically generates the 6-character Village Code and Cadastral Formula for that location on the fly.

### 4. 🔄 Tri-Source Geospatial Identity Reconciliation
- Reconciles records across Google Open Buildings, SVAMITVA, and e-Naksha.
- Computes weighted confidence scores ($0-100\%$) and classifies statuses: `VERIFIED`, `WARNING`, `CONFLICT`.

---

## 🛠️ Quickstart & Local Setup

### 1. Backend Setup (FastAPI & Python 3.14)
```powershell
# Activate environment & start server
.\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (React 19 + Vite)
```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Running Automated Tests
```powershell
.\Scripts\python.exe -m pytest tests/
```
*(All 79 tests passing)*

---

## 📚 Full Documentation
For complete mathematical models, Computer Vision algorithms, database schemas, and architectural diagrams, see:
👉 [SYSTEM_DESIGN_AND_ARCHITECTURE.md](./SYSTEM_DESIGN_AND_ARCHITECTURE.md)
