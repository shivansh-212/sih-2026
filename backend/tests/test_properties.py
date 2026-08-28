"""
Tests for property endpoints.
"""

from tests.conftest import TestSessionLocal
from app.models.property import Property, PropertyStatus


def _create_test_property(db, property_id="BHU-UP-LKO-abc12345", **kwargs):
    """Helper to create a test property directly in DB."""
    defaults = {
        "property_id": property_id,
        "village": "Test Village",
        "block": "Test Block",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "pincode": "226001",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "confidence_score": 85.0,
        "status": PropertyStatus.VERIFIED,
    }
    defaults.update(kwargs)
    prop = Property(**defaults)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


def test_list_properties(client, user_headers, db):
    """Test listing properties (paginated)."""
    _create_test_property(db, "BHU-UP-LKO-11111111")
    _create_test_property(db, "BHU-UP-LKO-22222222", village="Other Village")

    response = client.get("/api/v1/properties", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 2
    assert data["pagination"]["total_items"] == 2


def test_list_properties_unauthenticated(client):
    """Test that unauthenticated requests are rejected."""
    response = client.get("/api/v1/properties")
    assert response.status_code == 401


def test_get_property_detail(client, user_headers, db):
    """Test getting a single property by BHU-ID."""
    _create_test_property(db, "BHU-UP-LKO-detail01")

    response = client.get("/api/v1/properties/BHU-UP-LKO-detail01", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["property_id"] == "BHU-UP-LKO-detail01"
    assert data["village"] == "Test Village"


def test_get_property_not_found(client, user_headers):
    """Test 404 for nonexistent property."""
    response = client.get("/api/v1/properties/BHU-XX-XXX-notfound", headers=user_headers)
    assert response.status_code == 404


def test_search_properties(client, user_headers, db):
    """Test property search by village."""
    _create_test_property(db, "BHU-UP-LKO-search01", village="Gomti Nagar")
    _create_test_property(db, "BHU-UP-LKO-search02", village="Hazratganj")

    response = client.get(
        "/api/v1/properties/search?village=Gomti",
        headers=user_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["pagination"]["total_items"] == 1
    assert data["data"][0]["village"] == "Gomti Nagar"


def test_search_properties_by_pincode(client, user_headers, db):
    """Test property search by pincode."""
    _create_test_property(db, "BHU-UP-LKO-pin01", pincode="226001")
    _create_test_property(db, "BHU-UP-LKO-pin02", pincode="226002")

    response = client.get(
        "/api/v1/properties/search?pincode=226001",
        headers=user_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["pagination"]["total_items"] == 1


def test_map_geojson_endpoint(client, user_headers, db):
    """Test map endpoint returns valid GeoJSON FeatureCollection."""
    _create_test_property(db, "BHU-UP-LKO-map01")

    response = client.get("/api/v1/properties/map", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) == 1
    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["properties"]["property_id"] == "BHU-UP-LKO-map01"


def test_stats_endpoint(client, user_headers, db):
    """Test stats endpoint returns dashboard metrics."""
    _create_test_property(db, "BHU-UP-LKO-stat01", status=PropertyStatus.VERIFIED)
    _create_test_property(db, "BHU-UP-LKO-stat02", status=PropertyStatus.PENDING)

    response = client.get("/api/v1/properties/stats", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_properties"] == 2
    assert data["verified_count"] == 1
    assert data["pending_count"] == 1
