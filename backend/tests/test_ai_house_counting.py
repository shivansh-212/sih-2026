"""
Unit and integration tests for AI House Counting, Computer Vision Rooftop Segmentation,
and Cadastral Code Assignment.
"""

from app.models.property import Property, PropertyStatus
from app.services.building_detector_service import (
    detect_satellite_buildings,
    _cv_segment_rooftops_from_patch,
    _meters_per_deg,
)
from app.services.id_service import generate_cadastral_house_code, normalize_village_code
import numpy as np


def test_cadastral_code_formatting():
    """Test standard format: {PINCODE}-{VILLAGE_CODE}-H{NO}."""
    code1 = generate_cadastral_house_code("212306", "LAK042", 1)
    assert code1 == "212306-LAK042-H001"

    code2 = generate_cadastral_house_code("212306", "LAK042", "H014")
    assert code2 == "212306-LAK042-H014"

    code3 = generate_cadastral_house_code("226001", "LKO001", 105)
    assert code3 == "226001-LKO001-H105"


def test_normalize_village_code():
    """Test village code normalization."""
    vcode = normalize_village_code("Lakshmipur")
    assert vcode.startswith("LAK")
    assert len(vcode) == 6

    # Custom override
    custom = normalize_village_code("Lakshmipur", "CUSTOM99")
    assert custom == "CUSTOM99"


def test_1m_precision_meters_per_deg():
    """Test 1-meter sub-meter ellipsoidal calibration calculation."""
    m_lat, m_lng = _meters_per_deg(25.4358)
    assert 110000.0 < m_lat < 112000.0
    assert 95000.0 < m_lng < 105000.0


def test_cv_tree_masking_and_rooftop_detection():
    """
    Test Computer Vision building segmentation:
    Verify that tree canopies (green foliage) are masked out and
    only building rooftops are detected.
    """
    # Create synthetic 120x120 satellite patch
    # Background: dark soil/road
    patch = np.full((120, 120, 3), 60, dtype=np.uint8)

    # 1. Add Green Tree Canopy (should be filtered out by vegetation mask)
    patch[10:35, 10:35, 0] = 30   # R
    patch[10:35, 10:35, 1] = 165  # G
    patch[10:35, 10:35, 2] = 40   # B

    # 2. Add Real Concrete House Rooftop (bright grey/white flat RCC ~14m x 11m)
    patch[60:78, 60:75, 0] = 210  # R
    patch[60:78, 60:75, 1] = 210  # G
    patch[60:78, 60:75, 2] = 215  # B

    # Bounds representing a ~80m crop micro-zone
    bounds = {
        "north": 25.4364,
        "south": 25.4356,
        "east": 81.8469,
        "west": 81.8461,
    }

    detections = _cv_segment_rooftops_from_patch(patch, bounds, zoom=19)
    assert len(detections) >= 1

    # Check that the detected object is the building, NOT the tree
    for det in detections:
        assert det["roof_type"] in ["Flat RCC Concrete", "Gable Tile / Clay", "Corrugated Metal / Tin"]
        assert 25.0 <= det["area_sq_m"] <= 650.0


def test_detect_satellite_buildings_service():
    """Test building detection simulation at 1m optical scale."""
    result = detect_satellite_buildings(
        center_lat=25.4358,
        center_lng=81.8463,
        pincode="212306",
        village="Lakshmipur",
        village_code="LAK042",
        radius_meters=80.0,
    )
    assert result["success"] is True
    assert result["total_detected"] > 0
    assert result["pincode"] == "212306"
    assert result["village_code"] == "LAK042"

    first_bldg = result["buildings"][0]
    assert first_bldg["cadastral_code"] == "212306-LAK042-H001"
    assert len(first_bldg["polygon"]) == 4
    assert first_bldg["confidence_score"] > 80.0
    assert first_bldg["area_sq_m"] > 0
    assert "1m" in first_bldg["estimated_accuracy"]


def test_unique_sequential_house_numbering_with_db(db):
    """
    Test that AI detection inspects existing DB records and numbers
    new detections sequentially starting AFTER the highest existing house number.
    """
    # Insert existing properties H001, H002, H003
    for num in [1, 2, 3]:
        pid = f"212306-LAK042-H{num:03d}"
        prop = Property(
            property_id=pid,
            pincode="212306",
            village="Lakshmipur",
            block="Koraon",
            district="Prayagraj",
            state="Uttar Pradesh",
            status=PropertyStatus.VERIFIED,
        )
        db.add(prop)
    db.commit()

    result = detect_satellite_buildings(
        center_lat=25.4358,
        center_lng=81.8463,
        pincode="212306",
        village="Lakshmipur",
        village_code="LAK042",
        db=db,
    )
    assert result["success"] is True
    # The next detected building must be H004, NOT H001!
    assert result["buildings"][0]["house_number"] == "H004"
    assert result["buildings"][0]["cadastral_code"] == "212306-LAK042-H004"


def test_ai_detect_houses_api(client, user_headers):
    """Test POST /api/v1/properties/ai-detect-houses."""
    payload = {
        "latitude": 25.4358,
        "longitude": 81.8463,
        "pincode": "212306",
        "village": "Lakshmipur",
        "village_code": "LAK042",
        "block": "Koraon",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "radius_meters": 80.0,
        "zoom_level": 19,
    }
    response = client.post("/api/v1/properties/ai-detect-houses", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_detected"] == len(data["buildings"])
    assert data["buildings"][0]["cadastral_code"].startswith("212306-LAK042-H")


def test_batch_assign_codes_api(client, admin_headers, db):
    """Test POST /api/v1/properties/batch-assign-codes."""
    detect_payload = {
        "latitude": 25.4358,
        "longitude": 81.8463,
        "pincode": "212306",
        "village": "Lakshmipur",
        "village_code": "LAK042",
    }
    detect_res = client.post("/api/v1/properties/ai-detect-houses", json=detect_payload, headers=admin_headers)
    assert detect_res.status_code == 200
    buildings = detect_res.json()["buildings"][:3]

    batch_payload = {
        "village": "Lakshmipur",
        "village_code": "LAK042",
        "block": "Koraon",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "pincode": "212306",
        "verified_buildings": buildings,
    }
    assign_res = client.post("/api/v1/properties/batch-assign-codes", json=batch_payload, headers=admin_headers)
    assert assign_res.status_code == 200
    data = assign_res.json()
    assert data["success"] is True
    assert data["registered_count"] == 3
    assert len(data["properties"]) == 3
    assert data["properties"][0]["property_id"].startswith("212306-LAK042-H")


def test_detect_satellite_buildings_with_crop_bounds():
    """Test AI building detection inside a user-defined cropped bounding box."""
    crop_bounds = {
        "north": 25.4380,
        "south": 25.4340,
        "east": 81.8490,
        "west": 81.8440,
    }
    result = detect_satellite_buildings(
        center_lat=25.4360,
        center_lng=81.8465,
        pincode="201309",
        village="Noida Sector 62",
        village_code="NOI062",
        bounds=crop_bounds,
    )
    assert result["success"] is True
    assert result["total_detected"] >= 2
    assert result["pincode"] == "201309"
    assert result["village_code"] == "NOI062"

    for bldg in result["buildings"]:
        assert bldg["cadastral_code"].startswith("201309-NOI062-H")
        assert crop_bounds["south"] <= bldg["latitude"] <= crop_bounds["north"]
        assert crop_bounds["west"] <= bldg["longitude"] <= crop_bounds["east"]
        for pt in bldg["polygon"]:
            assert crop_bounds["south"] - 0.0001 <= pt[0] <= crop_bounds["north"] + 0.0001
            assert crop_bounds["west"] - 0.0001 <= pt[1] <= crop_bounds["east"] + 0.0001


def test_ai_detect_houses_crop_bounds_api(client, user_headers):
    """Test POST /api/v1/properties/ai-detect-houses with bounding box payload."""
    payload = {
        "latitude": 28.6273,
        "longitude": 77.3714,
        "pincode": "201309",
        "village": "Noida",
        "village_code": "NOI001",
        "block": "Sector 62",
        "district": "Gautam Buddh Nagar",
        "state": "Uttar Pradesh",
        "bounds": {
            "north": 28.6290,
            "south": 28.6250,
            "east": 77.3730,
            "west": 77.3690,
        },
    }
    response = client.post("/api/v1/properties/ai-detect-houses", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_detected"] > 0
    assert data["buildings"][0]["cadastral_code"].startswith("201309-NOI001-H")
