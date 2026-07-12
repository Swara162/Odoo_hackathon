from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.api.dependencies import get_current_user

from app.models.notification import Notification

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).all()


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id,
    db: Session = Depends(get_db)
):

    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    notification.is_read = True

    db.commit()

    return {
        "message": "Notification Read"
    }