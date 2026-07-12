import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.assets import router as asset_router
from app.api.allocation import router as allocation_router
from app.api.booking import router as booking_router
from app.api.maintenance import router as maintenance_router
from app.api.audit import router as audit_router
from app.api.dashboard import router as dashboard_router
from app.api.notification import router as notification_router
from app.api.activity import router as activity_router
from app.api.reports import router as reports_router

app = FastAPI(
    title="AssetFlow API",
    version="1.0.0",
    description="Enterprise Asset & Resource Management System"
)

# Ensure static/uploads directories exist
static_dir = os.path.join("app", "static")
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(asset_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(allocation_router)
app.include_router(booking_router)
app.include_router(maintenance_router)
app.include_router(audit_router)
app.include_router(dashboard_router)
app.include_router(notification_router)
app.include_router(activity_router)
app.include_router(reports_router)



@app.get("/")
def root():
    return {
        "message": "Welcome to AssetFlow Backend 🚀"
    }