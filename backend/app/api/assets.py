import os
import io
import qrcode
from uuid import UUID
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.dependencies import get_current_user
from app.models.asset import Asset, AssetStatus
from app.models.allocation import Allocation
from app.models.transfer_request import TransferRequest
from app.models.maintenance_request import MaintenanceRequest
from app.models.audit_item import AuditItem
from app.schemas.asset import AssetCreate, AssetUpdate
from app.services.asset_service import generate_asset_tag
from app.services.health_service import calculate_health_score
from app.services.notification_service import create_notification, log_activity
from app.core.enums import NotificationType

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


@router.post("/")
def register_asset(
    request: AssetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    existing = db.query(Asset).filter(Asset.serial_number == request.serial_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Serial number already registered")

    p_date = request.purchase_date if request.purchase_date else date.today()
    p_cost = request.purchase_cost if request.purchase_cost else Decimal("0.0")

    asset = Asset(
        asset_tag=generate_asset_tag(db),
        name=request.name,
        category_id=request.category_id,
        serial_number=request.serial_number,
        condition=request.condition,
        location=request.location,
        department_id=request.department_id,
        bookable=request.is_bookable,
        purchase_date=p_date,
        purchase_cost=p_cost,
        created_by=current_user.id,
        status=AssetStatus.AVAILABLE
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)

    calculate_health_score(db, asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="REGISTER",
        entity_type="ASSET",
        entity_id=asset.id,
        description=f"Registered asset {asset.name} with tag {asset.asset_tag}"
    )

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Asset Registered",
        message=f"Asset {asset.name} ({asset.asset_tag}) has been registered.",
        notification_type=NotificationType.GENERAL
    )

    return asset


@router.get("/")
def get_assets(
    db: Session = Depends(get_db)
):
    assets = db.query(Asset).all()
    for asset in assets:
        calculate_health_score(db, asset)
    return assets


@router.get("/{asset_id}")
def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    calculate_health_score(db, asset)
    return asset


@router.put("/{asset_id}")
def update_asset(
    asset_id: UUID,
    request: AssetUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    if request.name is not None:
        asset.name = request.name

    if request.condition is not None:
        asset.condition = request.condition

    if request.location is not None:
        asset.location = request.location

    if request.status is not None:
        asset.status = request.status

    if request.is_bookable is not None:
        asset.bookable = request.is_bookable

    if request.purchase_date is not None:
        asset.purchase_date = request.purchase_date

    if request.purchase_cost is not None:
        asset.purchase_cost = request.purchase_cost

    db.commit()
    db.refresh(asset)

    calculate_health_score(db, asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="ASSET",
        entity_id=asset.id,
        description=f"Updated asset {asset.name} ({asset.asset_tag})"
    )

    return asset


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="ASSET",
        entity_id=asset.id,
        description=f"Deleted asset {asset.name} ({asset.asset_tag})"
    )

    db.delete(asset)
    db.commit()

    return {
        "message": "Asset deleted successfully"
    }


@router.get("/search/")
def search_asset(
    keyword: str = Query(...),
    db: Session = Depends(get_db)
):
    return db.query(Asset).filter(
        (Asset.name.ilike(f"%{keyword}%")) |
        (Asset.serial_number.ilike(f"%{keyword}%")) |
        (Asset.asset_tag.ilike(f"%{keyword}%"))
    ).all()


@router.get("/status/{status}")
def filter_assets(
    status: str,
    db: Session = Depends(get_db)
):
    return db.query(Asset).filter(
        Asset.status == status
    ).all()


@router.get("/{asset_id}/qr")
def generate_qr(
    asset_id: UUID,
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    qr_data = f"ID: {asset.id}\nTag: {asset.asset_tag}\nName: {asset.name}\nSerial: {asset.serial_number}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@router.get("/{asset_id}/history")
def get_asset_history(
    asset_id: UUID,
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    allocations = db.query(Allocation).filter(Allocation.asset_id == asset_id).all()
    transfers = db.query(TransferRequest).filter(TransferRequest.asset_id == asset_id).all()
    maintenances = db.query(MaintenanceRequest).filter(MaintenanceRequest.asset_id == asset_id).all()
    audits = db.query(AuditItem).filter(AuditItem.asset_id == asset_id).all()

    return {
        "allocations": allocations,
        "transfers": transfers,
        "maintenance_requests": maintenances,
        "audits": audits
    }


@router.post("/{asset_id}/upload-image")
def upload_image(
    asset_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    upload_dir = os.path.join("app", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{asset_id}{file_ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    asset.image_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(asset)

    calculate_health_score(db, asset)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="UPLOAD_IMAGE",
        entity_type="ASSET",
        entity_id=asset.id,
        description=f"Uploaded image for asset {asset.name} ({asset.asset_tag})"
    )

    return {
        "message": "Image uploaded successfully",
        "image_url": asset.image_url
    }