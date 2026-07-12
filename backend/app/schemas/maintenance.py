from pydantic import BaseModel


class MaintenanceCreate(BaseModel):
    asset_id: str
    issue: str
    priority: str
    photo_url: str | None = None


class TechnicianAssign(BaseModel):
    technician_name: str


class MaintenanceRemark(BaseModel):
    remarks: str