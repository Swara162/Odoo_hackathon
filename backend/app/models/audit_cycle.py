from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.core.enums import AuditStatus

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User
    from app.models.audit_item import AuditItem


class AuditCycle(BaseModel):
    __tablename__ = "audit_cycles"

    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    department_id = mapped_column(
        ForeignKey("departments.id"),
        nullable=False
    )

    auditor_id = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    created_by = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    status: Mapped[AuditStatus] = mapped_column(
        Enum(AuditStatus),
        default=AuditStatus.OPEN,
        nullable=False
    )

    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="audit_cycles"
    )

    auditor: Mapped["User"] = relationship(
        "User",
        foreign_keys=[auditor_id],
        back_populates="audit_cycles"
    )

    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_audits"
    )

    audit_items = relationship(
        "AuditItem",
        back_populates="audit_cycle",
        cascade="all, delete-orphan"
    )