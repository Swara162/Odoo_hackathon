from fastapi import APIRouter, Depends

from app.api.role_checker import RoleChecker

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

allow_admin = RoleChecker(
    ["ADMIN"]
)


@router.get("/dashboard")
def admin_dashboard(
    current_user=Depends(allow_admin)
):

    return {
        "message": f"Welcome {current_user.full_name}"
    }