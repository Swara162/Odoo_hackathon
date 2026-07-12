from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.core.enums import BookingStatus


def has_booking_conflict(
    db: Session,
    resource_name,
    booking_date,
    start_time,
    end_time
):

    bookings = db.query(Booking).filter(
        Booking.resource_name == resource_name,
        Booking.booking_date == booking_date,
        Booking.status != BookingStatus.CANCELLED
    ).all()

    for booking in bookings:

        if start_time < booking.end_time and end_time > booking.start_time:
            return True

    return False