import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.frac import FRACRole, RoleCompetencyMapping
from app.models.kcm import KCMCompetency
from app.models.user import OfficialProfile, AssessmentResult
from app.models.triage import TriageQuestion


async def seed_initial_data():
    """
    INTENT: Run during FastAPI lifespan startup to populate the database
    with essential mock MoSPI data if the tables are completely empty.
    
    WHY: This ensures the system is instantly demo-ready for SIH judges 
    the moment `docker compose up` is executed, avoiding manual SQL scripts.
    Guarantees full idempotency on fresh, partial, or existing databases.
    """
    async with AsyncSessionLocal() as db:
        print("Checking and seeding MoSPI FRAC and KCM initial data...")

        # 1. Create KCM Competencies idempotently
        initial_competencies = [
            KCMCompetency(
                competency_code="KCM_FUNC_STAT_04", 
                name="CAPI Data Collection", 
                domain="Functional", 
                baseline_threshold=75.0
            ),
            KCMCompetency(
                competency_code="KCM_FUNC_SURVEY_02", 
                name="Survey Sampling", 
                domain="Functional", 
                baseline_threshold=80.0
            ),
            KCMCompetency(
                competency_code="KCM_DOM_INDEX_01", 
                name="Index Theory (CPI/IIP)", 
                domain="Domain", 
                baseline_threshold=70.0
            ),
            KCMCompetency(
                competency_code="KCM_BEH_ETHICS_03", 
                name="Ethical Governance", 
                domain="Behavioural", 
                baseline_threshold=80.0
            ),
            KCMCompetency(
                competency_code="KCM_TECH_DATA_01", 
                name="Data Processing & Statistical Programming (R / Python)", 
                domain="Technical", 
                baseline_threshold=80.0
            ),
            KCMCompetency(
                competency_code="KCM_TECH_GIS_02", 
                name="GIS & Spatial Sampling Mapping", 
                domain="Technical", 
                baseline_threshold=75.0
            ),
            KCMCompetency(
                competency_code="KCM_GOV_CYBER_01", 
                name="Cybersecurity & Data Privacy in Official Statistics", 
                domain="Digital Governance", 
                baseline_threshold=85.0
            ),
            KCMCompetency(
                competency_code="KCM_GOV_EGOV_02", 
                name="e-Governance & Digital Workflow Systems", 
                domain="Digital Governance", 
                baseline_threshold=75.0
            ),
        ]

        for comp in initial_competencies:
            existing = await db.execute(
                select(KCMCompetency).where(KCMCompetency.competency_code == comp.competency_code)
            )
            if not existing.scalars().first():
                db.add(comp)
        
        await db.flush()

        # 2. Create FRAC Roles idempotently
        initial_roles = [
            FRACRole(
                role_code="MOSPI_FOD_INV_01",
                role_title="Statistical Field Investigator",
                division="Field Operations Division (FOD)",
                description="Primary data collection using CAPI in rural and urban blocks."
            ),
            FRACRole(
                role_code="MOSPI_SDRD_ANL_02",
                role_title="Survey Design Analyst",
                division="Survey Design & Research Division (SDRD)",
                description="Designs UFS frames and sampling methodologies."
            ),
            FRACRole(
                role_code="MOSPI_NAD_ECO_01",
                role_title="National Accounts Economist",
                division="National Accounts Division (NAD)",
                description="Calculates GDP and manages CPI indices."
            ),
        ]

        for role in initial_roles:
            existing_role = await db.execute(
                select(FRACRole).where(FRACRole.role_code == role.role_code)
            )
            if not existing_role.scalars().first():
                db.add(role)

        await db.flush()

        # 3. Create Role-Competency Mappings idempotently
        roles_res = await db.execute(select(FRACRole))
        role_map = {r.role_code: r for r in roles_res.scalars().all()}

        comps_res = await db.execute(select(KCMCompetency))
        comp_map = {c.competency_code: c for c in comps_res.scalars().all()}

        mapping_defs = [
            ("MOSPI_FOD_INV_01", "KCM_FUNC_STAT_04", 4),
            ("MOSPI_FOD_INV_01", "KCM_FUNC_SURVEY_02", 2),
            ("MOSPI_SDRD_ANL_02", "KCM_FUNC_SURVEY_02", 5),
            ("MOSPI_SDRD_ANL_02", "KCM_DOM_INDEX_01", 3),
            ("MOSPI_NAD_ECO_01", "KCM_DOM_INDEX_01", 5),
            ("MOSPI_NAD_ECO_01", "KCM_BEH_ETHICS_03", 4),
        ]

        for role_code, comp_code, req_prof in mapping_defs:
            role_obj = role_map.get(role_code)
            comp_obj = comp_map.get(comp_code)
            if role_obj and comp_obj:
                existing_map = await db.execute(
                    select(RoleCompetencyMapping).where(
                        RoleCompetencyMapping.role_id == role_obj.id,
                        RoleCompetencyMapping.competency_id == comp_obj.id
                    )
                )
                if not existing_map.scalars().first():
                    db.add(RoleCompetencyMapping(
                        role_id=role_obj.id,
                        competency_id=comp_obj.id,
                        required_proficiency=req_prof
                    ))

        await db.flush()

        # 4. Create Baseline Official Profile (MOSPI_OFFICER_002) idempotently
        user1_check = await db.execute(
            select(OfficialProfile).where(OfficialProfile.user_id == "MOSPI_OFFICER_002")
        )
        if not user1_check.scalars().first():
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

        # 5. Create Triage Questions idempotently
        triage_check = await db.execute(select(TriageQuestion).limit(1))
        if not triage_check.scalars().first():
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
            await db.flush()

        # 6. Seed ~25 realistic Assessments for Admin Dashboard SQL aggregations
        all_comps_res = await db.execute(select(KCMCompetency))
        all_competencies = list(all_comps_res.scalars().all())

        seed_user_check = await db.execute(
            select(OfficialProfile).where(OfficialProfile.user_id == "MOSPI_SEED_001")
        )
        if not seed_user_check.scalars().first() and all_competencies:
            divisions = ["FOD (Field Operations)", "SDRD (Survey Design)", "NAD (National Accounts)", "NSSTA (Training Wing)"]
            states = ["Uttar Pradesh", "Maharashtra", "Bihar", "Tamil Nadu", "Delhi"]
            
            mock_assessments = []
            for i in range(1, 26):
                uid = f"MOSPI_SEED_{i:03d}"
                prof_res = await db.execute(select(OfficialProfile).where(OfficialProfile.user_id == uid))
                profile = prof_res.scalars().first()
                if not profile:
                    profile = OfficialProfile(
                        user_id=uid,
                        name=f"Official {i}",
                        email=f"official{i}@mospi.gov.in",
                        frac_role_code="MOSPI_FOD_INV_01" if i % 2 == 0 else "MOSPI_SDRD_ANL_02",
                        division=random.choice(divisions),
                        state=random.choice(states),
                        triage_completed=True,
                        triage_score=random.uniform(40.0, 95.0)
                    )
                    db.add(profile)
                    await db.flush()
                
                # Check if assessment records already exist for this user
                existing_ar = await db.execute(
                    select(AssessmentResult).where(AssessmentResult.user_id == uid).limit(1)
                )
                if not existing_ar.scalars().first():
                    for _ in range(random.randint(1, 2)):
                        comp = random.choice(all_competencies)
                        score = random.uniform(50.0, 100.0)
                        status = random.choice(["success", "success", "success", "pending", "failed"])
                        ar = AssessmentResult(
                            user_id=profile.user_id,
                            competency_id=comp.id,
                            score=score,
                            ags_passback_status=status
                        )
                        mock_assessments.append(ar)

            if mock_assessments:
                db.add_all(mock_assessments)

        await db.commit()
        print("Initial data seeding completed successfully.")
