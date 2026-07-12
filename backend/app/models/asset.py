from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Date
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.models.base import BaseModel
from app.core.enums import AssetStatus, AssetCondition

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.department import Department
    from app.models.asset_category import AssetCategory
    from app.models.allocation import Allocation
    from app.models.transfer_request import TransferRequest
    from app.models.maintenance_request import MaintenanceRequest
    from app.models.audit_item import AuditItem


class Asset(BaseModel):

    __tablename__ = "assets"

    asset_tag: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True
    )

    serial_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    purchase_date: Mapped[Date] = mapped_column(
        Date,
        nullable=False
    )

    purchase_cost: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    location: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    document_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    health_score: Mapped[int] = mapped_column(
        default=100
    )

    bookable: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus),
        default=AssetStatus.AVAILABLE
    )

    condition: Mapped[AssetCondition] = mapped_column(
        Enum(AssetCondition),
        default=AssetCondition.EXCELLENT
    )

    category_id = mapped_column(
        ForeignKey("asset_categories.id"),
        nullable=False
    )

    department_id = mapped_column(
        ForeignKey("departments.id"),
        nullable=False
    )

    created_by = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    category: Mapped["AssetCategory"] = relationship(
        back_populates="assets"
    )

    department: Mapped["Department"] = relationship(
        back_populates="assets"
    )

    created_by_user: Mapped["User"] = relationship(
        back_populates="assets_created"
    )

    allocations = relationship(
        "Allocation",
        back_populates="asset",
        cascade="all, delete-orphan"
    )

    transfer_requests = relationship(
        "TransferRequest",
        back_populates="asset",
        cascade="all, delete-orphan"
    )

    maintenance_requests = relationship(
        "MaintenanceRequest",
        back_populates="asset",
        cascade="all, delete-orphan"
    )

    audit_items = relationship(
        "AuditItem",
        back_populates="asset",
        cascade="all, delete-orphan"
    )