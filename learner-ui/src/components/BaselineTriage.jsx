import React, { useState } from 'react';
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
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function BaselineTriage({ questions, onSubmit, onCancel, isSubmitting }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: optionId }
  const [validationError, setValidationError] = useState(false);

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

  const handleFinalize = () => {
    if (!currentAnswer) {
      setValidationError(true);
      return;
    }
    onSubmit(selectedAnswers);
  };

  if (!currentQuestion) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">No questions available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Top Header & Progress Indicator */}
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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={`Question ${currentIndex + 1} of ${totalQuestions}`}
              color="primary"
              sx={{ fontWeight: 700, bgcolor: '#0D2E5C' }}
            />
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              Baseline Triage Assessment
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F37021' }}>
            {progressPercent}% Completed
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
              bgcolor: '#F37021', // Saffron progress bar
              borderRadius: 4,
            },
          }}
        />
      </Paper>

      {/* Main Question Card */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(13, 46, 92, 0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          {/* Competency Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              icon={<HelpOutlineIcon sx={{ fontSize: '1rem !important' }} />}
              label={`Mapped Competency: ${currentQuestion.competencyName}`}
              size="small"
              sx={{
                bgcolor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontWeight: 600,
                fontSize: '0.78rem',
              }}
            />
          </Box>

          {/* Question Text */}
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

          {/* Validation Error Message */}
          {validationError && (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              <strong>Selection required:</strong> Please choose one of the options below before proceeding to the next question.
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
                        ? '2px solid #F37021'
                        : '1px solid #E2E8F0',
                      bgcolor: isSelected ? '#FFF8F1' : '#FFFFFF',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFF4E8' : '#F8FAFC',
                        borderColor: isSelected ? '#F37021' : '#CBD5E1',
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
                              color: '#F37021',
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
                                bgcolor: isSelected ? '#F37021' : '#E2E8F0',
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

          {/* Action Navigation Footer */}
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
              onClick={currentIndex === 0 ? onCancel : handlePrevious}
              sx={{ color: '#64748B', fontWeight: 600 }}
            >
              {currentIndex === 0 ? 'Cancel Assessment' : 'Previous Question'}
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
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
                    '&.Mui-disabled': {
                      bgcolor: '#E2E8F0',
                      color: '#94A3B8',
                    },
                  }}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<CheckCircleIcon />}
                  onClick={handleFinalize}
                  disabled={!currentAnswer || isSubmitting}
                  sx={{
                    bgcolor: '#F37021',
                    color: '#FFFFFF',
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#E65100' },
                    '&.Mui-disabled': {
                      bgcolor: '#E2E8F0',
                      color: '#94A3B8',
                    },
                  }}
                >
                  {isSubmitting ? 'Evaluating Assessment...' : 'Finalize Assessment'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
