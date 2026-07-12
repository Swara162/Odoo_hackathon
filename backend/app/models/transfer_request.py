from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.core.enums import TransferStatus

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.user import User


class TransferRequest(BaseModel):
    __tablename__ = "transfer_requests"

    asset_id = mapped_column(
        ForeignKey("assets.id"),
        nullable=False
    )

    from_employee_id = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    to_employee_id = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    requested_by = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    approved_by = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    status: Mapped[TransferStatus] = mapped_column(
        Enum(TransferStatus),
        default=TransferStatus.PENDING,
        nullable=False
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="transfer_requests"
    )

    from_employee: Mapped["User"] = relationship(
        "User",
        foreign_keys=[from_employee_id],
        back_populates="transfers_from"
    )

    to_employee: Mapped["User"] = relationship(
        "User",
        foreign_keys=[to_employee_id],
        back_populates="transfers_to"
    )

    requester: Mapped["User"] = relationship(
        "User",
        foreign_keys=[requested_by],
        back_populates="transfer_requests"
    )

    approver: Mapped["User"] = relationship(
        "User",
        foreign_keys=[approved_by],
        back_populates="approved_transfers"
    )