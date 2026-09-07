import axios from 'axios';
import {
  DEFAULT_LEARNER,
  BASELINE_TRIAGE_QUESTIONS,
  DYNAMIC_ASSESSMENT_QUESTIONS,
  DYNAMIC_QUESTION_BANK,
  PATHWAY_CARDS,
  COMPETENCY_DEFINITIONS,
} from '../data/mockData';

// Configurable backend base URL (FastAPI / backend server)
const BACKEND_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 2500, // Quick timeout so UI doesn't hang if backend is offline
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Parses query parameters from window.location.search
 * Example: ?user_id=123&role=MOSPI_FOD_INV_01&lineitem=FOD_SURVEY_AUDIT
 */
export function getLearnerProfileFromUrl() {
  if (typeof window === 'undefined') return DEFAULT_LEARNER;

  const params = new URLSearchParams(window.location.search);
  const userId = params.get('user_id');
  const role = params.get('role');
  const lineitem = params.get('lineitem');

  if (!userId && !role) {
    return DEFAULT_LEARNER;
  }

  return {
    ...DEFAULT_LEARNER,
    userId: userId || DEFAULT_LEARNER.userId,
    roleCode: role || DEFAULT_LEARNER.roleCode,
    roleTitle: role === 'MOSPI_FOD_INV_01' ? 'Field Investigator Grade-II' : `Specialist (${role || 'Default'})`,
    lineitem: lineitem || 'National Sample Survey Framework',
    isFromUrlParams: true,
  };
}

/**
 * Fetch 5-question baseline triage
 * Calls GET /api/v1/triage/questions?role={roleCode}
 * Falls back to mock data if backend is offline
 */
export async function fetchTriageQuestions(roleCode, forceMock = false) {
  if (forceMock) {
    return {
      success: true,
      data: BASELINE_TRIAGE_QUESTIONS,
      isMock: true,
      message: 'Loaded via KarmMitra offline mock engine',
    };
  }

  try {
    const response = await apiClient.get(`/api/v1/triage/questions`, {
      params: { role: roleCode },
    });
    return {
      success: true,
      data: response.data?.questions || response.data || BASELINE_TRIAGE_QUESTIONS,
      isMock: false,
      message: 'Successfully fetched from live KarmMitra API backend',
    };
  } catch (err) {
    console.warn('Backend unavailable (http://localhost:8000). Falling back to mock triage data.', err.message);
    return {
      success: true,
      data: BASELINE_TRIAGE_QUESTIONS,
      isMock: true,
      message: 'Backend offline — automatically running in standalone Mock Mode',
    };
  }
}

/**
 * Submit triage assessment answers
 * Calls POST /api/v1/triage/submit
 * Falls back to local scoring algorithm and competency gap identification if backend is offline
 */
export async function submitTriageAnswers(submissionPayload, forceMock = false) {
  if (forceMock) {
    return calculateLocalTriageResult(submissionPayload, true);
  }

  try {
    const response = await apiClient.post(`/api/v1/triage/submit`, submissionPayload);
    return {
      success: true,
      data: response.data,
      isMock: false,
      message: 'Triage evaluation completed by live backend',
    };
  } catch (err) {
    console.warn('Backend submit failed or offline. Evaluating locally via mock analyzer.', err.message);
    return calculateLocalTriageResult(submissionPayload, true);
  }
}

/**
 * Local evaluation logic (used when backend is offline)
 * Accurately scores the 5 questions, flags weak competencies, and matches 70:20:10 pathways.
 */
function calculateLocalTriageResult(payload, isMock = true) {
  const answers = payload.answers || {};
  let totalScore = 0;
  const competencyScores = {
    STAT_SAMPLING: { correct: 0, total: 1, name: 'Statistical Sampling & Stratification' },
    CAPI_TOOLS: { correct: 0, total: 1, name: 'Digital Survey Tool Operation (CAPI)' },
    DATA_TRIANGULATION: { correct: 0, total: 1, name: 'Data Quality & Field Triangulation' },
    CITIZEN_ETHICS: { correct: 0, total: 1, name: 'Citizen Engagement & Ethical Enumeration' },
    SCHEME_INTERPRETATION: { correct: 0, total: 1, name: 'Cadre Rules & Guideline Interpretation' },
  };

  BASELINE_TRIAGE_QUESTIONS.forEach((q) => {
    const selectedAnswer = answers[q.id];
    const isCorrect = selectedAnswer === q.correctOptionId;
    if (isCorrect) {
      totalScore += 20; // 5 questions * 20 = 100 max score
      if (competencyScores[q.competencyId]) {
        competencyScores[q.competencyId].correct += 1;
      }
    }
  });

  // Identify weak competency (prefer one with 0 score, or default to STAT_SAMPLING)
  let weakCompetencyKey = 'STAT_SAMPLING';
  for (const [key, comp] of Object.entries(competencyScores)) {
    if (comp.correct < comp.total) {
      weakCompetencyKey = key;
      break;
    }
  }

  const weakCompDef = COMPETENCY_DEFINITIONS[weakCompetencyKey];
  const weakCompetencyName = weakCompDef?.name || 'Statistical Sampling & Stratification';

  // Dynamically map 70:20:10 pathway cards to the identified weak competency
  const dynamicPathways = PATHWAY_CARDS.map((card) => ({
    ...card,
    mappedCompetency: weakCompetencyName,
    title:
      card.type === '10_formal'
        ? `${weakCompetencyName} Masterclass & Rulebook`
        : card.type === '20_collaborative'
        ? `${weakCompetencyName} Peer Review Circle`
        : `Simulated Field Audit: ${weakCompetencyName}`,
  }));

  const weakCompetency = {
    key: weakCompetencyKey,
    name: weakCompetencyName,
    category: weakCompDef?.category || 'Functional / Domain',
    description: weakCompDef?.description || '',
    recommendedPathways: dynamicPathways,
  };

  return {
    success: true,
    isMock,
    data: {
      learnerId: payload.userId || '123',
      roleCode: payload.roleCode || 'MOSPI_FOD_INV_01',
      overallScore: totalScore,
      percentage: totalScore,
      ratingBand:
        totalScore >= 80 ? 'Proficient' : totalScore >= 60 ? 'Competent' : totalScore >= 40 ? 'Developing' : 'Requires Upskilling',
      competencyBreakdown: [
        {
          id: 'STAT_SAMPLING',
          name: 'Statistical Sampling & Stratification',
          score: competencyScores.STAT_SAMPLING.correct ? 100 : 35,
          status: competencyScores.STAT_SAMPLING.correct ? 'Proficient' : 'Gap Identified',
        },
        {
          id: 'CAPI_TOOLS',
          name: 'Digital Survey Tool Operation (CAPI)',
          score: competencyScores.CAPI_TOOLS.correct ? 100 : 40,
          status: competencyScores.CAPI_TOOLS.correct ? 'Proficient' : 'Gap Identified',
        },
        {
          id: 'DATA_TRIANGULATION',
          name: 'Data Quality & Field Triangulation',
          score: competencyScores.DATA_TRIANGULATION.correct ? 100 : 50,
          status: competencyScores.DATA_TRIANGULATION.correct ? 'Proficient' : 'Gap Identified',
        },
        {
          id: 'CITIZEN_ETHICS',
          name: 'Citizen Engagement & Ethical Enumeration',
          score: competencyScores.CITIZEN_ETHICS.correct ? 100 : 45,
          status: competencyScores.CITIZEN_ETHICS.correct ? 'Proficient' : 'Gap Identified',
        },
        {
          id: 'SCHEME_INTERPRETATION',
          name: 'Cadre Rules & Guideline Interpretation',
          score: competencyScores.SCHEME_INTERPRETATION.correct ? 100 : 40,
          status: competencyScores.SCHEME_INTERPRETATION.correct ? 'Proficient' : 'Gap Identified',
        },
      ],
      weakCompetency,
      recommendedPathways: dynamicPathways,
    },
  };
}

/**
 * Fetch dynamic follow-up MCQ questions for the weak competency
 * Randomly picks a non-repeating subset of questions from the pool on every attempt.
 */
export async function fetchDynamicQuestions(weakCompetencyKey = 'STAT_SAMPLING', count = 3) {
  const selectedBank =
    DYNAMIC_QUESTION_BANK[weakCompetencyKey] ||
    DYNAMIC_QUESTION_BANK.STAT_SAMPLING ||
    DYNAMIC_ASSESSMENT_QUESTIONS ||
    [];

  // Fisher-Yates shuffle algorithm to guarantee a randomized order on every attempt
  const pool = [...selectedBank];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick `count` distinct questions from the shuffled pool
  const randomizedQuestions = pool.slice(0, Math.min(count, pool.length));

  return {
    success: true,
    data: randomizedQuestions,
    poolSize: selectedBank.length,
    attemptId: Date.now(),
  };
}

