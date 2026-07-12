from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.asset import Asset, AssetStatus
from app.models.allocation import Allocation, AllocationStatus


def allocate_asset(
    db: Session,
    asset: Asset,
    employee_id,
    allocated_by,
    expected_return
):

    allocation = Allocation(
        asset_id=asset.id,
        employee_id=employee_id,
        allocated_by=allocated_by,
        allocated_at=datetime.now(timezone.utc),
        expected_return=expected_return,
        allocation_status=AllocationStatus.ACTIVE
    )

    asset.status = AssetStatus.ALLOCATED

    db.add(allocation)

    db.commit()

    db.refresh(allocation)

    return allocation