import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Snackbar,
  Alert,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import theme from './theme/theme';
import Header from './components/Header';
import TriageView from './components/TriageView';
import BaselineTriage from './components/BaselineTriage';
import DashboardView from './components/DashboardView';
import AssessmentRunner from './components/AssessmentRunner';
import {
  getLearnerProfileFromUrl,
  fetchTriageQuestions,
  submitTriageAnswers,
  fetchDynamicQuestions,
  fetchLtiSession,
  translateText,
} from './services/api';

// Defined screens of the learner journey
const SCREENS = {
  LANDING: 'LANDING',
  BASELINE: 'BASELINE',
  DASHBOARD: 'DASHBOARD',
  DYNAMIC_ASSESSMENT: 'DYNAMIC_ASSESSMENT',
};

export default function App() {
  // Learner profile (read from URL or fallback to default mock)
  const [learner, setLearner] = useState(getLearnerProfileFromUrl());
  const [currentScreen, setCurrentScreen] = useState(SCREENS.LANDING);
  const [language, setLanguage] = useState('en');
  const [isMockMode, setIsMockMode] = useState(true); // Default to standalone offline mode

  // Data states
  const [triageQuestions, setTriageQuestions] = useState([]);
  const [triageResult, setTriageResult] = useState(null);
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Modal dialog for 10% or 20% pathway details
  const [activePathwayModal, setActivePathwayModal] = useState(null);

  // Load questions and LTI session on mount
  useEffect(() => {
    if (learner.isLtiLaunch && learner.sessionId && learner.name === 'Rajesh Kumar Sharma') {
      fetchLtiSession(learner.sessionId).then(res => {
        if (res.success) {
          const sessionData = res.data;
          setLearner(prev => ({
            ...prev,
            userId: sessionData.sub || prev.userId,
            name: sessionData.name || sessionData.sub || prev.name,
            roleCode: sessionData.custom?.frac_role || prev.roleCode,
            division: sessionData.custom?.division || prev.division,
            department: sessionData.custom?.division || prev.department,
            roleTitle: `Specialist (${sessionData.custom?.frac_role || prev.roleCode})`
          }));
        }
      });
    }
    loadTriageQuestions();
  }, [learner.roleCode, isMockMode, learner.sessionId, learner.isLtiLaunch, learner.name]);

  const loadTriageQuestions = async () => {
    const res = await fetchTriageQuestions(learner.roleCode, isMockMode);
    if (res.success) {
      setTriageQuestions(res.data);
    }
  };

  const showToast = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // 1. User starts Baseline Triage
  const handleStartBaseline = () => {
    setCurrentScreen(SCREENS.BASELINE);
  };

  // 2. User submits 5-question baseline triage
  const handleSubmitBaseline = async (answers) => {
    setIsSubmitting(true);
    const payload = {
      userId: learner.userId,
      roleCode: learner.roleCode,
      answers,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await submitTriageAnswers(payload, isMockMode);
      if (res.success) {
        setTriageResult(res.data);
        setCurrentScreen(SCREENS.DASHBOARD);
        showToast('Baseline Triage Evaluated Successfully!', 'success');
      } else {
        showToast('Failed to evaluate assessment. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network issue while submitting triage.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. User launches Dynamic Assessment for identified weak competency
  const handleStartDynamicAssessment = async () => {
    const weakCompKey = triageResult?.weakCompetency?.key || 'STAT_SAMPLING';
    const weakCompName = triageResult?.weakCompetency?.name || 'Statistical Sampling';
    const res = await fetchDynamicQuestions(weakCompKey, 3, learner.userId, weakCompName);
    if (res.success) {
      setDynamicQuestions(res.data);
      setCurrentScreen(SCREENS.DYNAMIC_ASSESSMENT);
    }
  };

  // Retake baseline triage
  const handleRetakeTriage = () => {
    setCurrentScreen(SCREENS.BASELINE);
  };

  // Handle clicking on 10% or 20% pathway cards
  const handleSelectPathway = (pathway) => {
    setActivePathwayModal(pathway);
  };

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    if (newLang === 'en') {
      loadTriageQuestions(); // Reload original english
      showToast('Language switched to English', 'info');
      return;
    }
    
    showToast('Translating content via Bhashini NMT...', 'info');
    
    // Translate Triage Questions
    const translatedTriage = await Promise.all(
      triageQuestions.map(async (q) => {
        const qRes = await translateText(q.question || q.questionText, 'en', newLang);
        return {
          ...q,
          question: qRes.success ? qRes.data : (q.question || q.questionText),
          questionText: qRes.success ? qRes.data : (q.question || q.questionText)
        };
      })
    );
    setTriageQuestions(translatedTriage);

    // Translate Dynamic Questions (if any)
    if (dynamicQuestions.length > 0) {
      const translatedDynamic = await Promise.all(
        dynamicQuestions.map(async (q) => {
          const qRes = await translateText(q.question_text || q.questionText || q.question, 'en', newLang);
          return {
            ...q,
            question_text: qRes.success ? qRes.data : (q.question_text || q.questionText || q.question),
            questionText: qRes.success ? qRes.data : (q.question_text || q.questionText || q.question)
          };
        })
      );
      setDynamicQuestions(translatedDynamic);
    }
    
    showToast('Translation complete.', 'success');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Main Container Wrapper */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#F4F6F9',
        }}
      >
        {/* Header Component */}
        <Header
          learner={learner}
          language={language}
          onLanguageChange={handleLanguageChange}
          isMockMode={isMockMode}
          onToggleMockMode={(newVal) => {
            setIsMockMode(newVal);
            showToast(
              newVal ? 'Switched to Standalone Mock Mode' : 'Switched to Live API Mode (http://localhost:8000)',
              'info'
            );
          }}
        />

        {/* Quick Navigation / Hackathon Demo Stepper Bar */}
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            py: 1,
            px: { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              maxWidth: 1100,
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Breadcrumbs aria-label="breadcrumb">
              <Link
                underline="hover"
                sx={{
                  cursor: 'pointer',
                  fontWeight: currentScreen === SCREENS.LANDING ? 700 : 500,
                  color: currentScreen === SCREENS.LANDING ? '#0D2E5C' : '#64748B',
                }}
                onClick={() => setCurrentScreen(SCREENS.LANDING)}
              >
                1. Learner Landing
              </Link>
              <Link
                underline="hover"
                sx={{
                  cursor: 'pointer',
                  fontWeight: currentScreen === SCREENS.BASELINE ? 700 : 500,
                  color: currentScreen === SCREENS.BASELINE ? '#0D2E5C' : '#64748B',
                }}
                onClick={() => setCurrentScreen(SCREENS.BASELINE)}
              >
                2. Baseline Triage (5 Qs)
              </Link>
              <Link
                underline="hover"
                sx={{
                  cursor: triageResult ? 'pointer' : 'not-allowed',
                  fontWeight: currentScreen === SCREENS.DASHBOARD ? 700 : 500,
                  color: currentScreen === SCREENS.DASHBOARD ? '#0D2E5C' : '#94A3B8',
                }}
                onClick={() => {
                  if (triageResult) setCurrentScreen(SCREENS.DASHBOARD);
                }}
              >
                3. Competency Dashboard & 70:20:10
              </Link>
              <Link
                underline="hover"
                sx={{
                  cursor: triageResult ? 'pointer' : 'not-allowed',
                  fontWeight: currentScreen === SCREENS.DYNAMIC_ASSESSMENT ? 700 : 500,
                  color: currentScreen === SCREENS.DYNAMIC_ASSESSMENT ? '#0D2E5C' : '#94A3B8',
                }}
                onClick={() => {
                  if (triageResult) handleStartDynamicAssessment();
                }}
              >
                4. Dynamic Assessment & Score
              </Link>
            </Breadcrumbs>

            <Chip
              label="Interactive Prototype Mode"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.68rem', fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Dynamic Screen Content */}
        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          {currentScreen === SCREENS.LANDING && (
            <TriageView
              learner={learner}
              onStartAssessment={handleStartBaseline}
              isMockMode={isMockMode}
            />
          )}

          {currentScreen === SCREENS.BASELINE && (
            <BaselineTriage
              questions={triageQuestions}
              onSubmit={handleSubmitBaseline}
              onCancel={() => setCurrentScreen(SCREENS.LANDING)}
              isSubmitting={isSubmitting}
            />
          )}

          {currentScreen === SCREENS.DASHBOARD && (
            <DashboardView
              triageResult={triageResult}
              learner={learner}
              onStartDynamicAssessment={handleStartDynamicAssessment}
              onRetakeTriage={handleRetakeTriage}
              onSelectPathway={handleSelectPathway}
            />
          )}

          {currentScreen === SCREENS.DYNAMIC_ASSESSMENT && (
            <AssessmentRunner
              questions={dynamicQuestions}
              weakCompetencyName={triageResult?.weakCompetency?.name}
              baselineScore={triageResult?.overallScore}
              onReturnToDashboard={() => setCurrentScreen(SCREENS.DASHBOARD)}
              onRetakeDynamicAssessment={handleStartDynamicAssessment}
            />
          )}
        </Box>

        {/* Modal Dialog for 10% / 20% Pathway details */}
        <Dialog
          open={Boolean(activePathwayModal)}
          onClose={() => setActivePathwayModal(null)}
          maxWidth="sm"
          fullWidth
        >
          {activePathwayModal && (
            <>
              <DialogTitle sx={{ fontWeight: 800, color: '#0D2E5C' }}>
                {activePathwayModal.title}
              </DialogTitle>
              <DialogContent dividers>
                <Chip
                  label={activePathwayModal.typeLabel}
                  size="small"
                  sx={{ bgcolor: activePathwayModal.badgeColor, color: '#FFFFFF', mb: 2, fontWeight: 700 }}
                />
                <Typography variant="body1" sx={{ color: '#334155', mb: 2 }}>
                  {activePathwayModal.description}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mb: 0.5 }}>
                  <strong>Provider:</strong> {activePathwayModal.provider}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>
                  <strong>Estimated Duration:</strong> {activePathwayModal.estimatedDuration}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setActivePathwayModal(null)} sx={{ color: '#64748B' }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    showToast(`Simulated Enrollment: ${activePathwayModal.title}`, 'success');
                    setActivePathwayModal(null);
                  }}
                  sx={{ bgcolor: '#0D2E5C', fontWeight: 700 }}
                >
                  Confirm Enrollment
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2.5,
            px: 2,
            mt: 'auto',
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
            <strong>KarmMitra AI</strong> — Smart India Hackathon 2026 Prototype (PS 26101: Mission Karmayogi Capacity Building)
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Built for Ministry of Statistics & Programme Implementation (MoSPI) &bull; Member 4: Learner UI & Dynamic Assessment
          </Typography>
        </Box>

        {/* Toast Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%', fontWeight: 600, borderRadius: 2 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
