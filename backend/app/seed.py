from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.frac import FRACRole, RoleCompetencyMapping
from app.models.kcm import KCMCompetency
from app.models.user import OfficialProfile

async def seed_initial_data():
    """
    INTENT: Run during FastAPI lifespan startup to populate the database
    with essential mock MoSPI data if the tables are completely empty.
    
    WHY: This ensures the system is instantly demo-ready for SIH judges 
    the moment `docker compose up` is executed, avoiding manual SQL scripts.
    """
    async with AsyncSessionLocal() as db:
        # Check if data already exists
        result = await db.execute(select(FRACRole).limit(1))
        if result.scalars().first():
            return  # Database is already seeded

        print("Seeding initial MoSPI FRAC and KCM data...")

        # 1. Create KCM Competencies
        comp1 = KCMCompetency(
            competency_code="KCM_FUNC_STAT_04", 
            name="CAPI Data Collection", 
            domain="Functional", 
            baseline_threshold=75.0
        )
        comp2 = KCMCompetency(
            competency_code="KCM_FUNC_SURVEY_02", 
            name="Survey Sampling", 
            domain="Functional", 
            baseline_threshold=80.0
        )
        comp3 = KCMCompetency(
            competency_code="KCM_DOM_INDEX_01", 
            name="Index Theory (CPI/IIP)", 
            domain="Domain", 
            baseline_threshold=70.0
        )
        comp4 = KCMCompetency(
            competency_code="KCM_BEH_ETHICS_03", 
            name="Ethical Governance", 
            domain="Behavioural", 
            baseline_threshold=80.0
        )
        
        db.add_all([comp1, comp2, comp3, comp4])
        await db.flush()
        
        # 2. Create FRAC Roles
        role1 = FRACRole(
            role_code="MOSPI_FOD_INV_01",
            role_title="Statistical Field Investigator",
            division="Field Operations Division (FOD)",
            description="Primary data collection using CAPI in rural and urban blocks."
        )
        role2 = FRACRole(
            role_code="MOSPI_SDRD_ANL_02",
            role_title="Survey Design Analyst",
            division="Survey Design & Research Division (SDRD)",
            description="Designs UFS frames and sampling methodologies."
        )
        role3 = FRACRole(
            role_code="MOSPI_NAD_ECO_01",
            role_title="National Accounts Economist",
            division="National Accounts Division (NAD)",
            description="Calculates GDP and manages CPI indices."
        )
        
        db.add_all([role1, role2, role3])
        await db.flush()
        
        # 3. Create Role-Competency Mappings
        # FOD requires CAPI (level 4) and Survey Sampling (level 2)
        mapping1 = RoleCompetencyMapping(role_id=role1.id, competency_id=comp1.id, required_proficiency=4)
        mapping2 = RoleCompetencyMapping(role_id=role1.id, competency_id=comp2.id, required_proficiency=2)
        
        # SDRD requires Survey Sampling (level 5) and Index Theory (level 3)
        mapping3 = RoleCompetencyMapping(role_id=role2.id, competency_id=comp2.id, required_proficiency=5)
        mapping4 = RoleCompetencyMapping(role_id=role2.id, competency_id=comp3.id, required_proficiency=3)
        
        # NAD requires Index Theory (level 5) and Ethical Governance (level 4)
        mapping5 = RoleCompetencyMapping(role_id=role3.id, competency_id=comp3.id, required_proficiency=5)
        mapping6 = RoleCompetencyMapping(role_id=role3.id, competency_id=comp4.id, required_proficiency=4)
        
        db.add_all([mapping1, mapping2, mapping3, mapping4, mapping5, mapping6])
        await db.flush()
        
        # 4. Create Mock User Profiles (Optional, since auto-upsert handles new logins)
        # We seed one experienced user to ensure Admin Dashboard has *some* data on boot.
        user1 = OfficialProfile(
            user_id="MOSPI_OFFICER_002",
            name="Priyanka Sen",
            email="priyanka.sen@mospi.gov.in",
            frac_role_code="MOSPI_SDRD_ANL_02",
            division="Survey Design & Research Division (SDRD)",
            state="West Bengal",
            triage_completed=True,
            triage_score=85.0
        )
        db.add(user1)
        await db.commit()
        
        print("Initial data seeding completed successfully.")
