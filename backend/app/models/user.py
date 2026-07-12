from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.asset import Asset
    from app.models.allocation import Allocation
    from app.models.transfer_request import TransferRequest
    from app.models.booking import Booking
    from app.models.maintenance_request import MaintenanceRequest
    from app.models.audit_cycle import AuditCycle
    from app.models.notification import Notification
    from app.models.activity_log import ActivityLog


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    ASSET_MANAGER = "ASSET_MANAGER"
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD"
    EMPLOYEE = "EMPLOYEE"


class User(BaseModel):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        nullable=False,
        index=True
    )

    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    phone: Mapped[str | None] = mapped_column(
        String(15),
        nullable=True
    )

    profile_image: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.EMPLOYEE,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    department_id: Mapped[str | None] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True
    )

    department: Mapped["Department"] = relationship(
        back_populates="users"
    )

    assets_created = relationship(
        "Asset",
        back_populates="created_by_user"
    )

    allocations = relationship(
    "Allocation",
    foreign_keys="Allocation.employee_id",
    back_populates="employee"
    )

    allocations_given = relationship(
        "Allocation",
        foreign_keys="Allocation.allocated_by"
    )

    bookings = relationship(
        "Booking",
        foreign_keys="Booking.booked_by",
        back_populates="user"
    )

    maintenance_requests = relationship(
        "MaintenanceRequest",
        foreign_keys="MaintenanceRequest.reported_by",
        back_populates="reported_by_user"
    )

    approved_maintenance_requests = relationship(
        "MaintenanceRequest",
        foreign_keys="MaintenanceRequest.approved_by",
        back_populates="approved_by_user"
    )

    created_audits = relationship(
    "AuditCycle",
    foreign_keys="AuditCycle.created_by",
    back_populates="creator"
    )

    audit_cycles = relationship(
        "AuditCycle",
        foreign_keys="AuditCycle.auditor_id",
        back_populates="auditor"
    )

    notifications = relationship(
        "Notification",
        back_populates="user"
    )

    activity_logs = relationship(
        "ActivityLog",
        back_populates="user"
    )

    transfers_from = relationship(
    "TransferRequest",
    foreign_keys="TransferRequest.from_employee_id",
    back_populates="from_employee"
    )

    transfers_to = relationship(
        "TransferRequest",
        foreign_keys="TransferRequest.to_employee_id",
        back_populates="to_employee"
    )

    transfer_requests = relationship(
        "TransferRequest",
        foreign_keys="TransferRequest.requested_by",
        back_populates="requester"
    )

    approved_transfers = relationship(
        "TransferRequest",
        foreign_keys="TransferRequest.approved_by",
        back_populates="approver"
    )