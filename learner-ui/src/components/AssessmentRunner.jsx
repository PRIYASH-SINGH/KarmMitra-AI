import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  LinearProgress,
  Chip,
  Paper,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReplayIcon from '@mui/icons-material/Replay';
import CasinoIcon from '@mui/icons-material/Casino';

export default function AssessmentRunner({
  questions,
  weakCompetencyName,
  baselineScore,
  onReturnToDashboard,
  onRetakeDynamicAssessment,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [validationError, setValidationError] = useState(false);

  // Reset runner whenever new random questions are provided
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResult(false);
    setValidationError(false);
  }, [questions]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = selectedAnswers[currentQuestion?.id] || '';
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleOptionSelect = (optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
    setValidationError(false);
  };

  const handleNext = () => {
    if (!currentAnswer) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setValidationError(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAssessment = () => {
    if (!currentAnswer) {
      setValidationError(true);
      return;
    }
    setShowResult(true);
  };

  // Calculate final score
  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionId) {
        correctCount += 1;
      }
    });
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    return { correctCount, totalQuestions, percentage };
  };

  // If assessment has been submitted, show final score card
  if (showResult) {
    const { correctCount, percentage } = calculateScore();
    const scoreDiff = percentage - (baselineScore || 0);

    return (
      <Box sx={{ maxWidth: 850, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(13, 46, 92, 0.12)',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Certificate / Celebration Banner */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0D2E5C 0%, #1B4782 100%)',
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              color: '#FFFFFF',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: '#F37021',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 4px 15px rgba(243, 112, 33, 0.4)',
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 42, color: '#FFFFFF' }} />
            </Box>
            <Typography variant="overline" sx={{ letterSpacing: 2, color: '#FFB74D', fontWeight: 800 }}>
              DYNAMIC ASSESSMENT COMPLETED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Competency Mastery Achieved
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 600, mx: 'auto' }}>
              Targeted skill gap verification for: <strong>{weakCompetencyName || 'Statistical Sampling & Stratification'}</strong>
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Score Comparison Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    bgcolor: '#F8FAFC',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                    BASELINE TRIAGE SCORE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748B', my: 1 }}>
                    {baselineScore || 0}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Pre-intervention level
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    bgcolor: '#F0FDF4',
                    borderRadius: 2,
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                    POST-ASSESSMENT SCORE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#138808', my: 1 }}>
                    {percentage}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#166534' }}>
                    {correctCount} of {totalQuestions} Questions Correct
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    bgcolor: '#FFF7ED',
                    borderRadius: 2,
                    border: '1px solid #FFEDD5',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#C2410C', fontWeight: 700 }}>
                    COMPETENCY DELTA (GROWTH)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, my: 1 }}>
                    <TrendingUpIcon sx={{ color: scoreDiff >= 0 ? '#138808' : '#EA580C', fontSize: 32 }} />
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: scoreDiff >= 0 ? '#138808' : '#EA580C',
                      }}
                    >
                      {scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#C2410C' }}>
                    Demonstrated Upskilling
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Answer Breakdown & Explanations */}
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D2E5C', mb: 2 }}>
              Question-by-Question Review & Rationale
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctOptionId;

                return (
                  <Paper
                    key={q.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECDD3'}`,
                      bgcolor: isCorrect ? '#F8FCF8' : '#FFF9F9',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D2E5C' }}>
                        Q{idx + 1}: {q.question}
                      </Typography>
                      <Chip
                        label={isCorrect ? 'Correct' : 'Needs Review'}
                        size="small"
                        sx={{
                          bgcolor: isCorrect ? '#138808' : '#E11D48',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
                      <strong>Your Answer:</strong> Option {userAns} &bull;{' '}
                      <strong>Prescribed Key:</strong> Option {q.correctOptionId}
                    </Typography>

                    <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                      <Typography variant="caption" sx={{ color: '#0D2E5C', fontWeight: 700, display: 'block' }}>
                        EXPLANATION / DOCTRINE:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569' }}>
                        {q.explanation}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            {/* Completion Badge Certificate Notice */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: '#F0F9FF',
                borderRadius: 2,
                border: '1px dashed #0288D1',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <WorkspacePremiumIcon sx={{ color: '#0288D1', fontSize: 40 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369A1' }}>
                  Micro-Credential Logged on iGOT Karmayogi Profile
                </Typography>
                <Typography variant="caption" sx={{ color: '#0288D1' }}>
                  This verified mastery score has been recorded into your civil service competency portfolio for the 2026–2027 cycle.
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={onReturnToDashboard}
                sx={{
                  bgcolor: '#0D2E5C',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.2,
                  '&:hover': { bgcolor: '#071C38' },
                }}
              >
                Return to Personalized Dashboard
              </Button>
              {onRetakeDynamicAssessment && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ReplayIcon />}
                  onClick={onRetakeDynamicAssessment}
                  sx={{
                    bgcolor: '#F37021',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    px: 3.5,
                    py: 1.2,
                    '&:hover': { bgcolor: '#E65100' },
                  }}
                >
                  Try Another Practice Set (New Questions)
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Active Dynamic MCQ Question Runner
  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header Progress Tracker */}
      <Paper
        elevation={1}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              label={`Dynamic Question ${currentIndex + 1} of ${totalQuestions}`}
              sx={{ fontWeight: 700, bgcolor: '#EA580C', color: '#FFFFFF' }}
            />
            <Chip
              icon={<CasinoIcon sx={{ fontSize: '1rem !important', color: '#0369A1 !important' }} />}
              label="Fresh Random Draw"
              size="small"
              sx={{
                bgcolor: '#E0F2FE',
                color: '#0369A1',
                fontWeight: 700,
                fontSize: '0.72rem',
                border: '1px solid #BAE6FD',
              }}
            />
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              Targeted Upskilling Assessment
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#EA580C' }}>
            {progressPercent}% Complete
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#E2E8F0',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#EA580C',
              borderRadius: 4,
            },
          }}
        />
      </Paper>

      {/* Main Question Card */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(13, 46, 92, 0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Weak Competency: ${weakCompetencyName || 'Statistical Sampling'}`}
              size="small"
              sx={{
                bgcolor: '#FFF7ED',
                color: '#C2410C',
                border: '1px solid #FED7AA',
                fontWeight: 700,
              }}
            />
            {currentQuestion?.difficulty && (
              <Chip
                label={currentQuestion.difficulty}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#0D2E5C',
              lineHeight: 1.45,
              mb: 3,
            }}
          >
            {currentIndex + 1}. {currentQuestion.question}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {validationError && (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              <strong>Selection required:</strong> Please select an answer before continuing.
            </Alert>
          )}

          {/* Radio Options List */}
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleOptionSelect(e.target.value)}
            >
              {currentQuestion.options.map((opt) => {
                const isSelected = currentAnswer === opt.id;
                return (
                  <Paper
                    key={opt.id}
                    elevation={0}
                    onClick={() => handleOptionSelect(opt.id)}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: isSelected
                        ? '2px solid #EA580C'
                        : '1px solid #E2E8F0',
                      bgcolor: isSelected ? '#FFF7ED' : '#FFFFFF',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFEDD5' : '#F8FAFC',
                      },
                      display: 'flex',
                      alignItems: 'flex-start',
                    }}
                  >
                    <FormControlLabel
                      value={opt.id}
                      control={
                        <Radio
                          checked={isSelected}
                          sx={{
                            color: '#94A3B8',
                            '&.Mui-checked': {
                              color: '#EA580C',
                            },
                            mt: -0.5,
                          }}
                        />
                      }
                      label={
                        <Box sx={{ pl: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={opt.id}
                              size="small"
                              sx={{
                                height: 22,
                                width: 22,
                                fontWeight: 700,
                                bgcolor: isSelected ? '#EA580C' : '#E2E8F0',
                                color: isSelected ? '#FFFFFF' : '#475569',
                                fontSize: '0.75rem',
                              }}
                            />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? '#0D2E5C' : '#1E293B',
                                fontSize: '0.95rem',
                              }}
                            >
                              {opt.text}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                    />
                  </Paper>
                );
              })}
            </RadioGroup>
          </FormControl>

          {/* Navigation Controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 4,
              pt: 2.5,
              borderTop: '1px solid #F1F5F9',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={currentIndex === 0 ? onReturnToDashboard : handlePrevious}
              sx={{ color: '#64748B', fontWeight: 600 }}
            >
              {currentIndex === 0 ? 'Exit to Dashboard' : 'Previous Question'}
            </Button>

            {!isLastQuestion ? (
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={handleNext}
                disabled={!currentAnswer}
                sx={{
                  bgcolor: '#0D2E5C',
                  color: '#FFFFFF',
                  px: 3.5,
                  py: 1,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#071C38' },
                  '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
                }}
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<CheckCircleIcon />}
                onClick={handleSubmitAssessment}
                disabled={!currentAnswer}
                sx={{
                  bgcolor: '#138808',
                  color: '#FFFFFF',
                  px: 4,
                  py: 1,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#0C5B05' },
                  '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
                }}
              >
                Submit & Calculate Final Score
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
