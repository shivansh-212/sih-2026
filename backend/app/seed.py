"""
Seed data — creates development/demo users on startup.
Credentials come from environment variables, never hardcoded.
"""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole


def seed_users(db: Session) -> None:
    """
    Create seed admin and user accounts if they don't exist.
    Credentials are read from environment variables.
    """
    # Seed admin
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=settings.ADMIN_EMAIL,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            full_name="BHU-ID Admin",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        print(f"[+] Created admin user: {settings.ADMIN_EMAIL}")

    # Seed normal user
    user = db.query(User).filter(User.email == settings.USER_EMAIL).first()
    if not user:
        user = User(
            email=settings.USER_EMAIL,
            password_hash=hash_password(settings.USER_PASSWORD),
            full_name="BHU-ID User",
            role=UserRole.USER,
            is_active=True,
        )
        db.add(user)
        print(f"[+] Created normal user: {settings.USER_EMAIL}")

    db.commit()


def seed_properties(db: Session) -> None:
    """Seed initial sample properties matching SmartLens GIS mockups."""
    import json
    from decimal import Decimal
    from app.models.property import Property, PropertyStatus

    if db.query(Property).count() > 0:
        return

    sample_photos = json.dumps([
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80",
    ])

    demo_data = [
        {
            "property_id": "HSE-9F42A81C",
            "village": "Greenwood",
            "block": "Sector 4",
            "district": "Los Angeles / Prayagraj",
            "state": "Uttar Pradesh",
            "pincode": "212306",
            "latitude": Decimal("34.0522000"),
            "longitude": Decimal("-118.2437000"),
            "area_sq_m": Decimal("1250.00"),
            "confidence_score": Decimal("94.50"),
            "status": PropertyStatus.PENDING,
            "property_type": "Residential (Detached)",
            "build_material": "Brick / Masonry",
            "floors": 2,
            "roof_type": "Gable - Asphalt Shingle",
            "condition": "Good",
            "owner_name": "Johnathan Doe",
            "owner_phone": "+1 (555) 019-2834",
            "owner_email": "j.doe@example.com",
            "field_worker": "Sarah Jenkins",
            "verification_step": "UNDER_REVIEW",
            "site_photos": sample_photos,
        },
        {
            "property_id": "HS-902-A",
            "village": "Oakridge",
            "block": "Sector 2",
            "district": "Central",
            "state": "Uttar Pradesh",
            "pincode": "212301",
            "latitude": Decimal("40.7127753"),
            "longitude": Decimal("-74.0059728"),
            "area_sq_m": Decimal("1420.00"),
            "confidence_score": Decimal("91.00"),
            "status": PropertyStatus.PENDING,
            "property_type": "Residential (Semi-Detached)",
            "build_material": "Concrete Frame",
            "floors": 2,
            "roof_type": "Flat RCC",
            "condition": "Good",
            "owner_name": "Sarah Jenkins",
            "owner_phone": "+1 (555) 321-7788",
            "owner_email": "sarah.j@example.com",
            "field_worker": "Sarah Jenkins",
            "verification_step": "UNDER_REVIEW",
            "site_photos": sample_photos,
        },
        {
            "property_id": "HS-884-C",
            "village": "Riverside",
            "block": "Sector 1",
            "district": "North District",
            "state": "Uttar Pradesh",
            "pincode": "212302",
            "latitude": Decimal("40.7145000"),
            "longitude": Decimal("-74.0042000"),
            "area_sq_m": Decimal("980.00"),
            "confidence_score": Decimal("88.20"),
            "status": PropertyStatus.PENDING,
            "property_type": "Commercial Single Story",
            "build_material": "Steel Frame & Masonry",
            "floors": 1,
            "roof_type": "Metal Sheeting",
            "condition": "Fair",
            "owner_name": "David Chen",
            "owner_phone": "+1 (555) 443-9090",
            "owner_email": "d.chen@example.com",
            "field_worker": "David Chen",
            "verification_step": "UNDER_REVIEW",
            "site_photos": sample_photos,
        },
        {
            "property_id": "HS-712-B",
            "village": "West End",
            "block": "Sector 3",
            "district": "South District",
            "state": "Uttar Pradesh",
            "pincode": "212303",
            "latitude": Decimal("40.7110000"),
            "longitude": Decimal("-74.0090000"),
            "area_sq_m": Decimal("1100.00"),
            "confidence_score": Decimal("65.00"),
            "status": PropertyStatus.WARNING,
            "property_type": "Residential (Detached)",
            "build_material": "Brick / Masonry",
            "floors": 1,
            "roof_type": "Gable - Shingle",
            "condition": "Needs Repair",
            "owner_name": "Marcus Row",
            "owner_phone": "+1 (555) 789-0123",
            "owner_email": "m.row@example.com",
            "field_worker": "Marcus Row",
            "verification_step": "CORRECTION",
            "site_photos": sample_photos,
        },
        {
            "property_id": "HS-8821",
            "village": "Highland Park",
            "block": "Sector 4",
            "district": "East District",
            "state": "Uttar Pradesh",
            "pincode": "212304",
            "latitude": Decimal("45.5231000"),
            "longitude": Decimal("-122.6765000"),
            "area_sq_m": Decimal("1340.00"),
            "confidence_score": Decimal("98.50"),
            "status": PropertyStatus.VERIFIED,
            "property_type": "Residential (Villa)",
            "build_material": "Reinforced Concrete",
            "floors": 3,
            "roof_type": "Tile Roof",
            "condition": "Excellent",
            "owner_name": "John Doe",
            "owner_phone": "+1 (555) 901-2345",
            "owner_email": "john.doe@example.com",
            "field_worker": "Alex",
            "verification_step": "VERIFIED",
            "site_photos": sample_photos,
        },
        {
            "property_id": "HS-8819",
            "village": "Highland Park",
            "block": "Sector 4",
            "district": "East District",
            "state": "Uttar Pradesh",
            "pincode": "212304",
            "latitude": Decimal("45.5210000"),
            "longitude": Decimal("-122.6740000"),
            "area_sq_m": Decimal("1180.00"),
            "confidence_score": Decimal("92.00"),
            "status": PropertyStatus.PENDING,
            "property_type": "Residential (Detached)",
            "build_material": "Brick / Masonry",
            "floors": 2,
            "roof_type": "Asphalt Shingle",
            "condition": "Good",
            "owner_name": "Alice Smith",
            "owner_phone": "+1 (555) 234-5678",
            "owner_email": "alice.smith@example.com",
            "field_worker": "Alice Smith",
            "verification_step": "UNDER_REVIEW",
            "site_photos": sample_photos,
        },
        {
            "property_id": "LOC-8472-A",
            "village": "Lakshmipur",
            "block": "Koraon",
            "district": "Prayagraj",
            "state": "Uttar Pradesh",
            "pincode": "212306",
            "latitude": Decimal("25.4358000"),
            "longitude": Decimal("81.8463000"),
            "area_sq_m": Decimal("1500.00"),
            "confidence_score": Decimal("99.50"),
            "status": PropertyStatus.VERIFIED,
            "property_type": "Residential",
            "build_material": "Brick & Cement",
            "floors": 2,
            "roof_type": "RCC Slab",
            "condition": "Good",
            "owner_name": "Ramesh Chandra",
            "owner_phone": "+91 98765 43210",
            "owner_email": "ramesh.c@example.com",
            "field_worker": "Alex",
            "verification_step": "VERIFIED",
            "site_photos": sample_photos,
        },
        {
            "property_id": "LOC-8473-B",
            "village": "Lakshmipur",
            "block": "Koraon",
            "district": "Prayagraj",
            "state": "Uttar Pradesh",
            "pincode": "212306",
            "latitude": Decimal("25.4365000"),
            "longitude": Decimal("81.8472000"),
            "area_sq_m": Decimal("890.00"),
            "confidence_score": Decimal("85.00"),
            "status": PropertyStatus.PENDING,
            "property_type": "Residential",
            "build_material": "Brick Masonry",
            "floors": 1,
            "roof_type": "Tile / Tin",
            "condition": "Fair",
            "owner_name": "Sita Devi",
            "owner_phone": "+91 98765 43211",
            "owner_email": "sita.devi@example.com",
            "field_worker": "Alex",
            "verification_step": "UNDER_REVIEW",
            "site_photos": sample_photos,
        },
    ]

    for item in demo_data:
        prop = Property(**item)
        db.add(prop)

    db.commit()
    print(f"[+] Seeded {len(demo_data)} SmartLens demo properties.")

