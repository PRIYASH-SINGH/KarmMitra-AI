from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.frac import FRACRole, RoleCompetencyMapping
from app.models.kcm import KCMCompetency
from app.models.user import OfficialProfile
from app.models.triage import TriageQuestion

async def seed_initial_data():
    """
    INTENT: Run during FastAPI lifespan startup to populate the database
    with essential mock MoSPI data if the tables are completely empty.
    
    WHY: This ensures the system is instantly demo-ready for SIH judges 
    the moment `docker compose up` is executed, avoiding manual SQL scripts.
    """
    async with AsyncSessionLocal() as db:
        # Check if triage questions already exist
        result = await db.execute(select(TriageQuestion).limit(1))
        if result.scalars().first():
            return  # Database is already seeded

        print("Seeding initial MoSPI FRAC and KCM data...")

        # Safely insert competencies if missing
        res = await db.execute(select(KCMCompetency).limit(1))
        comp_exists = res.scalars().first()
        
        if not comp_exists:
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
            mapping1 = RoleCompetencyMapping(role_id=role1.id, competency_id=comp1.id, required_proficiency=4)
            mapping2 = RoleCompetencyMapping(role_id=role1.id, competency_id=comp2.id, required_proficiency=2)
            mapping3 = RoleCompetencyMapping(role_id=role2.id, competency_id=comp2.id, required_proficiency=5)
            mapping4 = RoleCompetencyMapping(role_id=role2.id, competency_id=comp3.id, required_proficiency=3)
            mapping5 = RoleCompetencyMapping(role_id=role3.id, competency_id=comp3.id, required_proficiency=5)
            mapping6 = RoleCompetencyMapping(role_id=role3.id, competency_id=comp4.id, required_proficiency=4)
            
            db.add_all([mapping1, mapping2, mapping3, mapping4, mapping5, mapping6])
            await db.flush()
            
            # 4. Create Mock User Profiles
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
            await db.flush()

        # 5. Create Triage Questions
        # Role 1: MOSPI_FOD_INV_01 (CAPI & Sampling)
        q1_1 = TriageQuestion(
            role_code="MOSPI_FOD_INV_01",
            competency_code="KCM_FUNC_STAT_04",
            question_text="When conducting CAPI data collection in a rural block, what is the primary fallback if the tablet loses GPS sync?",
            options=[
                {"key": "A", "text": "Abandon the survey and return to HQ"},
                {"key": "B", "text": "Use manual paper schedules and sync later"},
                {"key": "C", "text": "Switch the tablet to airplane mode and back"},
                {"key": "D", "text": "Manually select the nearest village from the pre-loaded map"}
            ],
            correct_option="B"
        )
        q1_2 = TriageQuestion(
            role_code="MOSPI_FOD_INV_01",
            competency_code="KCM_FUNC_STAT_04",
            question_text="How should you handle an error indicating 'Invalid Aadhar format' during CAPI entry?",
            options=[
                {"key": "A", "text": "Skip the field and continue"},
                {"key": "B", "text": "Re-verify the document and re-enter strictly as per protocol"},
                {"key": "C", "text": "Enter all zeros"},
                {"key": "D", "text": "Override the validation constraint"}
            ],
            correct_option="B"
        )
        q1_3 = TriageQuestion(
            role_code="MOSPI_FOD_INV_01",
            competency_code="KCM_FUNC_STAT_04",
            question_text="What is the standard procedure for syncing completed schedules at the end of the day?",
            options=[
                {"key": "A", "text": "Connect to office VPN and run full sync"},
                {"key": "B", "text": "Copy files to a USB drive"},
                {"key": "C", "text": "Email the SQLite database to the supervisor"},
                {"key": "D", "text": "Wait for the device to auto-sync over cellular"}
            ],
            correct_option="A"
        )
        q1_4 = TriageQuestion(
            role_code="MOSPI_FOD_INV_01",
            competency_code="KCM_FUNC_SURVEY_02",
            question_text="During an Annual Survey of Unincorporated Sector Enterprises (ASUSE), how must you handle a sampled enterprise unit that has ceased operations?",
            options=[
                {"key": "A", "text": "Replace it immediately with the nearest operational enterprise"},
                {"key": "B", "text": "Mark it as 'Casualty / Zero Production', record verification proof, and strictly avoid substitution"},
                {"key": "C", "text": "Estimate hypothetical production figures based on district average"},
                {"key": "D", "text": "Exclude the unit from the frame and recalculate multipliers manually"}
            ],
            correct_option="B"
        )
        q1_5 = TriageQuestion(
            role_code="MOSPI_FOD_INV_01",
            competency_code="KCM_FUNC_SURVEY_02",
            question_text="Which sampling technique is most appropriate when surveying distinct geographical strata?",
            options=[
                {"key": "A", "text": "Simple Random Sampling"},
                {"key": "B", "text": "Stratified Random Sampling"},
                {"key": "C", "text": "Convenience Sampling"},
                {"key": "D", "text": "Snowball Sampling"}
            ],
            correct_option="B"
        )

        # Role 2: MOSPI_SDRD_ANL_02 (Survey Sampling & Index Theory)
        q2_1 = TriageQuestion(
            role_code="MOSPI_SDRD_ANL_02",
            competency_code="KCM_FUNC_SURVEY_02",
            question_text="What is the primary advantage of a two-stage stratified sampling design in national surveys?",
            options=[
                {"key": "A", "text": "It eliminates non-sampling errors completely"},
                {"key": "B", "text": "It reduces the cost and travel time for field investigators while maintaining precision"},
                {"key": "C", "text": "It ensures every individual has an identical probability of selection without weights"},
                {"key": "D", "text": "It allows the survey to be conducted without a sampling frame"}
            ],
            correct_option="B"
        )
        q2_2 = TriageQuestion(
            role_code="MOSPI_SDRD_ANL_02",
            competency_code="KCM_FUNC_SURVEY_02",
            question_text="How is the ultimate stage unit (USU) multiplier calculated?",
            options=[
                {"key": "A", "text": "Inverse of the product of selection probabilities at all stages"},
                {"key": "B", "text": "Sum of all stratum variances"},
                {"key": "C", "text": "Base weight divided by the non-response rate"},
                {"key": "D", "text": "Population size divided by sample size at the final stage only"}
            ],
            correct_option="A"
        )
        q2_3 = TriageQuestion(
            role_code="MOSPI_SDRD_ANL_02",
            competency_code="KCM_FUNC_SURVEY_02",
            question_text="When addressing frame imperfection in Urban Frame Survey (UFS), what is the recommended protocol?",
            options=[
                {"key": "A", "text": "Discard the block"},
                {"key": "B", "text": "Update the frame during listing and apply post-stratification adjustments"},
                {"key": "C", "text": "Use the outdated frame without adjustments"},
                {"key": "D", "text": "Substitute the block with a rural one"}
            ],
            correct_option="B"
        )
        q2_4 = TriageQuestion(
            role_code="MOSPI_SDRD_ANL_02",
            competency_code="KCM_DOM_INDEX_01",
            question_text="Which formula is primarily used for calculating the Consumer Price Index (CPI) at the elementary aggregate level?",
            options=[
                {"key": "A", "text": "Laspeyres index (Arithmetic mean)"},
                {"key": "B", "text": "Jevons index (Geometric mean)"},
                {"key": "C", "text": "Paasche index"},
                {"key": "D", "text": "Fisher ideal index"}
            ],
            correct_option="B"
        )
        q2_5 = TriageQuestion(
            role_code="MOSPI_SDRD_ANL_02",
            competency_code="KCM_DOM_INDEX_01",
            question_text="What does a base year revision in an economic index primarily achieve?",
            options=[
                {"key": "A", "text": "Reduces the index value to 100 artificially"},
                {"key": "B", "text": "Updates the weighting diagram to reflect current consumption patterns"},
                {"key": "C", "text": "Eliminates inflation completely"},
                {"key": "D", "text": "Increases the nominal GDP figures automatically"}
            ],
            correct_option="B"
        )

        # Role 3: MOSPI_NAD_ECO_01 (Index Theory & Ethical Governance)
        q3_1 = TriageQuestion(
            role_code="MOSPI_NAD_ECO_01",
            competency_code="KCM_DOM_INDEX_01",
            question_text="In the compilation of the Index of Industrial Production (IIP), how are missing production data for a specific item typically treated?",
            options=[
                {"key": "A", "text": "Assumed to be zero"},
                {"key": "B", "text": "Imputed using the growth rate of the item group or historical trends"},
                {"key": "C", "text": "Removed from the index basket"},
                {"key": "D", "text": "Replaced with data from a different sector"}
            ],
            correct_option="B"
        )
        q3_2 = TriageQuestion(
            role_code="MOSPI_NAD_ECO_01",
            competency_code="KCM_DOM_INDEX_01",
            question_text="Which of the following best describes Gross Value Added (GVA) at basic prices?",
            options=[
                {"key": "A", "text": "GDP minus net product taxes"},
                {"key": "B", "text": "Output minus intermediate consumption plus product subsidies minus product taxes"},
                {"key": "C", "text": "Output minus intermediate consumption plus production taxes minus production subsidies"},
                {"key": "D", "text": "Output minus intermediate consumption plus production subsidies minus production taxes"}
            ],
            correct_option="D"
        )
        q3_3 = TriageQuestion(
            role_code="MOSPI_NAD_ECO_01",
            competency_code="KCM_DOM_INDEX_01",
            question_text="Why is the double deflation method preferred in National Accounts?",
            options=[
                {"key": "A", "text": "It is easier to calculate than single deflation"},
                {"key": "B", "text": "It requires less data from enterprises"},
                {"key": "C", "text": "It accurately accounts for differential price movements in inputs and outputs"},
                {"key": "D", "text": "It automatically adjusts for currency exchange rates"}
            ],
            correct_option="C"
        )
        q3_4 = TriageQuestion(
            role_code="MOSPI_NAD_ECO_01",
            competency_code="KCM_BEH_ETHICS_03",
            question_text="If you observe a discrepancy in a major state's reported GDP data right before publication, what is the ethical course of action?",
            options=[
                {"key": "A", "text": "Ignore it to meet the publication deadline"},
                {"key": "B", "text": "Flag the discrepancy immediately to supervisors and halt publication until verified"},
                {"key": "C", "text": "Manually smooth the data to avoid alarming the public"},
                {"key": "D", "text": "Publish it but add a footnote that the data is wrong"}
            ],
            correct_option="B"
        )
        q3_5 = TriageQuestion(
            role_code="MOSPI_NAD_ECO_01",
            competency_code="KCM_BEH_ETHICS_03",
            question_text="According to the Fundamental Principles of Official Statistics, how should statistical agencies treat user access?",
            options=[
                {"key": "A", "text": "Provide early access to government officials only"},
                {"key": "B", "text": "Charge a fee for all statistical releases"},
                {"key": "C", "text": "Ensure impartial and simultaneous access to all users"},
                {"key": "D", "text": "Only release data when it shows positive economic trends"}
            ],
            correct_option="C"
        )

        db.add_all([
            q1_1, q1_2, q1_3, q1_4, q1_5,
            q2_1, q2_2, q2_3, q2_4, q2_5,
            q3_1, q3_2, q3_3, q3_4, q3_5
        ])
        
        await db.commit()
        print("Initial data seeding completed successfully.")
