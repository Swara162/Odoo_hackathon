from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.asset import Asset
from app.models.allocation import Allocation, AllocationStatus
from app.models.transfer_request import TransferRequest
from app.models.maintenance_request import MaintenanceRequest, MaintenanceStatus
from app.core.enums import AssetCondition


def calculate_health_score(db: Session, asset: Asset) -> int:
    # 1. Base Score from Current Condition
    condition_scores = {
        AssetCondition.EXCELLENT: 100,
        AssetCondition.GOOD: 85,
        AssetCondition.FAIR: 70,
        AssetCondition.POOR: 50,
        AssetCondition.DAMAGED: 30,
    }
    
    # Ensure asset.condition is one of the enums or a string matching it
    cond = asset.condition
    if isinstance(cond, str):
        # Convert string to enum if needed
        try:
            cond = AssetCondition(cond)
        except ValueError:
            cond = AssetCondition.EXCELLENT
            
    base_score = condition_scores.get(cond, 100)
    
    # 2. Asset Age Penalty
    age_penalty = 0.0
    if asset.purchase_date:
        age_days = (date.today() - asset.purchase_date).days
        age_years = max(0.0, age_days / 365.25)
        age_penalty = age_years * 5.0  # 5 points per year
        
    # 3. Maintenance Count Penalty
    maintenance_count = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.asset_id == asset.id
    ).count()
    maintenance_penalty = maintenance_count * 5.0  # 5 points per maintenance request
    
    # 4. Damage History Penalty
    # Count maintenance requests that are resolved and mention damage/broken/failed
    damage_count = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.asset_id == asset.id,
        MaintenanceRequest.status == MaintenanceStatus.RESOLVED,
        (
            MaintenanceRequest.remarks.ilike("%damage%") | 
            MaintenanceRequest.remarks.ilike("%broken%") |
            MaintenanceRequest.remarks.ilike("%crash%") |
            MaintenanceRequest.remarks.ilike("%crack%") |
            MaintenanceRequest.remarks.ilike("%fail%") |
            MaintenanceRequest.issue.ilike("%damage%") | 
            MaintenanceRequest.issue.ilike("%broken%")
        )
    ).count()
    damage_penalty = damage_count * 15.0  # 15 points per damage incident
    
    # 5. Late Returns Penalty
    # Count allocations that were returned late, or are currently active and overdue
    today_dt = date.today()
    late_returns_count = db.query(Allocation).filter(
        Allocation.asset_id == asset.id,
        (
            (Allocation.returned_at.isnot(None) & (func.date(Allocation.returned_at) > Allocation.expected_return)) |
            (Allocation.returned_at.is_(None) & (Allocation.expected_return < today_dt) & (Allocation.allocation_status == AllocationStatus.ACTIVE))
        )
    ).count()
    late_return_penalty = late_returns_count * 10.0  # 10 points per late return
    
    # 6. Transfer Frequency Penalty
    transfer_count = db.query(TransferRequest).filter(
        TransferRequest.asset_id == asset.id
    ).count()
    transfer_penalty = transfer_count * 3.0  # 3 points per transfer request
    
    # Compute Final Score
    final_score = base_score - age_penalty - maintenance_penalty - damage_penalty - late_return_penalty - transfer_penalty
    
    # Clamp to [0, 100]
    final_score = max(0, min(100, int(final_score)))
    
    # Update physical health_score in the database if it differs
    if asset.health_score != final_score:
        asset.health_score = final_score
        db.add(asset)
        db.commit()
        db.refresh(asset)
        
    return final_score
