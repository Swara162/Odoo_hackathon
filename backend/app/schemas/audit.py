from datetime import date
from pydantic import BaseModel


class AuditCycleCreate(BaseModel):
    title: str
    department_id: str
    auditor_id: str
    start_date: date
    end_date: date


class AuditVerification(BaseModel):
    verification_status: str
    remarks: str | None = None


class AuditAssignAuditor(BaseModel):
    auditor_id: str