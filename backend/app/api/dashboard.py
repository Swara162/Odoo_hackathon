from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.asset import Asset, AssetStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.booking import Booking
from app.models.maintenance_request import (
    MaintenanceRequest,
    MaintenanceStatus
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(db: Session = Depends(get_db)):

    available_assets = db.query(Asset).filter(
        Asset.status == AssetStatus.AVAILABLE
    ).count()

    allocated_assets = db.query(Asset).filter(
        Asset.status == AssetStatus.ALLOCATED
    ).count()

    maintenance_assets = db.query(Asset).filter(
        Asset.status == AssetStatus.UNDER_MAINTENANCE
    ).count()

    lost_assets = db.query(Asset).filter(
        Asset.status == AssetStatus.LOST
    ).count()

    active_bookings = db.query(Booking).count()

    pending_maintenance = db.query(
        MaintenanceRequest
    ).filter(
        MaintenanceRequest.status != MaintenanceStatus.RESOLVED
    ).count()

    overdue_assets = db.query(
        Allocation
    ).filter(
        Allocation.expected_return < date.today(),
        Allocation.allocation_status == AllocationStatus.ACTIVE
    ).count()

    return {

        "available_assets": available_assets,

        "allocated_assets": allocated_assets,

        "maintenance_assets": maintenance_assets,

        "lost_assets": lost_assets,

        "active_bookings": active_bookings,

        "pending_maintenance": pending_maintenance,

        "overdue_assets": overdue_assets

    }