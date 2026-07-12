from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.dependencies import get_current_user
from app.api.role_checker import RoleChecker

from app.models.user import User, UserRole
from app.models.department import Department
from app.models.asset_category import AssetCategory

from app.schemas.admin import (
    DepartmentCreate,
    CategoryCreate,
    PromoteUserRequest
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

allow_admin = RoleChecker(["ADMIN"])


@router.get("/dashboard")
def admin_dashboard(
    current_user=Depends(allow_admin)
):
    return {
        "message": f"Welcome {current_user.full_name}"
    }


@router.get("/employees")
def employee_directory(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(User).all()


@router.get("/departments")
def get_departments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Department).all()


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(AssetCategory).all()


@router.post("/departments")
def create_department(
    request: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(allow_admin)
):

    department = Department(
        name=request.name,
        description=request.description
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


@router.post("/categories")
def create_category(
    request: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(allow_admin)
):

    category = AssetCategory(
        name=request.name,
        description=request.description
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.put("/promote/{user_id}")
def promote_user(
    user_id: str,
    request: PromoteUserRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_admin)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.role = UserRole(request.role)

    if request.department_id:
        user.department_id = request.department_id

    db.commit()

    return {
        "message": "User promoted successfully"
    }