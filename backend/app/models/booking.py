from __future__ import annotations

from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Date, Time, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.core.enums import BookingStatus

if TYPE_CHECKING:
    from app.models.user import User


class Booking(BaseModel):
    __tablename__ = "bookings"

    resource_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    booked_by = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    booking_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    purpose: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus),
        default=BookingStatus.UPCOMING,
        nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="bookings"
    )