from uuid import UUID
from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class AssetCreate(BaseModel):
    name: str
    category_id: UUID
    serial_number: str
    condition: str
    location: str
    department_id: UUID
    is_bookable: bool = False
    purchase_date: date | None = None
    purchase_cost: Decimal | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    condition: str | None = None
    location: str | None = None
    status: str | None = None
    is_bookable: bool | None = None
    purchase_date: date | None = None
    purchase_cost: Decimal | None = None