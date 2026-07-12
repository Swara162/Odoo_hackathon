from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.models.base import BaseModel
from app.core.enums import MaintenanceStatus

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.user import User


class MaintenanceRequest(BaseModel):
    __tablename__ = "maintenance_requests"

    asset_id = mapped_column(
        ForeignKey("assets.id"),
        nullable=False
    )

    reported_by = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    approved_by = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    issue: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    technician_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    photo_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus),
        default=MaintenanceStatus.PENDING,
        nullable=False
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="maintenance_requests"
    )

    reported_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[reported_by],
        back_populates="maintenance_requests"
    )

    approved_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[approved_by],
        back_populates="approved_maintenance_requests"
    )