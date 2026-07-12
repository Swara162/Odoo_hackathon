from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.core.enums import NotificationType

if TYPE_CHECKING:
    from app.models.user import User


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType),
        nullable=False
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications"
    )