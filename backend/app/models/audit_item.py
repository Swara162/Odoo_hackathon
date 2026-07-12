from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.core.enums import VerificationStatus

if TYPE_CHECKING:
    from app.models.audit_cycle import AuditCycle
    from app.models.asset import Asset


class AuditItem(BaseModel):
    __tablename__ = "audit_items"

    audit_cycle_id = mapped_column(
        ForeignKey("audit_cycles.id"),
        nullable=False
    )

    asset_id = mapped_column(
        ForeignKey("assets.id"),
        nullable=False
    )

    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus),
        default=VerificationStatus.VERIFIED,
        nullable=False
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    audit_cycle: Mapped["AuditCycle"] = relationship(
        "AuditCycle",
        back_populates="audit_items"
    )

    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="audit_items"
    )