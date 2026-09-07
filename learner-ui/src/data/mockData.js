// Mock data for KarmMitra AI Learner UI Prototype
// Tailored for Problem Statement 26101 (Mission Karmayogi Competency Assessment)

export const DEFAULT_LEARNER = {
  userId: '123',
  name: 'Rajesh Kumar Sharma',
  roleCode: 'MOSPI_FOD_INV_01',
  roleTitle: 'Field Investigator Grade-II',
  department: 'Field Operations Division (FOD), MoSPI',
  cadre: 'Subordinate Statistical Service (SSS)',
  zone: 'North Zone (Lucknow Regional Office)',
  email: 'rajesh.sharma@mospi.gov.in',
  avatar: 'RS',
};

// Exactly 5 baseline triage questions mapped to civil service competencies
export const BASELINE_TRIAGE_QUESTIONS = [
  {
    id: 1,
    competencyId: 'STAT_SAMPLING',
    competencyName: 'Statistical Sampling & Stratification',
    question:
      'During an Annual Survey of Unincorporated Sector Enterprises (ASUSE), how must you handle a sampled enterprise unit that has ceased operations during the reference period?',
    options: [
      {
        id: 'A',
        text: 'Replace it immediately with the nearest operational enterprise in the same ward without official documentation.',
      },
      {
        id: 'B',
        text: 'Mark it as "Casualty / Zero Production", record verification proof from local informants, and strictly avoid arbitrary substitution.',
      },
      {
        id: 'C',
        text: 'Estimate hypothetical production figures based on the prior quarter’s district average.',
      },
      {
        id: 'D',
        text: 'Exclude the unit from the frame and recalculate sample multipliers manually.',
      },
    ],
    correctOptionId: 'B',
    explanation:
      'Statistical sampling protocols strictly prohibit arbitrary substitution to preserve sample integrity. Inoperative units are coded as casualties.',
  },
  {
    id: 2,
    competencyId: 'CAPI_TOOLS',
    competencyName: 'Digital Survey Tool Operation (CAPI)',
    question:
      'When capturing household schedule data on the CAPI tablet in remote rural pockets lacking cellular network coverage, what is the prescribed protocol?',
    options: [
      {
        id: 'A',
        text: 'Continue data collection offline using encrypted local tablet storage and trigger synchronized batch upload upon reaching network connectivity.',
      },
      {
        id: 'B',
        text: 'Halt all enumeration activities immediately until active 4G/5G signal is restored.',
      },
      {
        id: 'C',
        text: 'Switch to handwritten notes and delete the partially filled digital schedule.',
      },
      {
        id: 'D',
        text: 'Reboot the tablet repeatedly to force cellular handshakes.',
      },
    ],
    correctOptionId: 'A',
    explanation:
      'CAPI solutions are engineered with offline-first local persistence. Encrypted batch sync occurs automatically once connectivity resumes.',
  },
  {
    id: 3,
    competencyId: 'DATA_TRIANGULATION',
    competencyName: 'Data Quality & Field Triangulation',
    question:
      'If a respondent’s declared monthly consumer expenditure conflicts heavily with their verified assets and utility bills, what is the best investigative approach?',
    options: [
      {
        id: 'A',
        text: 'Accept the verbal statement without questioning to minimize interview duration.',
      },
      {
        id: 'B',
        text: 'Politely probe through recall triangulation, verify seasonal lumpy expenditures or agricultural receipts, and record clear explanatory field remarks.',
      },
      {
        id: 'C',
        text: 'Arbitrarily overwrite expenditure with the state median value.',
      },
      {
        id: 'D',
        text: 'Cancel the interview and record the household as uncooperative.',
      },
    ],
    correctOptionId: 'B',
    explanation:
      'Quality enumeration requires respectful triangulation of expenditures, durable acquisitions, and seasonal debt or savings.',
  },
  {
    id: 4,
    competencyId: 'CITIZEN_ETHICS',
    competencyName: 'Citizen Engagement & Ethical Enumeration',
    question:
      'Under the Collection of Statistics Act, when an enterprise owner expresses concern regarding the privacy of their sensitive balance sheet data, how should the investigator respond?',
    options: [
      {
        id: 'A',
        text: 'Assure statutory confidentiality under Section 9 of the Act, clarify that data is solely used for aggregate national statistics, and present official credentials.',
      },
      {
        id: 'B',
        text: 'Warn the respondent of immediate police penalties and statutory fines as the first recourse.',
      },
      {
        id: 'C',
        text: 'Agree to omit all financial metrics and submit a blank financial block.',
      },
      {
        id: 'D',
        text: 'Request neighbouring traders to estimate the enterprise’s turnover.',
      },
    ],
    correctOptionId: 'A',
    explanation:
      'Building citizen trust through legal confidentiality guarantees and empathetic communication is a core civil servant competency.',
  },
  {
    id: 5,
    competencyId: 'SCHEME_INTERPRETATION',
    competencyName: 'Government Guideline & Cadre Rules Interpretation',
    question:
      'In agricultural land classification enumeration, how is "Gross Cropped Area" distinguished from "Net Sown Area"?',
    options: [
      {
        id: 'A',
        text: 'Gross Cropped Area accounts for physical land parcel extent sown multiple times within an agricultural year, whereas Net Sown Area counts each parcel only once.',
      },
      {
        id: 'B',
        text: 'Gross Cropped Area includes forest and pasture lands, while Net Sown Area is restricted to certified irrigated tracts.',
      },
      {
        id: 'C',
        text: 'Both metrics are identical under modern satellite-derived GIS standards.',
      },
      {
        id: 'D',
        text: 'Net Sown Area includes current fallows and waste land, while Gross Cropped Area excludes pulse crops.',
      },
    ],
    correctOptionId: 'A',
    explanation:
      'Net Sown Area measures the physical surface sown, while Gross Cropped Area sums area sown across all harvest seasons (Rabi, Kharif, Zaid).',
  },
];

// Pre-calculated or simulated competency profiles based on triage answers
export const COMPETENCY_DEFINITIONS = {
  STAT_SAMPLING: {
    name: 'Statistical Sampling & Stratification',
    category: 'Domain / Functional',
    description: 'Understanding multi-stage stratification, sample frames, casualty rules, and cluster selection.',
  },
  CAPI_TOOLS: {
    name: 'Digital Survey Tool Operation (CAPI)',
    category: 'Technical',
    description: 'Proficiency with offline tablet data entry, validation checks, GPS tagging, and sync protocols.',
  },
  DATA_TRIANGULATION: {
    name: 'Data Quality & Field Triangulation',
    category: 'Functional',
    description: 'Cross-verifying expenditures against income, assets, and recall periods for high statistical accuracy.',
  },
  CITIZEN_ETHICS: {
    name: 'Citizen Engagement & Ethical Enumeration',
    category: 'Behavioral',
    description: 'Active listening, respecting privacy norms, explaining statutory safeguards, and ethical data collection.',
  },
  SCHEME_INTERPRETATION: {
    name: 'Cadre Rules & Guideline Interpretation',
    category: 'Domain / Functional',
    description: 'Accurate comprehension of definitions, classification manuals, and ministry operational circulars.',
  },
};

// 70:20:10 Pathway cards linked to competencies
export const PATHWAY_CARDS = [
  {
    id: 'pathway-10',
    type: '10_formal',
    typeLabel: '10% Formal Course',
    badgeColor: '#1B4782', // Navy Accent
    icon: 'School',
    title: 'Advanced Sampling Frames & Casualty Protocols (MoSPI Refresher)',
    mappedCompetency: 'Statistical Sampling & Stratification',
    estimatedDuration: '45 mins (Interactive e-Module)',
    provider: 'iGOT Karmayogi Bharat Platform',
    actionText: 'Launch e-Learning Module',
    description:
      'Comprehensive digital masterclass covering ASUSE & PLFS sampling designs, multi-stage stratification, enterprise replacement restrictions, and casualty coding.',
  },
  {
    id: 'pathway-20',
    type: '20_collaborative',
    typeLabel: '20% Collaborative / Peer Workshop',
    badgeColor: '#00796B', // Teal Green
    icon: 'Groups',
    title: 'Regional Field Masterclass & Peer Review Circle',
    mappedCompetency: 'Statistical Sampling & Stratification',
    estimatedDuration: '90 mins (Live Collaborative Circle)',
    provider: 'MoSPI FOD Peer Exchange Network',
    actionText: 'Join Peer Circle',
    description:
      'Participate in a weekly virtual peer circle moderated by Senior Statistical Officers to dissect edge-case field scenarios, ambiguous boundary enterprises, and resolving enumeration conflicts.',
  },
  {
    id: 'pathway-70',
    type: '70_experiential',
    typeLabel: '70% Experiential / On-the-job Activity',
    badgeColor: '#E65100', // Saffron / Orange Accent
    icon: 'Engineering',
    title: 'Simulated Field Audit & Stratified Sample Verification',
    mappedCompetency: 'Statistical Sampling & Stratification',
    estimatedDuration: '3 Hours (Field Simulation Challenge)',
    provider: 'KarmMitra AI Dynamic Sandbox',
    actionText: 'Start Dynamic Assessment',
    description:
      'Hands-on practical challenge: Audit 5 simulated enterprise schedules with subtle intentional errors in listing and stratification. Pinpoint discrepancies and apply correct remedial classifications.',
  },
];

// Comprehensive Dynamic MCQ Question Bank covering all 5 civil service competencies
export const DYNAMIC_QUESTION_BANK = {
  STAT_SAMPLING: [
    {
      id: 101,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 2 - Applied Practice',
      question:
        'In a 2-stage stratified rural sample, if Hamlet Group (HG) selection is required because village population exceeds 1,200, which criterion dictates the number of HGs formed?',
      options: [
        {
          id: 'A',
          text: 'Total geographical acreage of the village boundary regardless of population distribution.',
        },
        {
          id: 'B',
          text: 'Current approximate population bands (e.g., 1,200–1,799 forms 3 HGs, 1,800–2,399 forms 4 HGs) with approximately equal size.',
        },
        {
          id: 'C',
          text: 'Total number of tube-wells and agricultural tractors registered in village records.',
        },
        {
          id: 'D',
          text: 'The investigator can arbitrarily pick any 2 households without forming hamlet groups.',
        },
      ],
      correctOptionId: 'B',
      explanation:
        'Standard NSSO hamlet-group formation methodology requires grouping villages exceeding population thresholds into equal-sized hamlet clusters based on verified current population.',
    },
    {
      id: 102,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 2 - Practical Execution',
      question:
        'During house listing in Sub-Sample 1, you discover that a sampled household has temporarily migrated to another district for 2 months for seasonal agricultural harvesting. How should this be handled?',
      options: [
        {
          id: 'A',
          text: 'Immediately substitute with the next door neighbor who is present.',
        },
        {
          id: 'B',
          text: 'Mark as temporarily absent, attempt contact through family/phone if returning within survey window, or treat as non-contact casualty without ad-hoc substitution.',
        },
        {
          id: 'C',
          text: 'Impute the household schedule by copying data from the nearest relative.',
        },
        {
          id: 'D',
          text: 'Delete the household from the listing schedule.',
        },
      ],
      correctOptionId: 'B',
      explanation:
        'Temporary absence within the survey round does not warrant substitution; standard callback protocol must be attempted before classifying as casualty.',
    },
    {
      id: 103,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 3 - Diagnostic Mastery',
      question:
        'Why is Circular Systematic Sampling (CSS) preferred over Simple Random Sampling Without Replacement (SRSWOR) during on-field household selection from a listed frame?',
      options: [
        {
          id: 'A',
          text: 'It guarantees uniform spatial and socioeconomic representation across the listed ordering while maintaining known sampling intervals.',
        },
        {
          id: 'B',
          text: 'CSS completely eliminates the need for calculating sampling weights or multipliers.',
        },
        {
          id: 'C',
          text: 'CSS allows the field investigator to select their preferred acquaintances first.',
        },
        {
          id: 'D',
          text: 'CSS is only used when the sample size is equal to 1.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Circular systematic sampling spreads selections evenly across the ordered listing frame, capturing latent stratifications across geography or affluence.',
    },
    {
      id: 104,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 2 - Frame Demarcation',
      question:
        'In an Urban Frame Survey (UFS), what is the key criterion used by investigators to identify and demarcate a UFS Block boundary?',
      options: [
        {
          id: 'A',
          text: 'Clearly identifiable permanent physical features (roads, railway tracks, nullahs, prominent structures) enclosing 100–120 households.',
        },
        {
          id: 'B',
          text: 'Imaginary straight lines connecting postal pin code centers.',
        },
        {
          id: 'C',
          text: 'Arbitrary 50-meter radius circles drawn from the investigator transit camp.',
        },
        {
          id: 'D',
          text: 'Informal political party ward divisions that change after municipal polls.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'UFS Blocks are strictly delineated by identifiable permanent natural or man-made terrain boundaries enclosing an optimal cluster of households to prevent boundary confusion.',
    },
    {
      id: 105,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 2 - Second-Stage Stratification',
      question:
        'When stratifying enterprise units in an ASUSE round into "Large" and "Others" second-stage strata (SSS), what metric determines the classification threshold?',
      options: [
        {
          id: 'A',
          text: 'Number of workers engaged (e.g. 10 or more workers with power, 20 without power) or gross annual revenue bands.',
        },
        {
          id: 'B',
          text: 'The physical age of the senior-most enterprise partner.',
        },
        {
          id: 'C',
          text: 'The distance in kilometers from the district headquarters.',
        },
        {
          id: 'D',
          text: 'Whether the firm displays an English sign-board on its facade.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Second-Stage Stratification (SSS) separates dominant large employer units from smaller micro-units using worker count and revenue thresholds to minimize sampling variance.',
    },
    {
      id: 106,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 3 - Activity Drift Protocol',
      question:
        'If a sampled enterprise has changed its main line of economic activity (e.g. shifted from textile tailoring to retail sale of garments) since the listing stage, how should it be recorded?',
      options: [
        {
          id: 'A',
          text: 'Survey the enterprise under its new current economic activity and assign the revised National Industrial Classification (NIC) code, without dropping it.',
        },
        {
          id: 'B',
          text: 'Treat it as an inoperative casualty and abandon the schedule immediately.',
        },
        {
          id: 'C',
          text: 'Force the respondent to fabricate answers as if they were still operating the old tailoring business.',
        },
        {
          id: 'D',
          text: 'Substitute with another textile tailor in an adjacent non-sampled village.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Survey protocols dictate interviewing active sampled units based on their current prevailing economic activity at the time of survey, updating the NIC classification accordingly.',
    },
    {
      id: 107,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 3 - Inferential Bias Control',
      question:
        'What is the primary statistical consequence of an investigator committing non-random ad-hoc substitution of uncontactable households in the field?',
      options: [
        {
          id: 'A',
          text: 'It introduces severe systematic selection bias and destroys the probability-proportional design, invalidating population inferential estimators.',
        },
        {
          id: 'B',
          text: 'It automatically reduces the standard error of the sample estimate to zero.',
        },
        {
          id: 'C',
          text: 'It makes the sample estimate 100% equivalent to a full census.',
        },
        {
          id: 'D',
          text: 'There is zero statistical consequence as long as the substitute household has the same family size.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Non-random ad-hoc substitution violates fundamental sampling theory by giving zero probability to unreachable units and unknown probability to accessible substitutes, causing unquantifiable bias.',
    },
    {
      id: 108,
      competencyId: 'STAT_SAMPLING',
      competencyName: 'Statistical Sampling & Stratification',
      difficulty: 'Level 3 - Multiplier & Sampling Weight',
      question:
        'In multi-stage sampling designs, how is the Multiplier (Sampling Weight) technically calculated for a sampled household?',
      options: [
        {
          id: 'A',
          text: 'As the inverse of the joint probability of selection across all sampling stages (FSU probability × Hamlet Group probability × SSS probability).',
        },
        {
          id: 'B',
          text: 'By dividing total national population by the investigator’s daily interview quota.',
        },
        {
          id: 'C',
          text: 'By multiplying the household’s electricity bill amount by 100.',
        },
        {
          id: 'D',
          text: 'It is a fixed constant of 1.0 for all respondents in the district.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Design weights (multipliers) are mathematically defined as the reciprocal of the overall inclusion probability of the unit across all sampling stages.',
    },
  ],
  CAPI_TOOLS: [
    {
      id: 201,
      competencyId: 'CAPI_TOOLS',
      competencyName: 'Digital Survey Tool Operation (CAPI)',
      difficulty: 'Level 2 - Data Security',
      question:
        'When synchronizing completed encrypted CAPI schedules over public internet networks, which standard protocol prevents man-in-the-middle data interception?',
      options: [
        {
          id: 'A',
          text: 'End-to-end TLS 1.3 encryption with server certificate pinning and HMAC digital signature.',
        },
        {
          id: 'B',
          text: 'Sending plain text CSV files via unencrypted HTTP GET requests.',
        },
        {
          id: 'C',
          text: 'Disabling tablet antivirus to speed up raw packet transfers.',
        },
        {
          id: 'D',
          text: 'Exporting raw SQLite databases to unencrypted micro-SD cards.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Government CAPI protocols enforce TLS 1.3 with cryptographic certificate pinning to safeguard sensitive statistical microdata during transit.',
    },
    {
      id: 202,
      competencyId: 'CAPI_TOOLS',
      competencyName: 'Digital Survey Tool Operation (CAPI)',
      difficulty: 'Level 2 - Fault Tolerance',
      question:
        'If the CAPI tablet abruptly shuts down due to battery exhaustion while saving an enterprise schedule block, how does the SQLite database preserve integrity?',
      options: [
        {
          id: 'A',
          text: 'Through Write-Ahead Logging (WAL) and atomic transactions that roll back uncommitted partial state upon system restart.',
        },
        {
          id: 'B',
          text: 'The entire tablet operating system must be factory reset.',
        },
        {
          id: 'C',
          text: 'All prior schedules collected during the week are permanently corrupted.',
        },
        {
          id: 'D',
          text: 'The investigator must re-enter all household records from memory.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'CAPI database architecture relies on atomic transaction boundaries and WAL journals to ensure zero data corruption during power events.',
    },
    {
      id: 203,
      competencyId: 'CAPI_TOOLS',
      competencyName: 'Digital Survey Tool Operation (CAPI)',
      difficulty: 'Level 3 - Geo-Validation',
      question:
        'What is the prescribed geo-spatial threshold before locking GPS coordinates on a CAPI field schedule?',
      options: [
        {
          id: 'A',
          text: 'Satellite horizontal accuracy reading within 10 meters with at least 4 active GNSS satellite locks.',
        },
        {
          id: 'B',
          text: 'Any approximate cell-tower triangulation regardless of accuracy margin.',
        },
        {
          id: 'C',
          text: 'Investigators should manually type latitude and longitude estimated from memory.',
        },
        {
          id: 'D',
          text: 'GPS locking is purely optional and should be skipped in rural sectors.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Precision sampling standards require GNSS multi-constellation lock with horizontal dilution of precision (HDOP) yielding accuracy under 10m.',
    },
  ],
  DATA_TRIANGULATION: [
    {
      id: 301,
      competencyId: 'DATA_TRIANGULATION',
      competencyName: 'Data Quality & Field Triangulation',
      difficulty: 'Level 2 - Cross-Verification',
      question:
        'When an enterprise respondent reports monthly wage expenditures substantially higher than their reported quarterly turnover, what is the appropriate investigative probe?',
      options: [
        {
          id: 'A',
          text: 'Probe for seasonal operational losses, working capital credit advances, or unbilled work-in-progress, and verify employee muster books.',
        },
        {
          id: 'B',
          text: 'Assume the respondent is misinformed and divide the wage bill by half.',
        },
        {
          id: 'C',
          text: 'Report the enterprise immediately to local police authorities without recording data.',
        },
        {
          id: 'D',
          text: 'Delete the wage entry to make the spreadsheet balance automatically.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Investigative auditing requires respectful probing of credit cycles, inventory accumulation, and seasonal operating margins before finalizing figures.',
    },
    {
      id: 302,
      competencyId: 'DATA_TRIANGULATION',
      competencyName: 'Data Quality & Field Triangulation',
      difficulty: 'Level 2 - Recall Periods',
      question:
        'In Household Consumer Expenditure Surveys (HCES), how are recall periods systematically structured to minimize recall decay?',
      options: [
        {
          id: 'A',
          text: '7-day recall for perishable staples (milk, vegetables), 30-day for consumables, and 365-day recall for infrequent durable goods (clothing, appliances).',
        },
        {
          id: 'B',
          text: '365-day recall uniformly applied across all commodities including salt and vegetables.',
        },
        {
          id: 'C',
          text: 'Only expenditures made during the last 24 hours are recorded.',
        },
        {
          id: 'D',
          text: 'Expenditures are estimated from national macroeconomic averages rather than respondent memory.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Modified Mixed Reference Period (MMRP) is standard in Indian statistical methodology to minimize memory recall decay across diverse item categories.',
    },
    {
      id: 303,
      competencyId: 'DATA_TRIANGULATION',
      competencyName: 'Data Quality & Field Triangulation',
      difficulty: 'Level 3 - Audit Detection',
      question:
        'If a field investigator notes that 10 consecutive enterprise schedules contain identical round-figure entries (e.g. exactly ₹50,000 for rent and wages), what does this statistical signature indicate?',
      options: [
        {
          id: 'A',
          text: 'Suspicion of desk-filling / enumerator fabrication (curb-stoning) requiring immediate supervisory re-interview and validation.',
        },
        {
          id: 'B',
          text: 'Evidence of exceptional macroeconomic market equilibrium in the district.',
        },
        {
          id: 'C',
          text: 'A normal statistical outcome requiring no verification.',
        },
        {
          id: 'D',
          text: 'Compliance with standard government rounding rules.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Identical repeated rounded figures across disparate enterprises are classic indicators of synthetic curbstoning and necessitate supervisory inspection.',
    },
  ],
  CITIZEN_ETHICS: [
    {
      id: 401,
      competencyId: 'CITIZEN_ETHICS',
      competencyName: 'Citizen Engagement & Ethical Enumeration',
      difficulty: 'Level 2 - Legal Protection',
      question:
        'Under Section 9 of the Collection of Statistics Act 2008, what strict protection is guaranteed regarding individual microdata?',
      options: [
        {
          id: 'A',
          text: 'Information furnished by any individual cannot be used as evidence against them in legal or tax proceedings and may only be published as aggregate statistics.',
        },
        {
          id: 'B',
          text: 'Individual schedules can be sold to marketing firms to generate government revenue.',
        },
        {
          id: 'C',
          text: 'Information is made public on open government websites with respondent names and addresses.',
        },
        {
          id: 'D',
          text: 'Any municipal authority can seize the survey schedule to assess local property taxes.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Section 9 ensures absolute statutory confidentiality, which forms the cornerstone of citizen trust in national statistical surveys.',
    },
    {
      id: 402,
      competencyId: 'CITIZEN_ETHICS',
      competencyName: 'Citizen Engagement & Ethical Enumeration',
      difficulty: 'Level 2 - Inclusive Communication',
      question:
        'When conducting an enumeration interview with a non-literate citizen, what is the mandatory ethical protocol for obtaining informed consent?',
      options: [
        {
          id: 'A',
          text: 'Explain the purpose of the study and confidentiality protections in their spoken dialect, ensure voluntary comprehension, and obtain an authorized witness mark.',
        },
        {
          id: 'B',
          text: 'Force the respondent to place a thumb impression on a blank document.',
        },
        {
          id: 'C',
          text: 'Skip obtaining consent because government surveys do not require citizen assent.',
        },
        {
          id: 'D',
          text: 'Exclude non-literate households from the national survey frame entirely.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Ethical governance mandates clear vernacular explanation and voluntary comprehension before obtaining consent.',
    },
    {
      id: 403,
      competencyId: 'CITIZEN_ETHICS',
      competencyName: 'Citizen Engagement & Ethical Enumeration',
      difficulty: 'Level 3 - Field Conflict Resolution',
      question:
        'If a local commercial trade association instructs its member merchants to boycott an official enterprise survey, how should the Senior Investigator resolve the situation?',
      options: [
        {
          id: 'A',
          text: 'Organize a formal liaison meeting with association office-bearers, present gazetted notifications, demonstrate how statistical data drives policy incentives, and engage local administration if required.',
        },
        {
          id: 'B',
          text: 'Abandon the survey in that town and declare all units as hostile.',
        },
        {
          id: 'C',
          text: 'Secretly record enterprise figures by interviewing customers on the street.',
        },
        {
          id: 'D',
          text: 'Invent fictional financial records for all boycotted enterprises.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Stakeholder engagement through diplomatic liaison, gazette notifications, and explaining mutual benefits resolves institutional resistance sustainably.',
    },
  ],
  SCHEME_INTERPRETATION: [
    {
      id: 501,
      competencyId: 'SCHEME_INTERPRETATION',
      competencyName: 'Cadre Rules & Guideline Interpretation',
      difficulty: 'Level 2 - Activity Classification',
      question:
        'In Periodic Labour Force Surveys (PLFS), how is "Current Weekly Status (CWS)" distinguished from "Usual Principal Activity Status (UPSS)"?',
      options: [
        {
          id: 'A',
          text: 'CWS assesses economic activity during the short reference period of the preceding 7 days, whereas UPSS evaluates major time spent over the preceding 365 days.',
        },
        {
          id: 'B',
          text: 'CWS applies only to government employees, whereas UPSS applies to self-employed agriculturalists.',
        },
        {
          id: 'C',
          text: 'Both statuses are identical and measure only formal salaried employment.',
        },
        {
          id: 'D',
          text: 'CWS evaluates retirement benefits, while UPSS evaluates school enrollment.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'CWS captures short-term labor dynamics within the past 7 days, while UPSS captures long-term structural workforce participation over the full year.',
    },
    {
      id: 502,
      competencyId: 'SCHEME_INTERPRETATION',
      competencyName: 'Cadre Rules & Guideline Interpretation',
      difficulty: 'Level 2 - Enterprise Classification',
      question:
        'Under ASUSE classification guidelines, which business entity qualifies as an "Unincorporated Non-Agricultural Enterprise"?',
      options: [
        {
          id: 'A',
          text: 'Proprietary, partnership, and self-help group units operating in manufacturing, trade, or services not registered under the Companies Act 2013.',
        },
        {
          id: 'B',
          text: 'Large publicly listed corporations on the National Stock Exchange.',
        },
        {
          id: 'C',
          text: 'Central Public Sector Enterprises (CPSEs) like Indian Railways.',
        },
        {
          id: 'D',
          text: 'Only cooperative sugar mills operating under state subsidies.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'ASUSE specifically captures the unorganized informal enterprise sector excluding registered joint-stock companies and government undertakings.',
    },
    {
      id: 503,
      competencyId: 'SCHEME_INTERPRETATION',
      competencyName: 'Cadre Rules & Guideline Interpretation',
      difficulty: 'Level 3 - Land Classification Rules',
      question:
        'In land utilization statistics, how is "Current Fallow" technically distinguished from "Other Fallow Land"?',
      options: [
        {
          id: 'A',
          text: 'Current Fallow represents land left uncultivated for only the current agricultural year or less, while Other Fallow has remained uncultivated for between 1 and 5 consecutive years.',
        },
        {
          id: 'B',
          text: 'Current Fallow includes barren rocky mountain slopes, while Other Fallow includes urban residential plots.',
        },
        {
          id: 'C',
          text: 'Both definitions mean agricultural land with standing sugarcane crops.',
        },
        {
          id: 'D',
          text: 'Other Fallow applies only to forest reserve areas.',
        },
      ],
      correctOptionId: 'A',
      explanation:
        'Ministry land records define Current Fallow as land uncultivated for up to 1 year; beyond 1 and up to 5 years is classified as Other Fallow, and beyond 5 years as Culturable Waste.',
    },
  ],
};

// Default dynamic set for backward compatibility
export const DYNAMIC_ASSESSMENT_QUESTIONS = DYNAMIC_QUESTION_BANK.STAT_SAMPLING;

