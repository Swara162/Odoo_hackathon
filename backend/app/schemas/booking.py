from datetime import date, time

from pydantic import BaseModel


class BookingCreate(BaseModel):
    resource_name: str
    booking_date: date
    start_time: time
    end_time: time
    purpose: str | None = None


class BookingReschedule(BaseModel):
    booking_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None