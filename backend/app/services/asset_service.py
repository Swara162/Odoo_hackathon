from sqlalchemy.orm import Session

from app.models.asset import Asset


def generate_asset_tag(db: Session):

    count = db.query(Asset).count() + 1

    return f"AF-{count:04d}"