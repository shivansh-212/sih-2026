Yes. Since you're using Antigravity to build the frontend around your existing Unique ID logic, I'd give it a single master JSON prompt plus separate visual-generation prompts.

I’d keep the UI light, Google Maps-inspired, map-first, and realistic for a 2-person beginner team.

{
  "project": {
    "name": "BHU-ID",
    "subtitle": "Unified Surface Property Identity Platform",
    "goal": "Build a lightweight surface-level property identity platform that combines property records from multiple datasets, reconciles records using AI-assisted matching, and assigns a persistent unique property ID.",
    "current_scope": [
      "Surface-level properties only",
      "Village/block/pincode based identification",
      "Google dataset integration",
      "SVAMITVA dataset integration",
      "e-Naksha dataset integration",
      "AI-assisted record matching",
      "Property confidence scoring",
      "Unique ID generation",
      "Interactive map visualization"
    ],
    "future_scope": [
      "Building-level identity",
      "Floor-level identity",
      "3D property volumes",
      "Underground infrastructure",
      "Air-rights",
      "Full 3D ULPIN"
    ]
  },

  "critical_instruction": {
    "preserve_existing_backend": true,
    "preserve_existing_unique_id_logic": true,
    "do_not_rewrite_id_algorithm": true,
    "do_not_fake_government_api_data": true,
    "frontend_must_consume_real_backend_data": true,
    "if_api_is_not_available_use_mock_adapter_without_changing_backend_contract": true,
    "do_not_build_unnecessary_microservices": true,
    "do_not_add_complex_3d_features_yet": true
  },

  "existing_unique_id_logic": {
    "description": "The backend already contains the logic responsible for generating the unique property identifier. The frontend must treat the generated ID as the authoritative identity.",
    "conceptual_pipeline": [
      "Input property records",
      "Normalize pincode",
      "Normalize block",
      "Normalize village",
      "Match records",
      "Generate persistent unique property ID"
    ],
    "example": {
      "property_id": "UP-PRY-004821",
      "pincode": "212306",
      "block": "Koraon",
      "village": "Lakshmipur"
    },
    "frontend_rule": "Never generate or modify property IDs in the frontend."
  },

  "design_direction": {
    "style": "Light, modern, clean geospatial SaaS",
    "visual_reference": [
      "Google Maps",
      "Google Earth",
      "ArcGIS modern interfaces",
      "Linear",
      "Stripe"
    ],
    "avoid": [
      "Dark dashboard",
      "Cyberpunk",
      "Neon",
      "Excessive gradients",
      "Gaming UI",
      "Too many cards",
      "Generic admin dashboard",
      "Excessive charts"
    ],
    "principle": "The map is the hero. UI elements should support spatial exploration rather than compete with the map."
  },

  "color_system": {
    "background": "#F8F9FA",
    "surface": "#FFFFFF",
    "primary": "#1A73E8",
    "primary_light": "#E8F0FE",
    "text": "#202124",
    "secondary_text": "#5F6368",
    "border": "#DADCE0",
    "verified": "#188038",
    "verified_background": "#E6F4EA",
    "warning": "#F9AB00",
    "warning_background": "#FEF7E0",
    "danger": "#D93025",
    "danger_background": "#FCE8E6"
  },

  "layout": {
    "type": "map_first",
    "map_width": "100%",
    "map_height": "full_available_area",
    "header": "floating",
    "sidebar": "collapsible",
    "property_panel": "floating_right",
    "controls": "floating",
    "desktop_priority": true,
    "mobile_support": "basic responsive"
  },

  "main_screen": {
    "description": "A light map-first property intelligence interface.",
    "components": [
      {
        "name": "top_navigation",
        "position": "top",
        "content": [
          "BHU-ID logo",
          "Search property, village or ULPIN",
          "Dataset status",
          "User/settings icon"
        ]
      },
      {
        "name": "map",
        "position": "center",
        "priority": "highest",
        "features": [
          "property polygons",
          "building footprints when available",
          "property markers",
          "selected-property highlight",
          "zoom",
          "pan",
          "fit-to-village",
          "layer controls"
        ]
      },
      {
        "name": "floating_left_panel",
        "position": "left",
        "content": [
          "Property count",
          "Verified percentage",
          "AI matched count",
          "Conflict count",
          "Layer toggles"
        ]
      },
      {
        "name": "property_detail_panel",
        "position": "right",
        "behavior": "hidden_until_property_selected",
        "content": [
          "Property ID",
          "Village",
          "Block",
          "Pincode",
          "Coordinates",
          "Area if available",
          "AI confidence",
          "Source records",
          "Data consistency",
          "View identity button"
        ]
      }
    ]
  },

  "map_behavior": {
    "default_style": "light",
    "property_visualization": {
      "normal": "light neutral polygon with subtle blue boundary",
      "selected": "blue boundary with light blue translucent fill",
      "verified": "green status indicator",
      "warning": "amber status indicator",
      "conflict": "red status indicator"
    },
    "interaction": [
      "Click property",
      "Open property panel",
      "Highlight selected polygon",
      "Show property ID",
      "Show confidence",
      "Show data sources"
    ]
  },

  "property_panel": {
    "example": {
      "title": "Property",
      "property_id": "UP-PRY-004821",
      "village": "Lakshmipur",
      "block": "Koraon",
      "pincode": "212306",
      "confidence": 96.8,
      "status": "Verified"
    },
    "sections": [
      "Identity",
      "Location",
      "AI Verification",
      "Source Records"
    ],
    "source_records": [
      {
        "source": "Google",
        "status": "matched"
      },
      {
        "source": "SVAMITVA",
        "status": "matched"
      },
      {
        "source": "e-Naksha",
        "status": "matched"
      }
    ]
  },

  "ai_feature": {
    "name": "AI Property Matching",
    "purpose": "Determine whether records from different datasets refer to the same physical property.",
    "do_not_claim": "AI generates official ULPIN",
    "actual_role": "AI assists with record reconciliation and confidence scoring.",
    "display": {
      "confidence_score": true,
      "confidence_bar": true,
      "matched_sources": true,
      "conflict_detection": true
    },
    "example": {
      "google_record": "Matched",
      "svamitva_record": "Matched",
      "enaksha_record": "Matched",
      "confidence": 96.8
    }
  },

  "identity_view": {
    "name": "Property Identity Resolution",
    "purpose": "Visually explain how multiple source records are unified into one property identity.",
    "layout": {
      "left": "Google record",
      "center": "AI matching engine",
      "right_top": "SVAMITVA record",
      "right_bottom": "e-Naksha record",
      "bottom": "Unified property identity"
    },
    "visual_story": "3 source records -> AI-assisted matching -> 1 unified property",
    "result": {
      "property_id": "UP-PRY-004821",
      "confidence": "96.8%"
    }
  },

  "conflict_view": {
    "name": "AI Data Audit",
    "purpose": "Show properties where source datasets disagree.",
    "example": {
      "property_id": "UP-PRY-004821",
      "confidence": 42,
      "issue": "Location mismatch between SVAMITVA and e-Naksha",
      "distance_difference": "487m",
      "recommended_action": "Manual verification"
    },
    "actions": [
      "View on map",
      "Inspect source records",
      "Mark for review"
    ]
  },

  "search": {
    "placeholder": "Search property, village, block, pincode or Property ID",
    "searchable_fields": [
      "property_id",
      "village",
      "block",
      "pincode"
    ],
    "behavior": [
      "show suggestions",
      "select result",
      "zoom map",
      "highlight property",
      "open property panel"
    ]
  },

  "dashboard_metrics": {
    "show": [
      "Total Properties",
      "Matched Properties",
      "Average AI Confidence",
      "Data Conflicts"
    ],
    "avoid": [
      "unnecessary pie charts",
      "decorative graphs",
      "fake statistics"
    ]
  },

  "frontend_technical_requirements": {
    "preferred_stack": [
      "React",
      "Vite",
      "Tailwind CSS",
      "MapLibre GL JS"
    ],
    "backend": "Existing FastAPI backend",
    "api_integration": "Use existing API endpoints and schemas whenever available.",
    "state_management": "Keep simple. React state/context is sufficient unless existing project already uses another solution.",
    "components": [
      "Map",
      "SearchBar",
      "PropertyPanel",
      "LayerControl",
      "MetricPanel",
      "IdentityResolution",
      "ConflictPanel"
    ]
  },

  "api_contract_concept": {
    "property": {
      "property_id": "string",
      "village": "string",
      "block": "string",
      "pincode": "string",
      "latitude": "number",
      "longitude": "number",
      "geometry": "GeoJSON",
      "confidence": "number",
      "status": "verified|warning|conflict",
      "sources": "array"
    }
  },

  "important_ux_rules": [
    "Do not overload the screen.",
    "Keep the map visible at all times.",
    "Use floating panels instead of permanent heavy sidebars.",
    "Use whitespace generously.",
    "Use subtle shadows.",
    "Use rounded corners.",
    "Use animations only for meaningful state changes.",
    "Every property interaction should reveal the unique identity.",
    "Never hide the Property ID after selection.",
    "Do not fabricate data when backend data is unavailable."
  ],

  "demo_flow": [
    "Open BHU-ID",
    "Map loads with properties",
    "Search for a village",
    "Map zooms to village",
    "Select a property",
    "Property panel opens",
    "Show unique property ID",
    "Show AI confidence",
    "Show matched source datasets",
    "Open Identity Resolution",
    "Show 3 sources converging into one property",
    "Open AI Audit",
    "Show one mismatched property",
    "Return to map"
  ],

  "visual_generation_prompts": [
    {
      "name": "main_map_interface",
      "prompt": "Design a premium light geospatial property intelligence web application called BHU-ID. Google Maps-inspired but original. Large clean map occupying most of the interface, white floating top search bar, minimal floating left property statistics panel, subtle blue parcel boundaries, small green verified indicators, amber warning indicators, red conflict indicators, white floating property detail card on the right, soft shadows, rounded 12px corners, clean typography, spacious layout, professional Indian government technology product aesthetic, modern SaaS quality, no dark mode, no neon, no cyberpunk, no excessive charts, map-first composition, highly realistic UI/UX mockup."
    },
    {
      "name": "property_detail",
      "prompt": "Create a polished light-mode geospatial property detail interface for BHU-ID. A selected land parcel is highlighted on a clean map while a floating white property card displays Property ID, village, block, pincode, coordinates, AI confidence percentage, verification status, and source dataset badges for Google, SVAMITVA and e-Naksha. Google Maps-inspired visual language, white surfaces, subtle borders, soft shadows, blue primary accent, green verification indicators, minimal professional typography, realistic production SaaS interface."
    },
    {
      "name": "identity_resolution",
      "prompt": "Create a premium light-mode UI visualization for a geospatial property identity resolution system. Three source records labeled Google, SVAMITVA and e-Naksha visually converge into one unified property identity through an AI-assisted matching engine. Show confidence percentages, subtle connecting lines, clean white cards, blue primary accent, green successful matches, one unified Property ID at the bottom. Modern Google Maps and enterprise GIS aesthetic, minimal, elegant, spacious, highly understandable, no futuristic neon."
    },
    {
      "name": "ai_audit",
      "prompt": "Create a light-mode AI geospatial data audit interface for BHU-ID. Show a clean map with one property highlighted in amber/red and a floating panel explaining a data mismatch between SVAMITVA and e-Naksha. Display AI confidence 42%, distance discrepancy, source coordinates, and a clear manual verification action. Professional GIS software aesthetic, Google Maps-inspired, white cards, subtle shadows, clean typography, restrained colors, realistic production dashboard."
    },
    {
      "name": "future_3d_teaser",
      "prompt": "Create a clean light-mode conceptual visualization showing the future evolution of BHU-ID from a surface land parcel into a vertically structured property identity. Start with a 2D parcel on a map and subtly transition into a building with floors and underground infrastructure. Keep the current product clearly surface-first while visually suggesting future 3D ULPIN capabilities. White background, Google Maps-inspired GIS aesthetic, blue and neutral colors, professional government technology presentation, minimal and realistic, not science fiction."
    }
  ],

  "final_instruction_to_antigravity": "First inspect the existing repository, backend APIs, database models, property ID generation logic, and current frontend. Do not replace working backend logic. Build the frontend around the existing data contracts. If an endpoint or dataset is unavailable, create a clearly isolated mock adapter with the same interface and mark it as mock data. Prioritize a polished map-first demo over feature quantity. The final product must convincingly demonstrate: multiple property data sources -> AI-assisted reconciliation -> confidence score -> persistent unique property ID -> interactive surface property map."
}
One change I'd make to the name

Instead of putting "ULPIN" everywhere in the UI right now, I'd use something like:

BHU-ID
Unified Property Identity

Then underneath:

ULPIN-ready spatial identity layer

That avoids claiming that your prototype-generated ID is already an officially issued ULPIN.

For the demo, the strongest visual sequence is:

Map → click parcel → Property ID → AI confidence → 3 source records → unified identity.

That is the story I'd make Antigravity optimize around.

now write the prompt for backend with postgresql as database and also add authentication token jwt based and create admin and user distinguise 

Yes. Since your frontend will consume this backend, I’d make the backend simple and production-structured without overengineering it. The important part is that your existing Unique ID logic remains untouched and the database becomes the source of truth.

{
  "project": {
    "name": "BHU-ID Backend",
    "purpose": "Backend API for a surface-level unified property identity platform that combines property records from multiple datasets, performs AI-assisted property matching, stores unified property records, and exposes them to a map-first frontend.",
    "current_scope": [
      "Surface-level property records",
      "Google dataset ingestion",
      "SVAMITVA dataset ingestion",
      "e-Naksha dataset ingestion",
      "Property record normalization",
      "AI-assisted property matching",
      "Unique Property ID generation",
      "PostgreSQL persistence",
      "JWT authentication",
      "Admin/User role separation",
      "Property search",
      "Property map data",
      "AI confidence and conflict reporting"
    ],
    "future_scope": [
      "3D property volumes",
      "Building-level identity",
      "Floor-level identity",
      "Underground infrastructure",
      "Air-rights",
      "Full 3D ULPIN"
    ]
  },

  "critical_rules": {
    "do_not_rewrite_existing_unique_id_logic": true,
    "unique_property_id_is_authoritative": true,
    "frontend_must_never_generate_property_ids": true,
    "do_not_store_plaintext_passwords": true,
    "do_not_store_jwt_tokens_in_database_unnecessarily": true,
    "do_not_hardcode_secret_keys": true,
    "do_not_fake_external_government_api_integrations": true,
    "do_not_create_microservices": true,
    "do_not_overengineer": true,
    "keep_backend_easy_for_two_beginner_developers_to_understand": true
  },

  "technology_stack": {
    "language": "Python 3.12+",
    "framework": "FastAPI",
    "database": "PostgreSQL",
    "orm": "SQLAlchemy 2.x",
    "migrations": "Alembic",
    "validation": "Pydantic v2",
    "authentication": "JWT",
    "password_hashing": "Argon2id or bcrypt",
    "geospatial": "PostGIS",
    "database_driver": "psycopg",
    "testing": "pytest",
    "configuration": "pydantic-settings",
    "containerization": "Docker Compose"
  },

  "architecture": {
    "style": "modular monolith",
    "principle": "Keep everything inside one FastAPI application with clearly separated modules.",
    "structure": {
      "app": {
        "main.py": "FastAPI application entry point",
        "core": {
          "config.py": "Environment configuration",
          "security.py": "Password hashing and JWT utilities",
          "database.py": "PostgreSQL connection and session management"
        },
        "models": {
          "user.py": "User database model",
          "property.py": "Unified property model",
          "source_record.py": "External source record model",
          "property_match.py": "AI matching result model",
          "audit.py": "Administrative audit log"
        },
        "schemas": {
          "auth.py": "Authentication request/response schemas",
          "user.py": "User schemas",
          "property.py": "Property schemas",
          "source.py": "Source record schemas",
          "match.py": "AI matching schemas"
        },
        "api": {
          "auth.py": "Authentication endpoints",
          "users.py": "User endpoints",
          "properties.py": "Property endpoints",
          "datasets.py": "Dataset ingestion endpoints",
          "matching.py": "AI matching endpoints",
          "admin.py": "Admin-only endpoints"
        },
        "services": {
          "auth_service.py": "Authentication logic",
          "property_service.py": "Property business logic",
          "matching_service.py": "AI-assisted matching",
          "id_service.py": "Existing unique ID logic",
          "dataset_service.py": "Dataset ingestion and normalization"
        },
        "utils": {
          "normalization.py": "Village/block/pincode normalization",
          "geo.py": "Spatial utilities"
        }
      },
      "tests": {},
      "alembic": {},
      "docker-compose.yml": "PostgreSQL/PostGIS development environment",
      ".env.example": "Environment variable template"
    }
  },

  "database": {
    "engine": "PostgreSQL with PostGIS",
    "extensions": [
      "postgis"
    ],
    "tables": {
      "users": {
        "id": "UUID primary key",
        "email": "unique, indexed",
        "password_hash": "string",
        "full_name": "string",
        "role": "enum(USER, ADMIN)",
        "is_active": "boolean",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      },

      "properties": {
        "id": "UUID primary key",
        "property_id": "string unique indexed",
        "village": "string indexed",
        "block": "string indexed",
        "district": "string indexed",
        "state": "string indexed",
        "pincode": "string indexed",
        "latitude": "decimal",
        "longitude": "decimal",
        "geometry": "PostGIS geometry",
        "area_sq_m": "decimal nullable",
        "confidence_score": "decimal nullable",
        "status": "enum(VERIFIED, WARNING, CONFLICT, PENDING)",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      },

      "source_records": {
        "id": "UUID primary key",
        "property_uuid": "foreign key to properties.id nullable",
        "source": "enum(GOOGLE, SVAMITVA, E_NAKSHA)",
        "external_record_id": "string nullable",
        "village": "string nullable",
        "block": "string nullable",
        "pincode": "string nullable",
        "latitude": "decimal nullable",
        "longitude": "decimal nullable",
        "geometry": "PostGIS geometry nullable",
        "raw_data": "JSONB",
        "normalized_data": "JSONB",
        "created_at": "timestamp"
      },

      "property_matches": {
        "id": "UUID primary key",
        "property_id": "foreign key to properties.id",
        "source_record_a": "foreign key to source_records.id",
        "source_record_b": "foreign key to source_records.id",
        "confidence_score": "decimal",
        "match_status": "enum(MATCHED, POSSIBLE, REJECTED)",
        "matching_features": "JSONB",
        "model_version": "string nullable",
        "created_at": "timestamp"
      },

      "audit_logs": {
        "id": "UUID primary key",
        "user_id": "foreign key to users.id",
        "action": "string",
        "resource_type": "string",
        "resource_id": "string nullable",
        "details": "JSONB nullable",
        "created_at": "timestamp"
      }
    }
  },

  "authentication": {
    "method": "JWT Bearer authentication",
    "token_type": "access_token",
    "algorithm": "HS256",
    "access_token_expiration_minutes": 30,
    "password_hashing": "Argon2id preferred; bcrypt acceptable if Argon2 is inconvenient",
    "secret_source": "environment variable JWT_SECRET_KEY",
    "required_headers": {
      "Authorization": "Bearer <JWT>"
    },
    "security_rules": [
      "Never return password hashes.",
      "Never log passwords.",
      "Never put passwords in URLs.",
      "Never hardcode JWT secret.",
      "Validate token signature and expiration.",
      "Reject inactive users.",
      "Use dependency-based authentication in FastAPI.",
      "Use role-based authorization dependencies."
    ]
  },

  "roles": {
    "USER": {
      "permissions": [
        "login",
        "view_properties",
        "search_properties",
        "view_property_details",
        "view_map_data",
        "view_ai_confidence",
        "view_data_conflicts"
      ],
      "cannot": [
        "create_users",
        "delete_users",
        "upload_datasets",
        "delete_properties",
        "modify_property_identity",
        "change_roles"
      ]
    },
    "ADMIN": {
      "permissions": [
        "all_user_permissions",
        "upload_datasets",
        "process_datasets",
        "trigger_matching",
        "create_users",
        "disable_users",
        "change_user_roles",
        "view_audit_logs",
        "modify_property_status",
        "review_conflicts"
      ]
    }
  },

  "authentication_endpoints": {
    "POST /api/v1/auth/register": {
      "access": "public",
      "purpose": "Register a normal user.",
      "default_role": "USER"
    },
    "POST /api/v1/auth/login": {
      "access": "public",
      "purpose": "Authenticate user and return JWT access token."
    },
    "GET /api/v1/auth/me": {
      "access": "authenticated",
      "purpose": "Return current user's profile and role."
    }
  },

  "user_endpoints": {
    "GET /api/v1/users/me": {
      "access": "authenticated",
      "purpose": "Get current user."
    },
    "GET /api/v1/admin/users": {
      "access": "ADMIN",
      "purpose": "List users."
    },
    "POST /api/v1/admin/users": {
      "access": "ADMIN",
      "purpose": "Create a user."
    },
    "PATCH /api/v1/admin/users/{user_id}/role": {
      "access": "ADMIN",
      "purpose": "Change user role."
    },
    "PATCH /api/v1/admin/users/{user_id}/status": {
      "access": "ADMIN",
      "purpose": "Enable or disable user."
    }
  },

  "property_endpoints": {
    "GET /api/v1/properties": {
      "access": "authenticated",
      "purpose": "Return paginated properties."
    },
    "GET /api/v1/properties/{property_id}": {
      "access": "authenticated",
      "purpose": "Return complete property details."
    },
    "GET /api/v1/properties/{property_id}/sources": {
      "access": "authenticated",
      "purpose": "Return source records used to create the unified property."
    },
    "GET /api/v1/properties/{property_id}/matches": {
      "access": "authenticated",
      "purpose": "Return AI matching results."
    },
    "GET /api/v1/properties/search": {
      "access": "authenticated",
      "query_parameters": [
        "property_id",
        "village",
        "block",
        "district",
        "pincode",
        "status"
      ],
      "purpose": "Search properties."
    },
    "GET /api/v1/properties/map": {
      "access": "authenticated",
      "purpose": "Return GeoJSON FeatureCollection for map rendering."
    },
    "GET /api/v1/properties/stats": {
      "access": "authenticated",
      "purpose": "Return dashboard metrics."
    }
  },

  "map_api": {
    "endpoint": "GET /api/v1/properties/map",
    "response": {
      "type": "GeoJSON FeatureCollection",
      "feature_properties": [
        "property_id",
        "village",
        "block",
        "pincode",
        "confidence_score",
        "status"
      ]
    },
    "requirements": [
      "Support bounding-box filtering.",
      "Do not return unnecessary raw source data.",
      "Support pagination or viewport-based querying for scalability.",
      "Return valid GeoJSON.",
      "Never expose private user information."
    ]
  },

  "dataset_ingestion": {
    "supported_sources": [
      "GOOGLE",
      "SVAMITVA",
      "E_NAKSHA"
    ],
    "architecture": "adapter-based",
    "principle": "Each data source should have an adapter that converts source-specific records into the same normalized internal schema.",
    "normalized_schema": {
      "source": "string",
      "external_record_id": "string",
      "state": "string",
      "district": "string",
      "block": "string",
      "village": "string",
      "pincode": "string",
      "latitude": "number",
      "longitude": "number",
      "geometry": "GeoJSON or WKT",
      "attributes": "JSON"
    },
    "initial_mode": "CSV/JSON/GeoJSON upload",
    "future_mode": [
      "official government APIs",
      "WMS/WFS",
      "SFTP",
      "official GIS services"
    ]
  },

  "dataset_endpoints": {
    "POST /api/v1/admin/datasets/upload": {
      "access": "ADMIN",
      "purpose": "Upload CSV, JSON or GeoJSON dataset."
    },
    "POST /api/v1/admin/datasets/{dataset_id}/process": {
      "access": "ADMIN",
      "purpose": "Normalize and validate uploaded records."
    },
    "GET /api/v1/admin/datasets": {
      "access": "ADMIN",
      "purpose": "List uploaded datasets and processing status."
    }
  },

  "normalization": {
    "pincode": [
      "trim whitespace",
      "validate six-digit format",
      "store as string rather than integer"
    ],
    "village": [
      "trim whitespace",
      "normalize casing",
      "normalize repeated whitespace",
      "preserve original value"
    ],
    "block": [
      "trim whitespace",
      "normalize casing",
      "preserve original value"
    ],
    "coordinates": [
      "validate latitude range",
      "validate longitude range",
      "store spatial data using PostGIS"
    ]
  },

  "ai_matching": {
    "purpose": "Determine whether records from different datasets refer to the same physical property.",
    "initial_implementation": "Start with a deterministic feature scoring system and keep the service interface model-ready.",
    "features": [
      "pincode_match",
      "block_match",
      "village_match",
      "geographic_distance",
      "building_or_polygon_overlap",
      "attribute_similarity"
    ],
    "example_score": {
      "pincode_match": 15,
      "block_match": 20,
      "village_match": 25,
      "location_proximity": 25,
      "geometry_overlap": 10,
      "attribute_similarity": 5
    },
    "classification": {
      "85-100": "MATCHED",
      "60-84": "POSSIBLE",
      "0-59": "REJECTED"
    },
    "future_model": "Random Forest, XGBoost or Logistic Regression",
    "important": "Do not use an LLM as the primary property matching model."
  },

  "unique_id_service": {
    "name": "Property Identity Engine",
    "rule": "Use the existing unique ID implementation if already present.",
    "responsibility": [
      "Generate persistent property identity",
      "Guarantee uniqueness",
      "Prevent accidental duplicate IDs",
      "Return existing ID when the same canonical property is processed again"
    ],
    "database_constraint": "UNIQUE(property_id)",
    "frontend_rule": "Frontend never generates property IDs."
  },

  "admin_workflow": {
    "steps": [
      "Admin logs in",
      "Admin uploads dataset",
      "Backend validates file",
      "Backend stores dataset metadata",
      "Backend normalizes records",
      "Backend performs matching",
      "Backend creates or updates unified properties",
      "Backend generates unique IDs",
      "Backend stores confidence scores",
      "Backend marks conflicts",
      "Admin reviews conflicts",
      "Frontend displays processed properties"
    ]
  },

  "audit_logging": {
    "log_actions": [
      "LOGIN",
      "DATASET_UPLOAD",
      "DATASET_PROCESS",
      "PROPERTY_CREATE",
      "PROPERTY_UPDATE",
      "PROPERTY_STATUS_CHANGE",
      "USER_CREATE",
      "USER_ROLE_CHANGE",
      "USER_DISABLE"
    ],
    "rule": "Do not log passwords, JWT secrets, or sensitive authentication credentials."
  },

  "environment_variables": {
    "DATABASE_URL": "postgresql+psycopg://user:password@localhost:5432/bhu_id",
    "JWT_SECRET_KEY": "change-me-in-production",
    "JWT_ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "CORS_ORIGINS": "http://localhost:5173"
  },

  "docker": {
    "services": [
      {
        "name": "postgres",
        "image": "postgis/postgis",
        "purpose": "PostgreSQL with PostGIS"
      },
      {
        "name": "backend",
        "purpose": "FastAPI application"
      }
    ],
    "requirements": [
      "Persistent PostgreSQL volume",
      "Environment-based credentials",
      "Health check",
      "Automatic database connection retry"
    ]
  },

  "api_quality": {
    "requirements": [
      "Use /api/v1 prefix.",
      "Use Pydantic response schemas.",
      "Return consistent HTTP status codes.",
      "Return structured error responses.",
      "Use pagination for list endpoints.",
      "Validate all user input.",
      "Use dependency injection for database sessions.",
      "Use dependency injection for authenticated users.",
      "Use dependency injection for admin authorization.",
      "Generate OpenAPI documentation automatically."
    ]
  },

  "error_response": {
    "format": {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable message"
      }
    }
  },

  "seed_data": {
    "create": [
      {
        "email": "admin@bhu-id.local",
        "role": "ADMIN",
        "purpose": "Development/demo administrator"
      },
      {
        "email": "user@bhu-id.local",
        "role": "USER",
        "purpose": "Development/demo normal user"
      }
    ],
    "security_rule": "Never commit real passwords. Seed credentials must come from environment variables."
  },

  "testing": {
    "minimum_tests": [
      "User registration",
      "Login",
      "JWT validation",
      "Invalid token rejection",
      "Admin-only endpoint rejection for normal user",
      "Property creation",
      "Property retrieval",
      "Property search",
      "Map GeoJSON endpoint",
      "Unique property ID uniqueness",
      "Dataset normalization",
      "Matching confidence calculation"
    ]
  },

  "implementation_order": [
    "Inspect existing backend and preserve existing unique ID logic.",
    "Create PostgreSQL/PostGIS connection.",
    "Create SQLAlchemy models.",
    "Create Alembic migrations.",
    "Implement user authentication.",
    "Implement JWT authentication.",
    "Implement USER and ADMIN roles.",
    "Implement property CRUD/read APIs.",
    "Implement map GeoJSON endpoint.",
    "Implement dataset upload.",
    "Implement normalization.",
    "Connect existing unique ID logic.",
    "Implement AI-assisted matching service.",
    "Implement confidence and conflict storage.",
    "Implement admin dataset processing workflow.",
    "Add audit logging.",
    "Add tests.",
    "Connect frontend.",
    "Run complete demo workflow."
  ],

  "final_acceptance_criteria": [
    "Application starts successfully with Docker Compose.",
    "PostgreSQL/PostGIS connection works.",
    "Alembic migrations work.",
    "A user can register and log in.",
    "Login returns a JWT.",
    "Protected endpoints reject unauthenticated requests.",
    "Normal users cannot access admin endpoints.",
    "Admins can upload and process datasets.",
    "Property records are stored in PostgreSQL.",
    "Existing unique ID logic is preserved.",
    "Each unified property has a unique persistent property ID.",
    "AI-assisted matching produces a confidence score.",
    "Conflicts are stored and retrievable.",
    "Map endpoint returns valid GeoJSON.",
    "Frontend can search and display properties.",
    "Frontend can display property ID, sources, confidence and status.",
    "No secrets are hardcoded.",
    "No passwords are stored in plaintext.",
    "The implementation remains simple enough for two beginner developers to maintain."
  ],

  "antigravity_instruction": "First inspect the repository before changing anything. Identify the existing backend structure, existing API endpoints, database logic, authentication if present, and especially the existing unique ID generation code. Preserve working logic. Implement the backend incrementally rather than replacing the project. After each major stage, run the application and tests. Keep the architecture as a modular monolith. Prioritize a working demo over unnecessary production infrastructure."
}
right requirement every reequirement file with skills and rules md file 
Analyzed

Yes. I separated the backend specification into the three files you actually want:

requirements.md — complete functional/technical requirements
skills.md — skills Antigravity should use/understand
rules.md — strict development and AI-agent rules

Put all three in your backend project root and tell Antigravity to read these files before making any changes.

The rules.md is especially important because it prevents it from:

rewriting your existing Unique ID logic
inventing SVAMITVA/e-Naksha APIs
putting authentication only on the frontend
overengineering with microservices
treating AI as legal ownership verification
generating fake government data
making the project too complex for two beginners. 
requirements.md
Document
skills.md
Document
rules.md
Document