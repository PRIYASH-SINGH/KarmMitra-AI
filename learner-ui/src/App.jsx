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
  Backdrop,
  CircularProgress,
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
  uploadDocumentForAssessment,
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
  const [isMockMode, setIsMockMode] = useState(false); // Default to live API

  // Data states
  const [triageQuestions, setTriageQuestions] = useState([]);
  const [triageResult, setTriageResult] = useState(null);
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // UI Translation state
  const [uiTranslations, setUiTranslations] = useState({
    welcomeTitle: 'Welcome',
    assessmentOverview: 'Initiate your personalized KarmMitra AI Baseline Triage Assessment. This 5-question diagnostic evaluates your core functional and technical competencies for your assigned cadre role.',
    dashboardTitle: 'Personalized Competency Dashboard',
    launchAssessmentBtn: 'Launch Dynamic Assessment',
    uploadPdfBtn: 'Upload PDF for Quiz',
    retakeTriageBtn: 'Retake Baseline Triage',
    identifiedSkillGap: 'Identified Skill Gap',
    startPracticeBtn: 'Start Practice MCQ'
  });

  // Modal dialog for 10% or 20% pathway details
  const [activePathwayModal, setActivePathwayModal] = useState(null);
  const [isEnrollmentSimulating, setIsEnrollmentSimulating] = useState(false);

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
    // Prepare payload matching TriageSubmitIn Pydantic schema
    const submissionPayload = {
      user_id: learner.userId,
      role_code: learner.roleCode || 'MOSPI_FOD_INV_01',
      answers: answers // Object format { [qId]: optionKey } matches dict
    };

    try {
      const res = await submitTriageAnswers(submissionPayload, isMockMode);
      if (res.success) {
        // Map Live API `TriageResultOut` to the DashboardView expected schema
        const mappedResult = {
          ...res.data,
          overallScore: res.data.score || 0,
          weakCompetency: {
            key: res.data.identified_gaps?.[0]?.competency_code || 'STAT_SAMPLING',
            name: res.data.identified_gaps?.[0]?.competency_name || 'Statistical Sampling'
          }
        };
        setTriageResult(mappedResult);
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

  const translateQuestionArray = async (questionsArray, targetLang) => {
    if (targetLang === 'en') return questionsArray;
    
    return await Promise.all(
      questionsArray.map(async (q) => {
        const sourceText = q.question_text || q.questionText || q.question;
        const qRes = await translateText(sourceText, 'en', targetLang);
        
        // Translate all options concurrently
        let translatedOptions = q.options;
        if (q.options && q.options.length > 0) {
          translatedOptions = await Promise.all(
            q.options.map(async (opt) => {
              const optRes = await translateText(opt.text || opt, 'en', targetLang);
              if (typeof opt === 'string') return optRes.success ? optRes.data : opt;
              return {
                ...opt,
                text: optRes.success ? optRes.data : opt.text
              };
            })
          );
        }

        return {
          ...q,
          question_text: qRes.success ? qRes.data : sourceText,
          questionText: qRes.success ? qRes.data : sourceText, // keep fallback
          question: qRes.success ? qRes.data : sourceText, // keep fallback
          options: translatedOptions
        };
      })
    );
  };

  // 3. User launches Dynamic Assessment for identified weak competency
  const handleStartDynamicAssessment = async (compKey, compName) => {
    // If called directly via onClick={...}, compKey might be a MouseEvent object. We ignore it if it's not a string.
    const validKey = typeof compKey === 'string' ? compKey : null;
    const validName = typeof compName === 'string' ? compName : null;

    // Read from the live TriageResultOut schema (identified_gaps), fallback to mock schema
    const weakCompKey = validKey || triageResult?.identified_gaps?.[0]?.competency_code || triageResult?.weakCompetency?.key || 'STAT_SAMPLING';
    const weakCompName = validName || triageResult?.identified_gaps?.[0]?.competency_name || triageResult?.weakCompetency?.name || weakCompKey;
    
    setIsGeneratingAssessment(true);
    try {
      const res = await fetchDynamicQuestions(weakCompKey, 3, learner.userId, weakCompName);
      if (res.success) {
        let finalQuestions = res.data;
        if (language === 'hi') {
          showToast('Translating assessment into Hindi via Bhashini NMT...', 'info');
          finalQuestions = await translateQuestionArray(finalQuestions, 'hi');
          showToast('Translation complete.', 'success');
        }
        setDynamicQuestions(finalQuestions);
        setCurrentScreen(SCREENS.DYNAMIC_ASSESSMENT);
      } else {
        showToast('Failed to generate assessment: ' + res.error, 'error');
      }
    } catch (err) {
      showToast('Error consulting Sovereign AI', 'error');
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  // Retake baseline triage
  const handleRetakeTriage = () => {
    setCurrentScreen(SCREENS.BASELINE);
  };

  const handleUploadDocument = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsGeneratingAssessment(true);
    try {
      const res = await uploadDocumentForAssessment(file);
      if (res.success) {
        let finalQuestions = res.data;
        if (language === 'hi') {
          showToast('Translating assessment into Hindi via Bhashini NMT...', 'info');
          finalQuestions = await translateQuestionArray(finalQuestions, 'hi');
          showToast('Translation complete.', 'success');
        }
        
        setDynamicQuestions(finalQuestions);
        // Setting a generic name for the uploaded document assessment
        if (triageResult) {
          setTriageResult({
            ...triageResult,
            weakCompetency: { name: 'Uploaded Document', key: 'UPLOAD' },
            identified_gaps: [{ competency_name: 'Uploaded Document', competency_code: 'UPLOAD' }]
          });
        }
        setCurrentScreen(SCREENS.DYNAMIC_ASSESSMENT);
        showToast('Document analyzed! Quiz generated.', 'success');
      } else {
        showToast('Upload failed: ' + res.error, 'error');
      }
    } catch (err) {
      showToast('Error uploading document', 'error');
    } finally {
      setIsGeneratingAssessment(false);
      event.target.value = null; // reset
    }
  };

  // Handle clicking on 10% or 20% pathway cards
  const handleSelectPathway = (pathway) => {
    setActivePathwayModal(pathway);
  };

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    if (newLang === 'en') {
      loadTriageQuestions(); // Reload original english
      setUiTranslations({
        welcomeTitle: 'Welcome',
        assessmentOverview: 'Initiate your personalized KarmMitra AI Baseline Triage Assessment. This 5-question diagnostic evaluates your core functional and technical competencies for your assigned cadre role.',
        dashboardTitle: 'Personalized Competency Dashboard',
        launchAssessmentBtn: 'Launch Dynamic Assessment',
        uploadPdfBtn: 'Upload PDF for Quiz',
        retakeTriageBtn: 'Retake Baseline Triage',
        identifiedSkillGap: 'Identified Skill Gap',
        startPracticeBtn: 'Start Practice MCQ'
      });
      showToast('Language switched to English', 'info');
      return;
    }
    
    showToast('Translating content via Bhashini NMT...', 'info');
    
    // Set static UI text (using provided canonical Hindi translations)
    if (newLang === 'hi') {
      setUiTranslations({
        welcomeTitle: 'स्वागत है',
        assessmentOverview: 'अपना व्यक्तिगत कर्ममित्र एआई बेसलाइन ट्राइएज मूल्यांकन शुरू करें। यह 5-प्रश्न निदान आपकी निर्दिष्ट कैडर भूमिका के लिए आपकी मुख्य कार्यात्मक और तकनीकी दक्षताओं का मूल्यांकन करता है।',
        dashboardTitle: 'व्यक्तिगत योग्यता डैशबोर्ड',
        launchAssessmentBtn: 'डायनामिक असेसमेंट शुरू करें',
        uploadPdfBtn: 'क्विज़ के लिए पीडीएफ अपलोड करें',
        retakeTriageBtn: 'बेसलाइन ट्राइएज पुनः लें',
        identifiedSkillGap: 'पहचाना गया कौशल अंतर',
        startPracticeBtn: 'अभ्यास प्रश्न शुरू करें'
      });
    }

    // Translate Triage Questions
    const translatedTriage = await translateQuestionArray(triageQuestions, newLang);
    setTriageQuestions(translatedTriage);

    // Translate Dynamic Questions
    if (dynamicQuestions.length > 0) {
      const translatedDynamic = await translateQuestionArray(dynamicQuestions, newLang);
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
              uiTranslations={uiTranslations}
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

          {currentScreen === SCREENS.DASHBOARD && triageResult && (
            <DashboardView
              triageResult={triageResult}
              learner={learner}
              onStartDynamicAssessment={handleStartDynamicAssessment}
              onUploadDocument={handleUploadDocument}
              onRetakeTriage={() => {
                setTriageResult(null);
                setCurrentScreen(SCREENS.LANDING);
              }}
              onSelectPathway={() => {}} // Additional functionality mock
              uiTranslations={uiTranslations}
            />
          )}

          {currentScreen === SCREENS.DYNAMIC_ASSESSMENT && (
            <AssessmentRunner
              questions={dynamicQuestions}
              weakCompetencyName={triageResult?.weakCompetency?.name || triageResult?.identified_gaps?.[0]?.competency_name || 'Target Competency'}
              competencyCode={triageResult?.weakCompetency?.key || triageResult?.identified_gaps?.[0]?.competency_code || 'STAT_SAMPLING'}
              learner={learner}
              baselineScore={triageResult?.score || triageResult?.overallScore || 0}
              onReturnToDashboard={() => setCurrentScreen(SCREENS.DASHBOARD)}
              onRetakeDynamicAssessment={handleStartDynamicAssessment}
            />
          )}
        </Box>

        {/* Modal Dialog for 10% / 20% Pathway details */}
          <Dialog
            open={Boolean(activePathwayModal)}
            onClose={() => {
              setActivePathwayModal(null);
              setIsEnrollmentSimulating(false);
            }}
            maxWidth="sm"
            fullWidth
          >
            {activePathwayModal && !isEnrollmentSimulating && (
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
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mb: 0.5 }}>
                    <strong>Estimated Duration:</strong> {activePathwayModal.estimatedDuration}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mb: 0.5 }}>
                    <strong>Mapped Competency:</strong> {activePathwayModal.mappedCompetency} {activePathwayModal.competencyCode ? `(${activePathwayModal.competencyCode})` : ''}
                  </Typography>
                  {activePathwayModal.referenceDoc && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>
                      <strong>Reference Material:</strong> {activePathwayModal.referenceDoc}
                    </Typography>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setActivePathwayModal(null)} sx={{ color: '#64748B' }}>
                    Close
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setIsEnrollmentSimulating(true);
                    }}
                    sx={{ bgcolor: '#0D2E5C', fontWeight: 700 }}
                  >
                    Confirm Enrollment
                  </Button>
                </DialogActions>
              </>
            )}
            
            {activePathwayModal && isEnrollmentSimulating && (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress size={48} sx={{ color: '#EA580C', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D2E5C', mb: 1 }}>
                  Registration confirmed.
                </Typography>
                <Typography variant="body1" sx={{ color: '#334155', mb: 3 }}>
                  Redirecting to official iGOT Karmayogi course session via LTI 1.3...
                </Typography>
                
                <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 3, mb: 4, textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Session Metadata
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0D2E5C', mb: 1 }}>
                    {activePathwayModal.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                    <strong>Estimated Duration:</strong> {activePathwayModal.estimatedDuration}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    <strong>Mapped Competency:</strong> {activePathwayModal.mappedCompetency} {activePathwayModal.competencyCode ? `(${activePathwayModal.competencyCode})` : ''}
                  </Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setActivePathwayModal(null);
                    setIsEnrollmentSimulating(false);
                    showToast(`Simulated LTI redirect completed.`, 'success');
                  }}
                  sx={{ color: '#0D2E5C', borderColor: '#0D2E5C', fontWeight: 700 }}
                >
                  Mock iGOT Launch
                </Button>
              </Box>
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

        {/* Global Loading Backdrop for local LLM Wait Times */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
          open={isGeneratingAssessment}
        >
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Consulting Sovereign MoSPI Knowledge Base...
          </Typography>
        </Backdrop>

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
