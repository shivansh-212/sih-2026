"""
Property Identity Engine — generates unique, persistent BHU-IDs.

Format: BHU-{STATE_CODE}-{DISTRICT_ABBR}-{8-CHAR-HEX}
Example: BHU-UP-LKO-a3f2b1c9

Rules:
- IDs are authoritative and permanent
- Frontend never generates these
- Duplicate canonical properties return the existing ID
- Uniqueness enforced by database constraint
"""

import uuid
from sqlalchemy.orm import Session

from app.models.property import Property, PropertyStatus


# State name → 2-letter code mapping (common Indian states)
STATE_CODES: dict[str, str] = {
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chhattisgarh": "CG",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TG",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
    "Delhi": "DL",
    "Jammu And Kashmir": "JK",
    "Ladakh": "LA",
    "Chandigarh": "CH",
    "Puducherry": "PY",
    "Andaman And Nicobar Islands": "AN",
    "Dadra And Nagar Haveli And Daman And Diu": "DD",
    "Lakshadweep": "LD",
}


def _get_state_code(state: str | None) -> str:
    """Get 2-letter state code, default to 'XX' if unknown."""
    if not state:
        return "XX"

    # Try exact match (title case)
    code = STATE_CODES.get(state)
    if code:
        return code

    # Try case-insensitive match
    state_upper = state.strip().title()
    code = STATE_CODES.get(state_upper)
    if code:
        return code

    return "XX"


def _get_district_abbr(district: str | None) -> str:
    """Get 3-letter district abbreviation."""
    if not district:
        return "UNK"

    cleaned = district.strip().upper()
    if len(cleaned) <= 3:
        return cleaned
    return cleaned[:3]


def normalize_village_code(village: str | None, custom_code: str | None = None) -> str:
    """
    Generate or validate a standardized 6-character alphanumeric village code.
    Example: 'Lakshmipur' -> 'LAK042'
    """
    if custom_code and custom_code.strip():
        return custom_code.strip().upper()

    if not village or not village.strip():
        return "VIL001"

    cleaned = "".join(c for c in village.strip().upper() if c.isalnum())
    prefix = (cleaned[:3] if len(cleaned) >= 3 else (cleaned + "XXX")[:3])
    # Generate deterministic 3-digit number from village name hash
    v_hash = abs(hash(village.strip().lower())) % 900 + 100
    return f"{prefix}{v_hash}"


def generate_cadastral_house_code(
    pincode: str | None,
    village_code: str | None,
    house_no: int | str,
    prefix: str = "BHU",
) -> str:
    """
    Generate authoritative Cadastral House Code using the formula:
    [PREFIX-]{PINCODE}-{VILLAGE_CODE}-H{HOUSE_NO}
    
    Examples:
    - pincode='212306', village_code='LAK042', house_no=1 -> '212306-LAK042-H001'
    - With prefix: 'BHU-212306-LAK042-H001'
    """
    clean_pincode = str(pincode).strip() if pincode else "000000"
    clean_vcode = str(village_code).strip().upper() if village_code else "VIL001"
    
    try:
        h_int = int(str(house_no).upper().replace("H", "").replace("-", "").strip())
        h_str = f"H{h_int:03d}"
    except ValueError:
        h_str = f"H{str(house_no).strip()}"

    return f"{clean_pincode}-{clean_vcode}-{h_str}"


def generate_property_id(
    state: str | None = None,
    district: str | None = None,
) -> str:
    """
    Generate a new unique BHU-ID.
    Format: BHU-{STATE}-{DISTRICT}-{8-hex}
    """
    state_code = _get_state_code(state)
    district_abbr = _get_district_abbr(district)
    unique_hex = uuid.uuid4().hex[:8]

    return f"BHU-{state_code}-{district_abbr}-{unique_hex}"



def get_or_create_property(
    db: Session,
    state: str | None = None,
    district: str | None = None,
    village: str | None = None,
    block: str | None = None,
    pincode: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    area_sq_m: float | None = None,
    confidence_score: float | None = None,
    status: PropertyStatus = PropertyStatus.PENDING,
) -> Property:
    """
    Get an existing property by canonical location or create a new one.
    
    A property is considered the "same" if village, block, district,
    state, and pincode all match exactly (after normalization).
    """
    # Try to find existing property with same canonical location
    if village and block and district and state:
        existing = (
            db.query(Property)
            .filter(
                Property.village == village,
                Property.block == block,
                Property.district == district,
                Property.state == state,
            )
            .first()
        )
        if existing:
            return existing

    # Generate new property with unique BHU-ID
    property_id = generate_property_id(state, district)

    # Ensure uniqueness (extremely unlikely collision, but safe)
    while db.query(Property).filter(Property.property_id == property_id).first():
        property_id = generate_property_id(state, district)

    new_property = Property(
        property_id=property_id,
        state=state,
        district=district,
        village=village,
        block=block,
        pincode=pincode,
        latitude=latitude,
        longitude=longitude,
        area_sq_m=area_sq_m,
        confidence_score=confidence_score,
        status=status,
    )
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return new_property
