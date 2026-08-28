"""
AI-assisted property matching service.

Deterministic feature-scoring system that compares source records
to determine if they refer to the same physical property.

Feature weights:
  - pincode_match:       15 points
  - block_match:         20 points
  - village_match:       25 points
  - location_proximity:  25 points
  - geometry_overlap:    10 points
  - attribute_similarity: 5 points

Classification thresholds:
  - 85-100: MATCHED
  - 60-84:  POSSIBLE
  - 0-59:   REJECTED

Future: Random Forest, XGBoost, or Logistic Regression.
Important: Do NOT use an LLM as the primary matching model.
"""

from decimal import Decimal
from itertools import combinations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.source_record import SourceRecord
from app.models.property_match import PropertyMatch, MatchStatus
from app.models.property import Property, PropertyStatus
from app.services.id_service import get_or_create_property
from app.utils.geo import haversine_distance


# ---------------------------------------------------------------------------
# Feature scoring
# ---------------------------------------------------------------------------

WEIGHTS = {
    "pincode_match": 15,
    "block_match": 20,
    "village_match": 25,
    "location_proximity": 25,
    "geometry_overlap": 10,
    "attribute_similarity": 5,
}

# Maximum total score
MAX_SCORE = sum(WEIGHTS.values())  # 100


def _score_pincode(a: SourceRecord, b: SourceRecord) -> float:
    """Score pincode match (exact match only)."""
    if not a.pincode or not b.pincode:
        return 0.0
    return WEIGHTS["pincode_match"] if a.pincode == b.pincode else 0.0


def _score_block(a: SourceRecord, b: SourceRecord) -> float:
    """Score block match (case-insensitive)."""
    if not a.block or not b.block:
        return 0.0
    return WEIGHTS["block_match"] if a.block.lower() == b.block.lower() else 0.0


def _score_village(a: SourceRecord, b: SourceRecord) -> float:
    """Score village match (case-insensitive)."""
    if not a.village or not b.village:
        return 0.0
    return WEIGHTS["village_match"] if a.village.lower() == b.village.lower() else 0.0


def _score_location_proximity(a: SourceRecord, b: SourceRecord) -> float:
    """
    Score geographic proximity using haversine distance.
    Full score for < 50m, linear decay to 0 at 5000m.
    """
    if a.latitude is None or a.longitude is None:
        return 0.0
    if b.latitude is None or b.longitude is None:
        return 0.0

    distance_m = haversine_distance(
        float(a.latitude), float(a.longitude),
        float(b.latitude), float(b.longitude),
    )

    if distance_m <= 50:
        return WEIGHTS["location_proximity"]
    elif distance_m >= 5000:
        return 0.0
    else:
        # Linear decay from 50m to 5000m
        ratio = 1.0 - (distance_m - 50) / (5000 - 50)
        return WEIGHTS["location_proximity"] * ratio


def _score_geometry_overlap(a: SourceRecord, b: SourceRecord) -> float:
    """
    Score geometry overlap.
    For MVP: if both have geometry, give partial credit.
    Full PostGIS intersection scoring is a future enhancement.
    """
    if a.geometry is not None and b.geometry is not None:
        return WEIGHTS["geometry_overlap"] * 0.5  # Partial credit for having geometry
    return 0.0


def _score_attribute_similarity(a: SourceRecord, b: SourceRecord) -> float:
    """
    Score attribute similarity by comparing normalized_data fields.
    Simple: check how many common non-null fields match.
    """
    if not a.normalized_data or not b.normalized_data:
        return 0.0

    common_keys = set(a.normalized_data.keys()) & set(b.normalized_data.keys())
    if not common_keys:
        return 0.0

    matches = sum(
        1 for k in common_keys
        if a.normalized_data.get(k) is not None
        and b.normalized_data.get(k) is not None
        and str(a.normalized_data[k]).lower() == str(b.normalized_data[k]).lower()
    )

    if not common_keys:
        return 0.0

    ratio = matches / len(common_keys)
    return WEIGHTS["attribute_similarity"] * ratio


def compute_match_score(a: SourceRecord, b: SourceRecord) -> tuple[float, dict]:
    """
    Compute the total match score between two source records.
    Returns (total_score, feature_breakdown).
    """
    features = {
        "pincode_match": _score_pincode(a, b),
        "block_match": _score_block(a, b),
        "village_match": _score_village(a, b),
        "location_proximity": round(_score_location_proximity(a, b), 2),
        "geometry_overlap": _score_geometry_overlap(a, b),
        "attribute_similarity": round(_score_attribute_similarity(a, b), 2),
    }

    total = sum(features.values())
    return round(total, 2), features


def classify_match(score: float) -> MatchStatus:
    """Classify a match score into MATCHED, POSSIBLE, or REJECTED."""
    if score >= 85:
        return MatchStatus.MATCHED
    elif score >= 60:
        return MatchStatus.POSSIBLE
    else:
        return MatchStatus.REJECTED


# ---------------------------------------------------------------------------
# Matching pipeline
# ---------------------------------------------------------------------------

MODEL_VERSION = "rule-based-v1"


def run_matching(db: Session) -> dict:
    """
    Run the full matching pipeline:
    1. Get all unmatched source records
    2. Compare pairs from different sources
    3. Score and classify each pair
    4. Create PropertyMatch records
    5. Create/update unified Properties for MATCHED pairs
    6. Update property status (CONFLICT for multiple conflicting matches)
    """
    # Get source records that haven't been matched yet
    all_records = db.query(SourceRecord).all()

    if len(all_records) < 2:
        return {
            "pairs_evaluated": 0,
            "matched": 0,
            "possible": 0,
            "rejected": 0,
            "properties_created": 0,
            "properties_updated": 0,
        }

    stats = {
        "pairs_evaluated": 0,
        "matched": 0,
        "possible": 0,
        "rejected": 0,
        "properties_created": 0,
        "properties_updated": 0,
    }

    # Compare pairs from different sources
    for record_a, record_b in combinations(all_records, 2):
        # Skip pairs from the same source
        if record_a.source == record_b.source:
            continue

        # Check if this pair has already been compared
        existing = (
            db.query(PropertyMatch)
            .filter(
                (
                    (PropertyMatch.source_record_a == record_a.id)
                    & (PropertyMatch.source_record_b == record_b.id)
                )
                | (
                    (PropertyMatch.source_record_a == record_b.id)
                    & (PropertyMatch.source_record_b == record_a.id)
                )
            )
            .first()
        )
        if existing:
            continue

        stats["pairs_evaluated"] += 1

        # Compute score
        score, features = compute_match_score(record_a, record_b)
        status = classify_match(score)

        if status == MatchStatus.MATCHED:
            stats["matched"] += 1
        elif status == MatchStatus.POSSIBLE:
            stats["possible"] += 1
        else:
            stats["rejected"] += 1

        # For MATCHED or POSSIBLE, link to a unified property
        property_obj = None
        if status in (MatchStatus.MATCHED, MatchStatus.POSSIBLE):
            # Use the first record's data as the canonical property
            property_obj = get_or_create_property(
                db=db,
                state=record_a.state,
                district=record_a.district,
                village=record_a.village,
                block=record_a.block,
                pincode=record_a.pincode,
                latitude=float(record_a.latitude) if record_a.latitude else None,
                longitude=float(record_a.longitude) if record_a.longitude else None,
                confidence_score=score,
            )

            # Link both source records to this property
            if record_a.property_uuid is None:
                record_a.property_uuid = property_obj.id
            if record_b.property_uuid is None:
                record_b.property_uuid = property_obj.id

            # Update property confidence and status
            if status == MatchStatus.MATCHED:
                property_obj.confidence_score = Decimal(str(score))
                property_obj.status = PropertyStatus.VERIFIED
            elif status == MatchStatus.POSSIBLE:
                property_obj.confidence_score = Decimal(str(score))
                property_obj.status = PropertyStatus.WARNING

            db.flush()

        # Create match record
        if property_obj is None:
            # For rejected matches, still need a property reference
            # Use record_a's property or create one
            if record_a.property_uuid:
                prop_id = record_a.property_uuid
            else:
                temp_prop = get_or_create_property(
                    db=db,
                    state=record_a.state,
                    district=record_a.district,
                    village=record_a.village,
                    block=record_a.block,
                    pincode=record_a.pincode,
                )
                prop_id = temp_prop.id
                record_a.property_uuid = prop_id
        else:
            prop_id = property_obj.id

        match = PropertyMatch(
            property_id=prop_id,
            source_record_a=record_a.id,
            source_record_b=record_b.id,
            confidence_score=Decimal(str(score)),
            match_status=status,
            matching_features=features,
            model_version=MODEL_VERSION,
        )
        db.add(match)

    db.commit()

    return stats
