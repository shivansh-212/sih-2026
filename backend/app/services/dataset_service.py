"""
Dataset ingestion and normalization service.

Architecture: adapter-based — each data source has an adapter that converts
source-specific records into the same normalized internal schema.

Supports CSV, JSON, and GeoJSON uploads.
"""

import csv
import io
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.source_record import SourceRecord, DataSource
from app.services.id_service import get_or_create_property
from app.models.property import PropertyStatus
from app.utils.normalization import normalize_record
from app.utils.geo import point_wkt


# ---------------------------------------------------------------------------
# In-memory dataset tracking (simple dict instead of a new DB table)
# ---------------------------------------------------------------------------

_datasets: dict[str, dict] = {}


def _save_dataset_metadata(
    dataset_id: str,
    filename: str,
    source: str,
    record_count: int,
    filepath: str,
) -> None:
    """Track uploaded dataset in memory."""
    _datasets[dataset_id] = {
        "dataset_id": dataset_id,
        "filename": filename,
        "source": source,
        "record_count": record_count,
        "filepath": filepath,
        "status": "UPLOADED",
        "uploaded_at": datetime.now(timezone.utc),
    }


def list_datasets() -> list[dict]:
    """Return all tracked datasets."""
    return list(_datasets.values())


def get_dataset(dataset_id: str) -> dict | None:
    """Get dataset metadata by ID."""
    return _datasets.get(dataset_id)


# ---------------------------------------------------------------------------
# Source-specific adapters
# ---------------------------------------------------------------------------

class BaseAdapter:
    """Base class for data source adapters."""

    def normalize(self, raw_record: dict) -> dict:
        """Convert source-specific record to normalized schema."""
        raise NotImplementedError


class GoogleAdapter(BaseAdapter):
    """Adapter for Google dataset format."""

    def normalize(self, raw: dict) -> dict:
        return {
            "external_record_id": str(raw.get("id", raw.get("place_id", ""))),
            "village": raw.get("village", raw.get("locality", "")),
            "block": raw.get("block", raw.get("sub_district", "")),
            "district": raw.get("district", raw.get("admin_area_2", "")),
            "state": raw.get("state", raw.get("admin_area_1", "")),
            "pincode": str(raw.get("pincode", raw.get("postal_code", ""))),
            "latitude": raw.get("latitude", raw.get("lat", None)),
            "longitude": raw.get("longitude", raw.get("lng", raw.get("lon", None))),
            "geometry": raw.get("geometry", None),
            "attributes": {
                k: v for k, v in raw.items()
                if k not in {
                    "id", "place_id", "village", "locality", "block",
                    "sub_district", "district", "admin_area_2", "state",
                    "admin_area_1", "pincode", "postal_code", "latitude",
                    "lat", "longitude", "lng", "lon", "geometry",
                }
            },
        }


class SvamitvaAdapter(BaseAdapter):
    """Adapter for SVAMITVA dataset format."""

    def normalize(self, raw: dict) -> dict:
        return {
            "external_record_id": str(raw.get("property_id", raw.get("survey_no", ""))),
            "village": raw.get("village_name", raw.get("village", "")),
            "block": raw.get("block_name", raw.get("block", "")),
            "district": raw.get("district_name", raw.get("district", "")),
            "state": raw.get("state_name", raw.get("state", "")),
            "pincode": str(raw.get("pincode", raw.get("pin_code", ""))),
            "latitude": raw.get("latitude", raw.get("lat", None)),
            "longitude": raw.get("longitude", raw.get("lng", raw.get("lon", None))),
            "geometry": raw.get("geometry", raw.get("geom", None)),
            "attributes": {
                k: v for k, v in raw.items()
                if k not in {
                    "property_id", "survey_no", "village_name", "village",
                    "block_name", "block", "district_name", "district",
                    "state_name", "state", "pincode", "pin_code",
                    "latitude", "lat", "longitude", "lng", "lon",
                    "geometry", "geom",
                }
            },
        }


class ENakshaAdapter(BaseAdapter):
    """Adapter for e-Naksha dataset format."""

    def normalize(self, raw: dict) -> dict:
        return {
            "external_record_id": str(raw.get("plot_no", raw.get("id", ""))),
            "village": raw.get("village", raw.get("village_name", "")),
            "block": raw.get("tehsil", raw.get("block", "")),
            "district": raw.get("district", raw.get("district_name", "")),
            "state": raw.get("state", raw.get("state_name", "")),
            "pincode": str(raw.get("pincode", "")),
            "latitude": raw.get("latitude", raw.get("centroid_lat", None)),
            "longitude": raw.get("longitude", raw.get("centroid_lng", None)),
            "geometry": raw.get("geometry", raw.get("polygon", None)),
            "attributes": {
                k: v for k, v in raw.items()
                if k not in {
                    "plot_no", "id", "village", "village_name", "tehsil",
                    "block", "district", "district_name", "state",
                    "state_name", "pincode", "latitude", "centroid_lat",
                    "longitude", "centroid_lng", "geometry", "polygon",
                }
            },
        }


# Adapter registry
ADAPTERS: dict[str, BaseAdapter] = {
    "GOOGLE": GoogleAdapter(),
    "SVAMITVA": SvamitvaAdapter(),
    "E_NAKSHA": ENakshaAdapter(),
}


# ---------------------------------------------------------------------------
# File parsing
# ---------------------------------------------------------------------------

def _parse_csv(content: str) -> list[dict]:
    """Parse CSV content into list of dicts."""
    reader = csv.DictReader(io.StringIO(content))
    return [row for row in reader]


def _parse_json(content: str) -> list[dict]:
    """Parse JSON content (expects array of objects or GeoJSON FeatureCollection)."""
    data = json.loads(content)

    # Handle GeoJSON FeatureCollection
    if isinstance(data, dict) and data.get("type") == "FeatureCollection":
        features = data.get("features", [])
        records = []
        for feature in features:
            record = feature.get("properties", {})
            record["geometry"] = feature.get("geometry")
            records.append(record)
        return records

    # Handle plain JSON array
    if isinstance(data, list):
        return data

    # Single object
    return [data]


def parse_file(content: str, filename: str) -> list[dict]:
    """Parse uploaded file content based on extension."""
    lower = filename.lower()
    if lower.endswith(".csv"):
        return _parse_csv(content)
    elif lower.endswith(".geojson"):
        return _parse_json(content)
    elif lower.endswith(".json"):
        return _parse_json(content)
    else:
        raise ValueError(f"Unsupported file format: {filename}")


# ---------------------------------------------------------------------------
# Upload and processing
# ---------------------------------------------------------------------------

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def upload_dataset(
    filename: str,
    content: bytes,
    source: str,
) -> dict:
    """
    Upload a dataset file. Saves to uploads/ dir and returns metadata.
    """
    # Validate source
    source_upper = source.upper()
    if source_upper not in ADAPTERS:
        raise ValueError(f"Unsupported source: {source}. Must be one of: {list(ADAPTERS.keys())}")

    # Create uploads directory
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Parse file to count records
    text_content = content.decode("utf-8")
    records = parse_file(text_content, filename)

    # Save file
    dataset_id = str(uuid.uuid4())[:8]
    safe_filename = f"{dataset_id}_{filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Track metadata
    _save_dataset_metadata(
        dataset_id=dataset_id,
        filename=filename,
        source=source_upper,
        record_count=len(records),
        filepath=filepath,
    )

    return {
        "dataset_id": dataset_id,
        "filename": filename,
        "source": source_upper,
        "record_count": len(records),
    }


def process_dataset(db: Session, dataset_id: str) -> dict:
    """
    Process an uploaded dataset:
    1. Read the file
    2. Normalize records using the source adapter
    3. Store as SourceRecords
    4. Create/update unified Properties
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")

    if dataset["status"] == "PROCESSED":
        raise ValueError(f"Dataset {dataset_id} has already been processed")

    # Read file
    filepath = dataset["filepath"]
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    raw_records = parse_file(content, dataset["filename"])
    adapter = ADAPTERS[dataset["source"]]
    source_enum = DataSource(dataset["source"])

    records_processed = 0
    records_normalized = 0
    records_failed = 0
    properties_created = 0
    properties_updated = 0

    for raw in raw_records:
        records_processed += 1
        try:
            # Step 1: Adapter normalization (source-specific field mapping)
            adapted = adapter.normalize(raw)

            # Step 2: Standard normalization (pincode, casing, coordinates)
            normalized = normalize_record(adapted)

            # Step 3: Create SourceRecord
            source_record = SourceRecord(
                source=source_enum,
                external_record_id=adapted.get("external_record_id"),
                village=normalized.get("village"),
                block=normalized.get("block"),
                district=normalized.get("district"),
                state=normalized.get("state"),
                pincode=normalized.get("pincode"),
                latitude=normalized.get("latitude"),
                longitude=normalized.get("longitude"),
                raw_data=raw,
                normalized_data=normalized,
            )

            # Step 4: Create/get unified Property
            prop = get_or_create_property(
                db=db,
                state=normalized.get("state"),
                district=normalized.get("district"),
                village=normalized.get("village"),
                block=normalized.get("block"),
                pincode=normalized.get("pincode"),
                latitude=normalized.get("latitude"),
                longitude=normalized.get("longitude"),
            )

            # Link source record to property
            source_record.property_uuid = prop.id
            db.add(source_record)
            db.commit()

            records_normalized += 1

        except Exception as e:
            records_failed += 1
            db.rollback()
            continue

    # Update dataset status
    _datasets[dataset_id]["status"] = "PROCESSED"

    return {
        "dataset_id": dataset_id,
        "records_processed": records_processed,
        "records_normalized": records_normalized,
        "records_failed": records_failed,
        "properties_created": properties_created,
        "properties_updated": properties_updated,
        "matches_found": 0,
    }
