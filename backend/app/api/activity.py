from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.activity_log import ActivityLog

router = APIRouter(
    prefix="/activity",
    tags=["Activity Logs"]
)


@router.get("/")
def get_logs(
    db: Session = Depends(get_db)
):

    return db.query(
        ActivityLog
    ).order_by(
        ActivityLog.created_at.desc()
    ).all()