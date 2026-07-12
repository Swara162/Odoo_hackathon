from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.dependencies import get_current_user
from app.models.booking import Booking
from app.models.transfer_request import TransferRequest
from app.models.allocation import Allocation, AllocationStatus
from app.models.asset import Asset, AssetStatus
from app.core.enums import BookingStatus, TransferStatus, NotificationType
from app.schemas.booking import BookingCreate, BookingReschedule
from app.services.booking_service import has_booking_conflict
from app.services.notification_service import create_notification, log_activity

router = APIRouter(
    prefix="/booking",
    tags=["Booking"]
)


@router.post("/")
def create_booking(
    request: BookingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    conflict = has_booking_conflict(
        db,
        request.resource_name,
        request.booking_date,
        request.start_time,
        request.end_time
    )

    if conflict:
        raise HTTPException(
            status_code=400,
            detail="Time Slot Already Booked"
        )

    booking = Booking(
        resource_name=request.resource_name,
        booked_by=current_user.id,
        booking_date=request.booking_date,
        start_time=request.start_time,
        end_time=request.end_time,
        purpose=request.purpose,
        status=BookingStatus.UPCOMING
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="CREATE_BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id,
        description=f"Created booking for {booking.resource_name} on {booking.booking_date}"
    )

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Booking Created",
        message=f"Successfully booked {booking.resource_name} on {booking.booking_date}.",
        notification_type=NotificationType.BOOKING
    )

    return booking


@router.get("/")
def booking_history(
    db: Session = Depends(get_db)
):
    return db.query(Booking).all()


@router.get("/calendar")
def get_calendar_data(
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(Booking.status != BookingStatus.CANCELLED).all()
    events = []
    for b in bookings:
        events.append({
            "id": str(b.id),
            "resource_name": b.resource_name,
            "start": f"{b.booking_date}T{b.start_time}",
            "end": f"{b.booking_date}T{b.end_time}",
            "title": f"{b.resource_name} - {b.purpose if b.purpose else 'Booking'}",
            "booked_by": str(b.booked_by),
            "status": b.status.value
        })
    return events


@router.delete("/{booking_id}")
def cancel_booking(
    booking_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking Not Found"
        )

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="CANCEL_BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id,
        description=f"Cancelled booking for {booking.resource_name}"
    )

    create_notification(
        db=db,
        user_id=booking.booked_by,
        title="Booking Cancelled",
        message=f"Booking for {booking.resource_name} has been cancelled.",
        notification_type=NotificationType.BOOKING
    )

    return {
        "message": "Booking Cancelled"
    }


@router.post("/{booking_id}/reschedule")
def reschedule_booking(
    booking_id,
    request: BookingReschedule,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking Not Found"
        )

    new_date = request.booking_date if request.booking_date is not None else booking.booking_date
    new_start = request.start_time if request.start_time is not None else booking.start_time
    new_end = request.end_time if request.end_time is not None else booking.end_time

    conflict = db.query(Booking).filter(
        Booking.resource_name == booking.resource_name,
        Booking.booking_date == new_date,
        Booking.id != booking.id,
        Booking.status != BookingStatus.CANCELLED
    ).all()

    for cb in conflict:
        if new_start < cb.end_time and new_end > cb.start_time:
            raise HTTPException(
                status_code=400,
                detail="Time Slot Already Booked"
            )

    booking.booking_date = new_date
    booking.start_time = new_start
    booking.end_time = new_end
    
    db.commit()
    db.refresh(booking)

    log_activity(
        db=db,
        user_id=current_user.id,
        action="RESCHEDULE_BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id,
        description=f"Rescheduled booking for {booking.resource_name} to {new_date} {new_start}-{new_end}"
    )

    create_notification(
        db=db,
        user_id=booking.booked_by,
        title="Booking Rescheduled",
        message=f"Booking for {booking.resource_name} rescheduled to {new_date} ({new_start} - {new_end}).",
        notification_type=NotificationType.BOOKING
    )

    return booking


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
