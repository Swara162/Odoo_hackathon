from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.admin import router as admin_router

app = FastAPI(
    title="AssetFlow API",
    version="1.0.0",
    description="Enterprise Asset & Resource Management System"
)

# Register Routers
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to AssetFlow Backend 🚀"
    }