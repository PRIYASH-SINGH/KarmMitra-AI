// Centralized mock dataset for KarmMitra AI — Institutional Admin dashboard.
// This is the single source of truth for demo data. adminClient.js falls
// back to this shape whenever GET /api/v1/admin/analytics is unreachable,
// so every page reads through one of the exported slices below rather than
// hardcoding numbers into components.

export const ASSESSMENT_CYCLES = ['2026 Q1 Cycle', '2025 Q4 Cycle', '2025 Q3 Cycle'];

export const DIVISIONS = [
  { code: 'FOD', name: 'Field Operations Division' },
  { code: 'SDRD', name: 'Survey Design & Research Division' },
  { code: 'NAD', name: 'National Accounts Division' },
  { code: 'NSSTA', name: 'Training Wing' },
];

export const STATES = [
  'Uttar Pradesh',
  'Maharashtra',
  'Bihar',
  'Tamil Nadu',
  'West Bengal',
  'Rajasthan',
];

export const READINESS_STATUSES = ['Optimal', 'Review Needed', 'Critical Gap'];

export const KPI_SUMMARY = {
  totalAssessed: 12480,
  averageReadiness: 68.4,
  criticalSkillGaps: 3,
  nsstaWorkshopsScheduled: 24,
};

// Per-KPI drill-down content shown in the detail drawer opened from Overview.
export const KPI_DETAILS = {
  totalAssessed: {
    label: 'Total assessed',
    summary: '12,480 officials have completed at least the baseline diagnostic triage this cycle.',
    unit: 'count',
    breakdown: [
      { label: 'Field Operations Division', value: 4980 },
      { label: 'Survey Design & Research Division', value: 3120 },
      { label: 'National Accounts Division', value: 2860 },
      { label: 'NSSTA Training Wing', value: 1520 },
    ],
  },
  averageReadiness: {
    label: 'Average readiness',
    summary: 'National average sits at 68.4%, up 4.1 points from the previous assessment cycle.',
    unit: 'percent',
    breakdown: [
      { label: '2025 Q3 Cycle', value: 61.2 },
      { label: '2025 Q4 Cycle', value: 64.3 },
      { label: '2026 Q1 Cycle', value: 68.4 },
    ],
  },
  criticalSkillGaps: {
    label: 'Critical skill gaps',
    summary: '3 competency domains are more than 25 points below their required threshold nationally.',
    unit: 'points',
    breakdown: [
      { label: 'Data Cleaning (R/Python)', value: 38 },
      { label: 'Survey Sampling', value: 32 },
      { label: 'CAPI Data Entry', value: 23 },
    ],
  },
  nsstaWorkshopsScheduled: {
    label: 'Scheduled workshops',
    summary: '24 collaborative NSSTA workshops are scheduled against the 20% pathway allocation.',
    unit: 'count',
    breakdown: [
      { label: 'This month', value: 9 },
      { label: 'Next month', value: 11 },
      { label: 'Pending confirmation', value: 4 },
    ],
  },
};

export const KCM_COMPETENCIES = [
  {
    code: 'KCM_FUNC_STAT_04',
    subject: 'CAPI Data Entry',
    domain: 'Functional',
    required: 85,
    current: 62,
    affectedStaff: 2140,
    recommendedTraining: 'CAPI Field Refresher (70% experiential — live survey shadowing)',
  },
  {
    code: 'KCM_FUNC_STAT_11',
    subject: 'Survey Sampling',
    domain: 'Functional',
    required: 80,
    current: 48,
    affectedStaff: 2610,
    recommendedTraining: 'Sampling Design Workshop (20% collaborative — NSSTA cohort)',
  },
  {
    code: 'KCM_FUNC_ECO_02',
    subject: 'Index Theory (CPI/IIP)',
    domain: 'Functional',
    required: 75,
    current: 70,
    affectedStaff: 640,
    recommendedTraining: 'Index Methodology Refresher (10% formal — iGOT module)',
  },
  {
    code: 'KCM_FUNC_TECH_07',
    subject: 'Data Cleaning (R/Python)',
    domain: 'Functional',
    required: 90,
    current: 52,
    affectedStaff: 3020,
    recommendedTraining: 'Applied Data Cleaning Bootcamp (70% experiential — live dataset audits)',
  },
  {
    code: 'KCM_BEH_GOV_01',
    subject: 'Ethical Governance',
    domain: 'Behavioural',
    required: 80,
    current: 84,
    affectedStaff: 0,
    recommendedTraining: 'No action — exceeds threshold',
  },
  {
    code: 'KCM_FUNC_FIELD_03',
    subject: 'Field Administration',
    domain: 'Functional',
    required: 70,
    current: 76,
    affectedStaff: 0,
    recommendedTraining: 'No action — exceeds threshold',
  },
];

export const DIVISION_READINESS = [
  {
    code: 'FOD',
    name: 'Field Operations Division',
    proficient: 4200,
    needTraining: 2100,
    readinessPercent: 67,
    trainingDemand: 'High — CAPI and sampling gaps concentrated in junior field staff',
  },
  {
    code: 'SDRD',
    name: 'Survey Design & Research Division',
    proficient: 1800,
    needTraining: 950,
    readinessPercent: 65,
    trainingDemand: 'Moderate — sampling methodology refreshers needed statewide',
  },
  {
    code: 'NAD',
    name: 'National Accounts Division',
    proficient: 1400,
    needTraining: 400,
    readinessPercent: 78,
    trainingDemand: 'Low — index theory gap limited to newer recruits',
  },
  {
    code: 'NSSTA',
    name: 'Training Wing',
    proficient: 890,
    needTraining: 120,
    readinessPercent: 88,
    trainingDemand: 'Low — trainer cohort already exceeds baseline',
  },
];

export const STATE_READINESS = [
  {
    state: 'Uttar Pradesh',
    totalStaff: 1840,
    completionRate: 78,
    readiness: 74,
    criticalGaps: 1,
    status: 'Optimal',
  },
  {
    state: 'Maharashtra',
    totalStaff: 1420,
    completionRate: 64,
    readiness: 60,
    criticalGaps: 2,
    status: 'Review Needed',
  },
  {
    state: 'Bihar',
    totalStaff: 1120,
    completionRate: 52,
    readiness: 46,
    criticalGaps: 3,
    status: 'Critical Gap',
  },
  {
    state: 'Tamil Nadu',
    totalStaff: 980,
    completionRate: 88,
    readiness: 82,
    criticalGaps: 0,
    status: 'Optimal',
  },
  {
    state: 'West Bengal',
    totalStaff: 860,
    completionRate: 71,
    readiness: 66,
    criticalGaps: 1,
    status: 'Review Needed',
  },
  {
    state: 'Rajasthan',
    totalStaff: 790,
    completionRate: 45,
    readiness: 41,
    criticalGaps: 3,
    status: 'Critical Gap',
  },
];

// Extra per-state detail shown in the state drawer, keyed by state name.
export const STATE_DETAILS = {
  'Uttar Pradesh': {
    topGap: 'Survey Sampling',
    workshopsHeld: 6,
    nextWorkshop: '2026-10-02',
    note: 'On track — one division (FOD) trailing slightly behind the state average.',
  },
  Maharashtra: {
    topGap: 'Data Cleaning (R/Python)',
    workshopsHeld: 4,
    nextWorkshop: '2026-09-18',
    note: 'Two field circles flagged for accelerated CAPI refreshers.',
  },
  Bihar: {
    topGap: 'CAPI Data Entry',
    workshopsHeld: 2,
    nextWorkshop: '2026-09-12',
    note: 'Escalated to NSSTA — three competency domains below critical threshold.',
  },
  'Tamil Nadu': {
    topGap: 'Index Theory (CPI/IIP)',
    workshopsHeld: 8,
    nextWorkshop: '2026-11-05',
    note: 'Best-performing bureau this cycle; being studied as a model rollout.',
  },
  'West Bengal': {
    topGap: 'Survey Sampling',
    workshopsHeld: 5,
    nextWorkshop: '2026-10-20',
    note: 'Stable, moderate gap in SDRD-aligned staff.',
  },
  Rajasthan: {
    topGap: 'Data Cleaning (R/Python)',
    workshopsHeld: 1,
    nextWorkshop: '2026-09-09',
    note: 'Lowest completion rate nationally — prioritized for Phase 1 pilot support.',
  },
};

export const TRAINING_THROUGHPUT = {
  kpi: {
    workshopsScheduled: 24,
    workshopsCompleted: 15,
    staffEnrolled: 5400,
    staffCompleted: 3680,
    completionRate: 68,
  },
  monthly: [
    { month: 'Apr', scheduled: 3, completed: 3, enrolled: 620, completedStaff: 540 },
    { month: 'May', scheduled: 4, completed: 4, enrolled: 780, completedStaff: 690 },
    { month: 'Jun', scheduled: 4, completed: 3, enrolled: 810, completedStaff: 610 },
    { month: 'Jul', scheduled: 5, completed: 3, enrolled: 940, completedStaff: 640 },
    { month: 'Aug', scheduled: 4, completed: 2, enrolled: 860, completedStaff: 520 },
    { month: 'Sep', scheduled: 4, completed: 0, enrolled: 1390, completedStaff: 680 },
  ],
  workshops: [
    { name: 'CAPI Field Refresher — Batch 4', division: 'FOD', date: '2026-09-12', status: 'Scheduled' },
    { name: 'Sampling Design Workshop — Batch 2', division: 'SDRD', date: '2026-09-18', status: 'Scheduled' },
    { name: 'Applied Data Cleaning Bootcamp — Batch 1', division: 'FOD', date: '2026-08-30', status: 'Completed' },
    { name: 'Index Methodology Refresher', division: 'NAD', date: '2026-08-22', status: 'Completed' },
    { name: 'Trainer Cohort Certification', division: 'NSSTA', date: '2026-09-25', status: 'Scheduled' },
  ],
};

// Rows = competencies, columns = divisions. Cell status drives the matrix.
export const COMPETENCY_MATRIX = {
  divisions: ['FOD', 'SDRD', 'NAD', 'NSSTA'],
  rows: [
    { competency: 'CAPI Data Entry', cells: { FOD: 'Critical', SDRD: 'Needs Training', NAD: 'Proficient', NSSTA: 'Proficient' } },
    { competency: 'Survey Sampling', cells: { FOD: 'Needs Training', SDRD: 'Critical', NAD: 'Developing', NSSTA: 'Proficient' } },
    { competency: 'Index Theory (CPI/IIP)', cells: { FOD: 'Proficient', SDRD: 'Developing', NAD: 'Needs Training', NSSTA: 'Proficient' } },
    { competency: 'Data Cleaning (R/Python)', cells: { FOD: 'Critical', SDRD: 'Needs Training', NAD: 'Developing', NSSTA: 'Developing' } },
    { competency: 'Ethical Governance', cells: { FOD: 'Proficient', SDRD: 'Proficient', NAD: 'Proficient', NSSTA: 'Proficient' } },
    { competency: 'Field Administration', cells: { FOD: 'Proficient', SDRD: 'Developing', NAD: 'Proficient', NSSTA: 'Proficient' } },
  ],
};

export const GOVERNANCE_ALERTS = [
  {
    id: 'alert-1',
    severity: 'critical',
    title: 'Critical competency gap — Data Cleaning (R/Python)',
    description: 'FOD and SDRD both fall in the "Critical" band for this competency this cycle.',
    linkType: 'competency',
    linkId: 'KCM_FUNC_TECH_07',
  },
  {
    id: 'alert-2',
    severity: 'critical',
    title: 'Bihar readiness below threshold',
    description: 'State readiness at 46%, the lowest of any bureau, with 3 active critical gaps.',
    linkType: 'state',
    linkId: 'Bihar',
  },
  {
    id: 'alert-3',
    severity: 'warning',
    title: 'Training completion below target',
    description: 'September throughput is trailing — 0 of 4 scheduled workshops completed so far.',
    linkType: 'training',
    linkId: null,
  },
  {
    id: 'alert-4',
    severity: 'warning',
    title: 'SDRD requires intervention',
    description: 'Division readiness at 65%, driven by a persistent Survey Sampling gap.',
    linkType: 'division',
    linkId: 'SDRD',
  },
];

export const REPORTS = [
  {
    id: 'report-institutional',
    title: 'Institutional Readiness Report',
    description: 'Full-cycle summary across all divisions and states, formatted for MoSPI leadership review.',
  },
  {
    id: 'report-state',
    title: 'State/UT Readiness Report',
    description: 'Per-bureau completion rates, readiness scores, and critical-gap counts.',
  },
  {
    id: 'report-competency',
    title: 'Competency Gap Report',
    description: 'KCM-by-KCM breakdown of required vs. current levels with affected staff counts.',
  },
  {
    id: 'report-division',
    title: 'Division Training Report',
    description: 'FOD, SDRD, NAD and NSSTA training demand and recommended pathway allocation.',
  },
  {
    id: 'report-throughput',
    title: 'Training Throughput Report',
    description: 'Monthly workshop and enrollment trends against the 70:20:10 pathway targets.',
  },
];

export const buildMockAnalytics = () => ({
  kpi: KPI_SUMMARY,
  kpiDetails: KPI_DETAILS,
  kcmRadar: KCM_COMPETENCIES.map(({ subject, required, current }) => ({ subject, required, current })),
  kcmCompetencies: KCM_COMPETENCIES,
  divisionData: DIVISION_READINESS,
  stateRankings: STATE_READINESS,
  stateDetails: STATE_DETAILS,
  trainingThroughput: TRAINING_THROUGHPUT,
  competencyMatrix: COMPETENCY_MATRIX,
  alerts: GOVERNANCE_ALERTS,
  reports: REPORTS,
  filterOptions: {
    states: STATES,
    divisions: DIVISIONS,
    competencies: KCM_COMPETENCIES.map((c) => c.subject),
    cycles: ASSESSMENT_CYCLES,
    statuses: READINESS_STATUSES,
  },
});
