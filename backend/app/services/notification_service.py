from uuid import UUID
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.core.enums import NotificationType


def create_notification(
    db: Session,
    user_id,
    title: str,
    message: str,
    notification_type: NotificationType
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def log_activity(
    db: Session,
    user_id,
    action: str,
    entity_type: str,
    entity_id,
    description: str | None = None
) -> ActivityLog:
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
