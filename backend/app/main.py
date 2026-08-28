"""
BHU-ID Backend — FastAPI Application Entry Point

A unified property identity platform that combines property records
from multiple datasets, performs AI-assisted matching, and exposes
them to a map-first frontend.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup/shutdown lifecycle.
    - On startup: create tables (if not using Alembic) and seed users.
    - On shutdown: cleanup.
    """
    # Import all models to register them with Base
    import app.models  # noqa: F401

    # Create tables if they don't exist (fallback when not using Alembic)
    Base.metadata.create_all(bind=engine)

    # Seed development users and properties
    from app.seed import seed_users, seed_properties
    db = SessionLocal()
    try:
        seed_users(db)
        seed_properties(db)
    finally:
        db.close()

    print("[*] BHU-ID Backend started successfully!")
    yield
    print("[*] BHU-ID Backend shutting down.")


# Create FastAPI application
app = FastAPI(
    title="BHU-ID Backend API",
    description=(
        "Backend API for the BHU-ID unified property identity platform. "
        "Combines property records from multiple datasets (Google, SVAMITVA, e-Naksha), "
        "performs AI-assisted property matching, generates unique BHU-IDs, "
        "and serves data to a map-first frontend."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)
from app.api.websocket import router as ws_router
app.include_router(ws_router)



import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@app.get("/health", tags=["Health"])
def health_check():
    """Detailed health check."""
    return {
        "success": True,
        "status": "healthy",
        "service": "bhu-id-backend",
        "version": "1.0.0",
    }


# Serve React Frontend Build if present (Production Container)
frontend_dist = Path(__file__).resolve().parent.parent / "static" / "dist"
if not frontend_dist.exists():
    frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="static-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API or Docs
        if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "ws")):
            return {"error": "Not Found"}
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", tags=["Health"])
    def root():
        """Health check endpoint."""
        return {
            "success": True,
            "message": "BHU-ID Backend API is running",
            "version": "1.0.0",
            "docs": "/docs",
        }

