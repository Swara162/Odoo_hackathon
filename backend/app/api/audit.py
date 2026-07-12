from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.dependencies import get_current_user

from app.models.audit_cycle import AuditCycle
from app.models.audit_item import AuditItem
from app.models.asset import Asset, AssetStatus

from app.core.enums import (
    AuditStatus,
    VerificationStatus,
    NotificationType
)

from app.schemas.audit import (
    AuditCycleCreate,
    AuditVerification,
    AuditAssignAuditor
)
from app.services.health_service import calculate_health_score
from app.services.notification_service import create_notification, log_activity

router = APIRouter(
    prefix="/audit",
    tags=["Audit"]
)


@router.post("/cycle")
def create_cycle(
    request: AuditCycleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    cycle = AuditCycle(
        title=request.title,
        department_id=request.department_id,
        auditor_id=request.auditor_id,
        created_by=current_user.id,
        start_date=request.start_date,
        end_date=request.end_date,
        status=AuditStatus.OPEN
    )

    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="AUDIT_CREATE",
        entity_type="AUDIT",
        entity_id=cycle.id,
        description=f"Created audit cycle {cycle.title}"
    )

    create_notification(
        db=db,
        user_id=request.auditor_id,
        title="Audit Cycle Assigned",
        message=f"You have been assigned to audit cycle: {cycle.title}",
        notification_type=NotificationType.AUDIT
    )

    return cycle


@router.post("/cycle/{cycle_id}/assign")
def assign_auditor(
    cycle_id,
    request: AuditAssignAuditor,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    cycle = db.query(AuditCycle).filter(AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit Cycle not found")

    cycle.auditor_id = request.auditor_id
    db.commit()
    db.refresh(cycle)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="AUDIT_ASSIGN",
        entity_type="AUDIT",
        entity_id=cycle.id,
        description=f"Assigned auditor {request.auditor_id} to cycle {cycle.title}"
    )

    create_notification(
        db=db,
        user_id=request.auditor_id,
        title="Audit Cycle Assigned",
        message=f"You have been assigned to audit cycle {cycle.title}.",
        notification_type=NotificationType.AUDIT
    )

    return cycle


@router.post("/{cycle_id}/{asset_id}")
def verify_asset(
    cycle_id,
    asset_id,
    request: AuditVerification,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    item = db.query(AuditItem).filter(
        AuditItem.audit_cycle_id == cycle_id,
        AuditItem.asset_id == asset_id
    ).first()

    if not item:
        item = AuditItem(
            audit_cycle_id=cycle_id,
            asset_id=asset_id,
            verification_status=request.verification_status,
            remarks=request.remarks,
            verified_at=datetime.now(timezone.utc)
        )
        db.add(item)
    else:
        item.verification_status = request.verification_status
        item.remarks = request.remarks
        item.verified_at = datetime.now(timezone.utc)

    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if request.verification_status == VerificationStatus.MISSING:
        asset.status = AssetStatus.LOST
    elif request.verification_status == VerificationStatus.DAMAGED:
        asset.condition = "DAMAGED"

    db.commit()
    db.refresh(item)

    calculate_health_score(db, asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="AUDIT_VERIFY",
        entity_type="ASSET",
        entity_id=asset.id,
        description=f"Verified asset {asset.name} status as {request.verification_status}"
    )

    return item


@router.get("/cycle/{cycle_id}/discrepancy")
def get_discrepancy_report(
    cycle_id,
    db: Session = Depends(get_db)
):
    cycle = db.query(AuditCycle).filter(AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit Cycle not found")

    assets = db.query(Asset).filter(Asset.department_id == cycle.department_id).all()

    discrepancies = []
    for asset in assets:
        audit_item = db.query(AuditItem).filter(
            AuditItem.audit_cycle_id == cycle.id,
            AuditItem.asset_id == asset.id
        ).first()

        if not audit_item:
            discrepancies.append({
                "asset_id": str(asset.id),
                "asset_tag": asset.asset_tag,
                "name": asset.name,
                "reason": "NOT_VERIFIED",
                "remarks": "Asset was not verified during this audit cycle"
            })
        elif audit_item.verification_status in [VerificationStatus.MISSING, VerificationStatus.DAMAGED]:
            discrepancies.append({
                "asset_id": str(asset.id),
                "asset_tag": asset.asset_tag,
                "name": asset.name,
                "reason": audit_item.verification_status.value,
                "remarks": audit_item.remarks
            })

    return {
        "audit_cycle_id": str(cycle.id),
        "title": cycle.title,
        "discrepancies": discrepancies
    }


@router.post("/cycle/{cycle_id}/close")
def close_cycle(
    cycle_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    cycle = db.query(AuditCycle).filter(AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit Cycle not found")

    cycle.status = AuditStatus.CLOSED
    db.commit()
    db.refresh(cycle)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="AUDIT_CLOSE",
        entity_type="AUDIT",
        entity_id=cycle.id,
        description=f"Closed audit cycle {cycle.title}"
    )

    create_notification(
        db=db,
        user_id=cycle.auditor_id,
        title="Audit Cycle Closed",
        message=f"Audit cycle {cycle.title} has been closed.",
        notification_type=NotificationType.AUDIT
    )

    return cycle