from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.audit_item import AuditItem
from app.models.maintenance_request import MaintenanceRequest
from app.models.asset import Asset, AssetStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.booking import Booking
from app.models.department import Department
from app.models.asset_category import AssetCategory

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/audit")
def audit_report(
    db: Session = Depends(get_db)
):
    return db.query(
        AuditItem
    ).all()


@router.get("/maintenance")
def maintenance_report(
    db: Session = Depends(get_db)
):
    return db.query(
        MaintenanceRequest
    ).all()


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db)
):
    total_assets = db.query(Asset).count()
    total_cost = db.query(func.sum(Asset.purchase_cost)).scalar() or 0.0
    active_allocations = db.query(Allocation).filter(Allocation.allocation_status == AllocationStatus.ACTIVE).count()
    maintenance_assets = db.query(Asset).filter(Asset.status == AssetStatus.UNDER_MAINTENANCE).count()
    maintenance_rate = (maintenance_assets / total_assets * 100) if total_assets > 0 else 0.0
    avg_health_score = db.query(func.avg(Asset.health_score)).scalar() or 100.0

    return {
        "total_assets": total_assets,
        "total_value": float(total_cost),
        "active_allocations": active_allocations,
        "maintenance_rate": round(maintenance_rate, 2),
        "average_health_score": round(avg_health_score, 2)
    }


@router.get("/charts")
def get_charts_data(
    db: Session = Depends(get_db)
):
    categories = db.query(AssetCategory.name, func.count(Asset.id)).join(Asset).group_by(AssetCategory.name).all()
    statuses = db.query(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()
    conditions = db.query(Asset.condition, func.count(Asset.id)).group_by(Asset.condition).all()

    return {
        "by_category": {cat: count for cat, count in categories},
        "by_status": {stat.value: count for stat, count in statuses},
        "by_condition": {cond.value: count for cond, count in conditions}
    }


@router.get("/utilization")
def get_utilization(
    db: Session = Depends(get_db)
):
    total_assets = db.query(Asset).count()
    allocated_assets = db.query(Asset).filter(Asset.status == AssetStatus.ALLOCATED).count()
    overall_utilization = (allocated_assets / total_assets * 100) if total_assets > 0 else 0.0

    categories = db.query(AssetCategory.id, AssetCategory.name).all()
    category_utilization = []
    for cat_id, cat_name in categories:
        cat_total = db.query(Asset).filter(Asset.category_id == cat_id).count()
        cat_allocated = db.query(Asset).filter(Asset.category_id == cat_id, Asset.status == AssetStatus.ALLOCATED).count()
        rate = (cat_allocated / cat_total * 100) if cat_total > 0 else 0.0
        category_utilization.append({
            "category": cat_name,
            "total": cat_total,
            "allocated": cat_allocated,
            "utilization_rate": round(rate, 2)
        })

    return {
        "overall_utilization_rate": round(overall_utilization, 2),
        "category_wise": category_utilization
    }


@router.get("/department-summary")
def get_department_summary(
    db: Session = Depends(get_db)
):
    departments = db.query(Department.id, Department.name).all()
    summary = []
    for dept_id, dept_name in departments:
        asset_count = db.query(Asset).filter(Asset.department_id == dept_id).count()
        total_cost = db.query(func.sum(Asset.purchase_cost)).filter(Asset.department_id == dept_id).scalar() or 0.0
        active_alloc = db.query(Allocation).join(Asset).filter(
            Asset.department_id == dept_id,
            Allocation.allocation_status == AllocationStatus.ACTIVE
        ).count()

        summary.append({
            "department": dept_name,
            "asset_count": asset_count,
            "total_value": float(total_cost),
            "active_allocations": active_alloc
        })
    return summary


@router.get("/heatmap")
def get_booking_heatmap(
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).all()
    heatmap = {}
    for d in range(7):
        heatmap[d] = {h: 0 for h in range(24)}

    for b in bookings:
        day = b.booking_date.weekday()
        hour = b.start_time.hour
        heatmap[day][hour] += 1

    formatted = []
    for d in range(7):
        for h in range(24):
            if heatmap[d][h] > 0:
                formatted.append({
                    "day_of_week": d,
                    "hour": h,
                    "count": heatmap[d][h]
                })
    return formatted