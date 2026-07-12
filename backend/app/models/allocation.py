from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.core.enums import AllocationStatus

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.user import User


class Allocation(BaseModel):
    __tablename__ = "allocations"

    asset_id = mapped_column(
        ForeignKey("assets.id"),
        nullable=False
    )

    employee_id = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    allocated_by = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    allocated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    expected_return: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    return_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    allocation_status: Mapped[AllocationStatus] = mapped_column(
        Enum(AllocationStatus),
        default=AllocationStatus.ACTIVE,
        nullable=False
    )

    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="allocations"
    )

    employee: Mapped["User"] = relationship(
        "User",
        foreign_keys=[employee_id],
        back_populates="allocations"
    )

    allocator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[allocated_by]
    )