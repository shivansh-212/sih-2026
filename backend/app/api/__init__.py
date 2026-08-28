"""
API router aggregation.
All routers are collected here and included in the main app.
"""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.properties import router as properties_router
from app.api.datasets import router as datasets_router
from app.api.matching import router as matching_router
from app.api.admin import router as admin_router
from app.api.websocket import router as ws_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(properties_router)
api_router.include_router(datasets_router)
api_router.include_router(matching_router)
api_router.include_router(admin_router)
api_router.include_router(ws_router)

