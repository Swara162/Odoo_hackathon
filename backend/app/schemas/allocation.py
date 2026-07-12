from datetime import date
from uuid import UUID

from pydantic import BaseModel


class AllocationCreate(BaseModel):
    asset_id: UUID
    employee_id: UUID
    expected_return: date


class ReturnAssetRequest(BaseModel):
    return_notes: str


class TransferRequestCreate(BaseModel):
    asset_id: UUID
    to_employee_id: UUID
    remarks: str | None = None