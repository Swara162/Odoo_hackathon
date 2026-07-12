from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.dependencies import get_current_user

from app.models.asset import Asset, AssetStatus
from app.models.maintenance_request import MaintenanceRequest
from app.core.enums import MaintenanceStatus, NotificationType

from app.schemas.maintenance import (
    MaintenanceCreate,
    TechnicianAssign,
    MaintenanceRemark
)
from app.services.health_service import calculate_health_score
from app.services.notification_service import create_notification, log_activity

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


@router.post("/")
def raise_request(
    request: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    maintenance = MaintenanceRequest(
        asset_id=request.asset_id,
        reported_by=current_user.id,
        issue=request.issue,
        priority=request.priority,
        photo_url=request.photo_url,
        status=MaintenanceStatus.PENDING
    )

    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)

    calculate_health_score(db, maintenance.asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MAINTENANCE_RAISE",
        entity_type="ASSET",
        entity_id=maintenance.asset_id,
        description=f"Raised maintenance request: {request.issue}"
    )

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Maintenance Requested",
        message=f"Maintenance request created for asset.",
        notification_type=NotificationType.MAINTENANCE
    )

    return maintenance


@router.get("/")
def maintenance_queue(
    db: Session = Depends(get_db)
):
    return db.query(MaintenanceRequest).all()


@router.get("/history")
def maintenance_history(
    db: Session = Depends(get_db)
):
    return db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status.in_([MaintenanceStatus.RESOLVED, MaintenanceStatus.REJECTED])
    ).all()


@router.post("/{maintenance_id}/approve")
def approve_request(
    maintenance_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(status_code=404, detail="Request not found")

    maintenance.status = MaintenanceStatus.APPROVED
    maintenance.approved_by = current_user.id
    maintenance.asset.status = AssetStatus.UNDER_MAINTENANCE

    db.commit()
    db.refresh(maintenance)

    calculate_health_score(db, maintenance.asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MAINTENANCE_APPROVE",
        entity_type="ASSET",
        entity_id=maintenance.asset_id,
        description=f"Approved maintenance request for asset {maintenance.asset.name}"
    )

    create_notification(
        db=db,
        user_id=maintenance.reported_by,
        title="Maintenance Approved",
        message=f"Maintenance request for {maintenance.asset.name} has been approved.",
        notification_type=NotificationType.MAINTENANCE
    )

    return {"message": "Approved"}


@router.post("/{maintenance_id}/reject")
def reject_request(
    maintenance_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(status_code=404, detail="Request not found")

    maintenance.status = MaintenanceStatus.REJECTED
    maintenance.approved_by = current_user.id

    db.commit()
    db.refresh(maintenance)

    calculate_health_score(db, maintenance.asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MAINTENANCE_REJECT",
        entity_type="ASSET",
        entity_id=maintenance.asset_id,
        description=f"Rejected maintenance request for asset {maintenance.asset.name}"
    )

    create_notification(
        db=db,
        user_id=maintenance.reported_by,
        title="Maintenance Request Rejected",
        message=f"Maintenance request for {maintenance.asset.name} has been rejected.",
        notification_type=NotificationType.MAINTENANCE
    )

    return {"message": "Rejected"}


@router.post("/{maintenance_id}/assign")
def assign_technician(
    maintenance_id,
    request: TechnicianAssign,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(status_code=404, detail="Request not found")

    maintenance.technician_name = request.technician_name
    maintenance.status = MaintenanceStatus.IN_PROGRESS

    db.commit()
    db.refresh(maintenance)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MAINTENANCE_ASSIGN",
        entity_type="ASSET",
        entity_id=maintenance.asset_id,
        description=f"Assigned technician {request.technician_name} to maintenance request"
    )

    return {"message": "Technician Assigned"}


@router.post("/{maintenance_id}/resolve")
def resolve_request(
    maintenance_id,
    request: MaintenanceRemark,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(status_code=404, detail="Request not found")

    maintenance.status = MaintenanceStatus.RESOLVED
    maintenance.remarks = request.remarks
    maintenance.resolved_at = datetime.now(timezone.utc)
    maintenance.asset.status = AssetStatus.AVAILABLE

    db.commit()
    db.refresh(maintenance)

    calculate_health_score(db, maintenance.asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="MAINTENANCE_RESOLVE",
        entity_type="ASSET",
        entity_id=maintenance.asset_id,
        description=f"Resolved maintenance request for asset {maintenance.asset.name}. Remarks: {request.remarks}"
    )

    create_notification(
        db=db,
        user_id=maintenance.reported_by,
        title="Maintenance Resolved",
        message=f"Maintenance for {maintenance.asset.name} completed successfully.",
        notification_type=NotificationType.MAINTENANCE
    )

    return {"message": "Maintenance Completed"}