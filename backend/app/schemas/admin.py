from pydantic import BaseModel
from typing import Optional

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PromoteUserRequest(BaseModel):
    role: str
    department_id: Optional[str] = None