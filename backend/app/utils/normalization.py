"""
Village/block/pincode normalization utilities.
Preserves original values while producing clean normalized versions.
"""

import re


def normalize_pincode(value: str | None) -> str | None:
    """
    Normalize a pincode:
    - Trim whitespace
    - Validate six-digit format
    - Store as string (not integer)
    Returns None if invalid.
    """
    if value is None:
        return None

    cleaned = value.strip()
    if re.match(r"^\d{6}$", cleaned):
        return cleaned
    return None


def normalize_village(value: str | None) -> str | None:
    """
    Normalize a village name:
    - Trim whitespace
    - Normalize casing to title case
    - Collapse repeated whitespace
    """
    if value is None:
        return None

    cleaned = value.strip()
    if not cleaned:
        return None

    # Collapse multiple spaces into one
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.title()


def normalize_block(value: str | None) -> str | None:
    """
    Normalize a block name:
    - Trim whitespace
    - Normalize casing to title case
    """
    if value is None:
        return None

    cleaned = value.strip()
    if not cleaned:
        return None

    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.title()


def normalize_district(value: str | None) -> str | None:
    """
    Normalize a district name:
    - Trim whitespace
    - Normalize casing to title case
    """
    if value is None:
        return None

    cleaned = value.strip()
    if not cleaned:
        return None

    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.title()


def normalize_state(value: str | None) -> str | None:
    """
    Normalize a state name:
    - Trim whitespace
    - Normalize casing to title case
    """
    if value is None:
        return None

    cleaned = value.strip()
    if not cleaned:
        return None

    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.title()


def validate_latitude(value: float | None) -> float | None:
    """
    Validate latitude is within valid range (-90 to 90).
    Returns None if invalid.
    """
    if value is None:
        return None
    try:
        lat = float(value)
        if -90.0 <= lat <= 90.0:
            return lat
    except (ValueError, TypeError):
        pass
    return None


def validate_longitude(value: float | None) -> float | None:
    """
    Validate longitude is within valid range (-180 to 180).
    Returns None if invalid.
    """
    if value is None:
        return None
    try:
        lng = float(value)
        if -180.0 <= lng <= 180.0:
            return lng
    except (ValueError, TypeError):
        pass
    return None


def normalize_record(record: dict) -> dict:
    """
    Apply all normalization rules to a raw record dict.
    Returns a new dict with normalized values.
    """
    return {
        "village": normalize_village(record.get("village")),
        "block": normalize_block(record.get("block")),
        "district": normalize_district(record.get("district")),
        "state": normalize_state(record.get("state")),
        "pincode": normalize_pincode(record.get("pincode")),
        "latitude": validate_latitude(record.get("latitude")),
        "longitude": validate_longitude(record.get("longitude")),
    }
