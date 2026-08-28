"""
Spatial / geospatial utilities.
"""

import json
import math
from typing import Any


def haversine_distance(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
) -> float:
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.
    Returns distance in meters.
    """
    R = 6_371_000  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2)
        * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def geojson_to_wkt(geojson: dict | None) -> str | None:
    """
    Convert a GeoJSON geometry dict to WKT string for PostGIS.
    Supports Point, Polygon, MultiPolygon.
    Returns None if input is invalid.
    """
    if geojson is None:
        return None

    geom_type = geojson.get("type")
    coords = geojson.get("coordinates")

    if not geom_type or coords is None:
        return None

    if geom_type == "Point":
        return f"POINT({coords[0]} {coords[1]})"

    elif geom_type == "Polygon":
        rings = []
        for ring in coords:
            points = ", ".join(f"{p[0]} {p[1]}" for p in ring)
            rings.append(f"({points})")
        return f"POLYGON({', '.join(rings)})"

    elif geom_type == "MultiPolygon":
        polygons = []
        for polygon in coords:
            rings = []
            for ring in polygon:
                points = ", ".join(f"{p[0]} {p[1]}" for p in ring)
                rings.append(f"({points})")
            polygons.append(f"({', '.join(rings)})")
        return f"MULTIPOLYGON({', '.join(polygons)})"

    return None


def point_wkt(longitude: float, latitude: float) -> str:
    """Create a WKT POINT string from longitude and latitude."""
    return f"SRID=4326;POINT({longitude} {latitude})"


def build_feature(
    property_id: str,
    geometry_geojson: dict | None,
    latitude: float | None,
    longitude: float | None,
    properties: dict,
) -> dict:
    """
    Build a single GeoJSON Feature dict.
    If geometry_geojson is None but lat/lng exist, creates a Point.
    """
    geometry = geometry_geojson

    if geometry is None and latitude is not None and longitude is not None:
        geometry = {
            "type": "Point",
            "coordinates": [float(longitude), float(latitude)],
        }

    return {
        "type": "Feature",
        "geometry": geometry,
        "properties": properties,
    }


def build_feature_collection(features: list[dict]) -> dict:
    """Assemble a GeoJSON FeatureCollection from a list of features."""
    return {
        "type": "FeatureCollection",
        "features": features,
    }
