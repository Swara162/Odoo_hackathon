import os
import sys
from datetime import date, timedelta
from decimal import Decimal
from passlib.context import CryptContext

# Set python path to backend root to make local imports work
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.database.database import SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.asset_category import AssetCategory
from app.models.asset import Asset
from app.core.enums import AssetStatus, AssetCondition

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def seed_database():
    db = SessionLocal()
    try:
        print("Starting Database Seeding...")

        # 1. Ensure Admin User
        admin = db.query(User).filter(User.email == "admin@assetflow.com").first()
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
            db.refresh(admin)
            print("Created Admin User")
        else:
            print("Admin User already exists")

        # 2. Ensure Departments
        departments_data = [
            {"name": "Engineering", "description": "Software, infrastructure, and hardware engineering"},
            {"name": "Marketing", "description": "Growth, branding, and creative design"},
            {"name": "Sales", "description": "Customer relations and business development"},
            {"name": "Human Resources", "description": "Talent acquisition and employee experience"},
            {"name": "Operations", "description": "Daily logistical operations and support"}
        ]
        
        dept_map = {}
        for d_data in departments_data:
            dept = db.query(Department).filter(Department.name == d_data["name"]).first()
            if not dept:
                dept = Department(name=d_data["name"], description=d_data["description"])
                db.add(dept)
                db.commit()
                db.refresh(dept)
                print(f"Created Department: {dept.name}")
            dept_map[dept.name] = dept.id

        # 3. Ensure Asset Categories
        categories_data = [
            {"name": "Laptops", "description": "Workstations, ultrabooks, and developmental laptops"},
            {"name": "Monitors", "description": "Desktop monitors and dual display setups"},
            {"name": "Mobile Devices", "description": "Test smartphones, tablets, and testing hardware"},
            {"name": "Servers", "description": "Rack servers and localized dev servers"},
            {"name": "Office Equipment", "description": "Projectors, printers, and meeting room displays"}
        ]
        
        cat_map = {}
        for c_data in categories_data:
            cat = db.query(AssetCategory).filter(AssetCategory.name == c_data["name"]).first()
            if not cat:
                cat = AssetCategory(name=c_data["name"], description=c_data["description"])
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"Created Asset Category: {cat.name}")
            cat_map[cat.name] = cat.id

        # 4. Ensure some additional users under departments
        employees_data = [
            {"full_name": "Priya Sharma", "email": "priya.sharma@company.com", "role": UserRole.DEPARTMENT_HEAD, "dept": "Engineering"},
            {"full_name": "Rohan Das", "email": "rohan.das@company.com", "role": UserRole.ASSET_MANAGER, "dept": "Operations"},
            {"full_name": "Sneha Reddy", "email": "sneha.reddy@company.com", "role": UserRole.EMPLOYEE, "dept": "Marketing"}
        ]
        
        for emp_data in employees_data:
            emp = db.query(User).filter(User.email == emp_data["email"]).first()
            if not emp:
                emp = User(
                    full_name=emp_data["full_name"],
                    email=emp_data["email"],
                    password=pwd_context.hash("Employee@123"),
                    role=emp_data["role"],
                    is_active=True,
                    department_id=dept_map[emp_data["dept"]]
                )
                db.add(emp)
                db.commit()
                print(f"Created User: {emp.full_name} ({emp.role.name})")

        # 5. Ensure Assets
        assets_data = [
            {
                "asset_tag": "AF-0001",
                "name": 'MacBook Pro 16" M3',
                "serial_number": "C02F87XMD6F2",
                "purchase_date": date.today() - timedelta(days=120),
                "purchase_cost": Decimal("2499.99"),
                "location": "HQ - Floor 3 - Engineering",
                "health_score": 98,
                "bookable": False,
                "status": AssetStatus.ALLOCATED,
                "condition": AssetCondition.EXCELLENT,
                "category": "Laptops",
                "dept": "Engineering"
            },
            {
                "asset_tag": "AF-0002",
                "name": "Dell UltraSharp 27 Monitor",
                "serial_number": "CN08F79D3B892",
                "purchase_date": date.today() - timedelta(days=200),
                "purchase_cost": Decimal("499.50"),
                "location": "HQ - Floor 3 - Engineering",
                "health_score": 95,
                "bookable": False,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.EXCELLENT,
                "category": "Monitors",
                "dept": "Engineering"
            },
            {
                "asset_tag": "AF-0003",
                "name": "iPad Pro 11-inch",
                "serial_number": "DMPF89D9Q9J5",
                "purchase_date": date.today() - timedelta(days=360),
                "purchase_cost": Decimal("799.00"),
                "location": "HQ - Floor 1 - Design",
                "health_score": 90,
                "bookable": True,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.GOOD,
                "category": "Mobile Devices",
                "dept": "Marketing"
            },
            {
                "asset_tag": "AF-0004",
                "name": "Lenovo ThinkPad P1",
                "serial_number": "PF1A87Y6",
                "purchase_date": date.today() - timedelta(days=90),
                "purchase_cost": Decimal("1850.00"),
                "location": "HQ - Floor 3 - Data Science",
                "health_score": 100,
                "bookable": False,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.EXCELLENT,
                "category": "Laptops",
                "dept": "Engineering"
            },
            {
                "asset_tag": "AF-0005",
                "name": "Dell PowerEdge R750",
                "serial_number": "SVR-DELL-R750-01",
                "purchase_date": date.today() - timedelta(days=500),
                "purchase_cost": Decimal("8450.00"),
                "location": "Data Center - Rack B4",
                "health_score": 85,
                "bookable": False,
                "status": AssetStatus.UNDER_MAINTENANCE,
                "condition": AssetCondition.FAIR,
                "category": "Servers",
                "dept": "Operations"
            },
            {
                "asset_tag": "AF-0006",
                "name": "iPhone 15 Pro Max 256GB",
                "serial_number": "IPH15PM256G",
                "purchase_date": date.today() - timedelta(days=180),
                "purchase_cost": Decimal("1199.00"),
                "location": "HQ - Floor 1 - Design",
                "health_score": 96,
                "bookable": True,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.EXCELLENT,
                "category": "Mobile Devices",
                "dept": "Marketing"
            },
            {
                "asset_tag": "AF-0007",
                "name": "HP LaserJet Enterprise Printer",
                "serial_number": "HPLJENT500",
                "purchase_date": date.today() - timedelta(days=730),
                "purchase_cost": Decimal("1450.00"),
                "location": "HQ - Floor 2 - Common Area",
                "health_score": 75,
                "bookable": False,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.GOOD,
                "category": "Office Equipment",
                "dept": "Operations"
            },
            {
                "asset_tag": "AF-0008",
                "name": "Epson Pro Projector 4K",
                "serial_number": "EPSPRO4K99",
                "purchase_date": date.today() - timedelta(days=400),
                "purchase_cost": Decimal("2100.00"),
                "location": "HQ - Floor 3 - Boardroom",
                "health_score": 92,
                "bookable": True,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.EXCELLENT,
                "category": "Office Equipment",
                "dept": "Marketing"
            },
            {
                "asset_tag": "AF-0009",
                "name": "Sony Alpha 7 IV Camera",
                "serial_number": "SONYA7M4_992",
                "purchase_date": date.today() - timedelta(days=150),
                "purchase_cost": Decimal("2499.00"),
                "location": "HQ - Floor 1 - Media Studio",
                "health_score": 98,
                "bookable": True,
                "status": AssetStatus.ALLOCATED,
                "condition": AssetCondition.EXCELLENT,
                "category": "Mobile Devices",
                "dept": "Marketing"
            },
            {
                "asset_tag": "AF-0010",
                "name": "Logitech MX Master 3S Mouse",
                "serial_number": "LOGMX3S_891",
                "purchase_date": date.today() - timedelta(days=60),
                "purchase_cost": Decimal("99.99"),
                "location": "HQ - Floor 3 - Engineering",
                "health_score": 100,
                "bookable": False,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.EXCELLENT,
                "category": "Office Equipment",
                "dept": "Engineering"
            },
            {
                "asset_tag": "AF-0011",
                "name": "Cisco Catalyst 9300 Switch",
                "serial_number": "CISCOCAT9300_01",
                "purchase_date": date.today() - timedelta(days=800),
                "purchase_cost": Decimal("4500.00"),
                "location": "Data Center - Rack A1",
                "health_score": 88,
                "bookable": False,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.GOOD,
                "category": "Servers",
                "dept": "Operations"
            },
            {
                "asset_tag": "AF-0012",
                "name": 'ASUS ROG Zephyrus G16',
                "serial_number": "ASUSG16_2024",
                "purchase_date": date.today() - timedelta(days=30),
                "purchase_cost": Decimal("1999.00"),
                "location": "HQ - Floor 3 - AI Lab",
                "health_score": 100,
                "bookable": False,
                "status": AssetStatus.AVAILABLE,
                "condition": AssetCondition.EXCELLENT,
                "category": "Laptops",
                "dept": "Engineering"
            }
        ]

        for a_data in assets_data:
            asset = db.query(Asset).filter(Asset.asset_tag == a_data["asset_tag"]).first()
            if not asset:
                asset = Asset(
                    asset_tag=a_data["asset_tag"],
                    name=a_data["name"],
                    serial_number=a_data["serial_number"],
                    purchase_date=a_data["purchase_date"],
                    purchase_cost=a_data["purchase_cost"],
                    location=a_data["location"],
                    health_score=a_data["health_score"],
                    bookable=a_data["bookable"],
                    status=a_data["status"],
                    condition=a_data["condition"],
                    category_id=cat_map[a_data["category"]],
                    department_id=dept_map[a_data["dept"]],
                    created_by=admin.id
                )
                db.add(asset)
                db.commit()
                print(f"Created Asset: {asset.name} ({asset.asset_tag})")

        print("Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()