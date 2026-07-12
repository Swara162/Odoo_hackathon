from datetime import datetime, timezone, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.dependencies import get_current_user

from app.models.asset import Asset, AssetStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.transfer_request import TransferRequest
from app.models.maintenance_request import MaintenanceRequest, MaintenanceStatus
from app.core.enums import TransferStatus, NotificationType

from app.schemas.allocation import (
    AllocationCreate,
    ReturnAssetRequest,
    TransferRequestCreate
)

from app.services.allocation_service import allocate_asset
from app.services.health_service import calculate_health_score
from app.services.notification_service import create_notification, log_activity

router = APIRouter(
    prefix="/allocation",
    tags=["Allocation"]
)


@router.post("/")
def allocate(
    request: AllocationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    asset = db.query(Asset).filter(
        Asset.id == request.asset_id
    ).first()

    if asset is None:
        raise HTTPException(404, "Asset not found")

    if asset.status != AssetStatus.AVAILABLE:
        raise HTTPException(
            400,
            "Asset already allocated"
        )

    # Conflict check: active maintenance
    active_maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.asset_id == asset.id,
        MaintenanceRequest.status != MaintenanceStatus.RESOLVED
    ).first()
    if active_maintenance:
        raise HTTPException(
            400,
            "Asset is currently under maintenance or pending approval"
        )

    allocation = allocate_asset(
        db,
        asset,
        request.employee_id,
        current_user.id,
        request.expected_return
    )

    calculate_health_score(db, asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="ALLOCATE",
        entity_type="ASSET",
        entity_id=asset.id,
        description=f"Allocated asset {asset.name} ({asset.asset_tag}) to user {request.employee_id}"
    )

    create_notification(
        db=db,
        user_id=request.employee_id,
        title="Asset Allocated",
        message=f"Asset {asset.name} ({asset.asset_tag}) has been allocated to you. Expected return: {request.expected_return}.",
        notification_type=NotificationType.ALLOCATION
    )

    return allocation


@router.get("/my-assets")
def my_assets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Allocation).filter(
        Allocation.employee_id == current_user.id,
        Allocation.allocation_status == AllocationStatus.ACTIVE
    ).all()


@router.post("/return/{allocation_id}")
def return_asset(
    allocation_id,
    request: ReturnAssetRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    allocation = db.query(Allocation).filter(
        Allocation.id == allocation_id
    ).first()

    if allocation is None:
        raise HTTPException(404, "Allocation not found")

    allocation.returned_at = datetime.now(timezone.utc)
    allocation.return_notes = request.return_notes
    allocation.allocation_status = AllocationStatus.RETURNED
    allocation.asset.status = AssetStatus.AVAILABLE

    db.commit()
    db.refresh(allocation)

    calculate_health_score(db, allocation.asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="RETURN",
        entity_type="ASSET",
        entity_id=allocation.asset.id,
        description=f"Returned asset {allocation.asset.name} ({allocation.asset.asset_tag})"
    )

    create_notification(
        db=db,
        user_id=allocation.employee_id,
        title="Asset Returned",
        message=f"Asset {allocation.asset.name} ({allocation.asset.asset_tag}) has been returned.",
        notification_type=NotificationType.ALLOCATION
    )

    return {
        "message": "Asset Returned Successfully"
    }


@router.post("/transfer")
def request_transfer(
    request: TransferRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    allocation = db.query(Allocation).filter(
        Allocation.asset_id == request.asset_id,
        Allocation.allocation_status == AllocationStatus.ACTIVE
    ).first()

    if allocation is None:
        raise HTTPException(404, "Allocation not found")

    transfer = TransferRequest(
        asset_id=request.asset_id,
        from_employee_id=allocation.employee_id,
        to_employee_id=request.to_employee_id,
        requested_by=current_user.id,
        status=TransferStatus.PENDING,
        remarks=request.remarks,
        requested_at=datetime.now(timezone.utc)
    )

    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    calculate_health_score(db, allocation.asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="TRANSFER_REQUEST",
        entity_type="ASSET",
        entity_id=request.asset_id,
        description=f"Requested transfer of asset {allocation.asset.name} to employee {request.to_employee_id}"
    )

    create_notification(
        db=db,
        user_id=request.to_employee_id,
        title="Asset Transfer Requested",
        message=f"An asset transfer has been requested for {allocation.asset.name} ({allocation.asset.asset_tag}).",
        notification_type=NotificationType.TRANSFER
    )

    return transfer


@router.post("/transfer/{transfer_id}/approve")
def approve_transfer(
    transfer_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    transfer = db.query(TransferRequest).filter(
        TransferRequest.id == transfer_id
    ).first()

    if transfer is None:
        raise HTTPException(
            status_code=404,
            detail="Transfer Not Found"
        )

    allocation = db.query(Allocation).filter(
        Allocation.asset_id == transfer.asset_id,
        Allocation.allocation_status == AllocationStatus.ACTIVE
    ).first()

    if allocation:
        allocation.employee_id = transfer.to_employee_id
        db.add(allocation)

    transfer.status = TransferStatus.APPROVED
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    asset = db.query(Asset).filter(Asset.id == transfer.asset_id).first()
    if asset:
        calculate_health_score(db, asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="TRANSFER_APPROVE",
        entity_type="ASSET",
        entity_id=transfer.asset_id,
        description=f"Approved transfer of asset to employee {transfer.to_employee_id}"
    )

    create_notification(
        db=db,
        user_id=transfer.to_employee_id,
        title="Transfer Approved",
        message=f"The transfer request for asset has been approved.",
        notification_type=NotificationType.TRANSFER
    )

    return {
        "message": "Transfer Approved"
    }


@router.post("/transfer/{transfer_id}/reject")
def reject_transfer(
    transfer_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    transfer = db.query(TransferRequest).filter(
        TransferRequest.id == transfer_id
    ).first()

    if transfer is None:
        raise HTTPException(
            status_code=404,
            detail="Transfer Not Found"
        )

    transfer.status = TransferStatus.REJECTED
    db.commit()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="TRANSFER_REJECT",
        entity_type="ASSET",
        entity_id=transfer.asset_id,
        description=f"Rejected transfer of asset to employee {transfer.to_employee_id}"
    )

    return {
        "message": "Transfer Rejected"
    }


@router.get("/overdue")
def get_overdue_allocations(
    db: Session = Depends(get_db)
):
    today_dt = date.today()

    overdue = db.query(Allocation).filter(
        Allocation.expected_return < today_dt,
        Allocation.allocation_status == AllocationStatus.ACTIVE
    ).all()

    for alloc in overdue:
        alloc.allocation_status = AllocationStatus.OVERDUE
        db.add(alloc)

    db.commit()

    return db.query(Allocation).filter(
        Allocation.allocation_status == AllocationStatus.OVERDUE
    ).all()