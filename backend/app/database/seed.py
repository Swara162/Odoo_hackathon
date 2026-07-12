from app.database.database import SessionLocal
from app.models.user import User
from app.core.enums import UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

db = SessionLocal()

admin = db.query(User).filter(
    User.email == "admin@assetflow.com"
).first()

if not admin:

    admin = User(
        full_name="System Administrator",
        email="admin@assetflow.com",
        password=pwd_context.hash("Admin@123"),
        role=UserRole.ADMIN,
        is_active=True
    )

    db.add(admin)

    db.commit()

    print("Admin Created")

else:

    print("Admin Already Exists")

db.close()