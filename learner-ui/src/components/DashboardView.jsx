import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  LinearProgress,
  Chip,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PathwayCard from './PathwayCard';

export default function DashboardView({
  triageResult,
  learner,
  onStartDynamicAssessment,
  onRetakeTriage,
  onSelectPathway,
}) {
  const { overallScore, ratingBand, competencyBreakdown = [], weakCompetency, recommendedPathways = [] } =
    triageResult || {};

  // Color mapping based on score band
  const getScoreColor = (score) => {
    if (score >= 80) return '#138808'; // Green
    if (score >= 60) return '#0288D1'; // Blue
    if (score >= 40) return '#F57C00'; // Amber/Orange
    return '#D32F2F'; // Red
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Top Banner: Success of Triage + Overall Score Summary */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<CheckCircleIcon sx={{ color: '#138808 !important' }} />}
                label="Baseline Triage Completed"
                sx={{
                  bgcolor: '#F0FDF4',
                  color: '#166534',
                  fontWeight: 700,
                  border: '1px solid #BBF7D0',
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                FRAC Framework Profile: <strong>{learner?.roleCode}</strong>
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D2E5C', mb: 1 }}>
              Personalized Competency Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', mb: 2 }}>
              Your baseline triage assessment has been processed. Based on your responses, we have mapped your
              functional readiness across core MoSPI field competencies and curated a targeted 70:20:10 learning pathway.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                endIcon={<PlayArrowIcon />}
                onClick={onStartDynamicAssessment}
                sx={{
                  bgcolor: '#F37021',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  px: 3,
                  '&:hover': { bgcolor: '#E65100' },
                }}
              >
                Launch Dynamic Assessment
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={onRetakeTriage}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#F8FAFC' },
                }}
              >
                Retake Baseline Triage
              </Button>
            </Box>
          </Grid>

          {/* Overall Score Dial / Widget */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
                OVERALL BASELINE READINESS
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: getScoreColor(overallScore || 0),
                  my: 1,
                }}
              >
                {overallScore}%
              </Typography>
              <Chip
                label={`Status: ${ratingBand || 'Evaluated'}`}
                sx={{
                  bgcolor: `${getScoreColor(overallScore || 0)}15`,
                  color: getScoreColor(overallScore || 0),
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: `1px solid ${getScoreColor(overallScore || 0)}40`,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Identified Weak Competency Highlight Callout */}
      {weakCompetency && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon sx={{ fontSize: 32, color: '#E65100' }} />}
          sx={{
            mb: 4,
            borderRadius: 3,
            p: 2.5,
            bgcolor: '#FFF7ED',
            border: '2px solid #FFEDD5',
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  label="IDENTIFIED SKILL GAP"
                  size="small"
                  sx={{ bgcolor: '#EA580C', color: '#FFFFFF', fontWeight: 800, fontSize: '0.68rem' }}
                />
                <Typography variant="caption" sx={{ color: '#9A3412', fontWeight: 700 }}>
                  PRIORITY UP-SKILLING FOCUS
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#9A3412', mb: 0.5 }}>
                {weakCompetency.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#7C2D12', maxWidth: 750 }}>
                {weakCompetency.description ||
                  'Field investigation guidelines require strict casualty protocols during enterprise non-operation rather than arbitrary replacement. Deepening this skill ensures unbiased sampling frames.'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={onStartDynamicAssessment}
              sx={{
                bgcolor: '#EA580C',
                color: '#FFFFFF',
                fontWeight: 700,
                alignSelf: 'center',
                '&:hover': { bgcolor: '#C2410C' },
              }}
            >
              Start Practice MCQ &rarr;
            </Button>
          </Box>
        </Alert>
      )}

      {/* Competency Breakdown Visualizer */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AutoAwesomeIcon sx={{ color: '#0D2E5C' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D2E5C' }}>
              Competency & Skill Gap Breakdown
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {competencyBreakdown.map((item) => {
              const isWeak = item.status === 'Gap Identified';
              const barColor = isWeak ? '#EA580C' : '#138808';

              return (
                <Grid item xs={12} md={6} key={item.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #E2E8F0',
                      bgcolor: isWeak ? '#FFFBF6' : '#FFFFFF',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: isWeak ? '#9A3412' : '#0D2E5C' }}
                      >
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          bgcolor: isWeak ? '#FFEDD5' : '#DCFCE7',
                          color: isWeak ? '#9A3412' : '#166534',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={item.score}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: '#E2E8F0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: barColor,
                              borderRadius: 5,
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: barColor, minWidth: 40, textAlign: 'right' }}>
                        {item.score}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* 70:20:10 Learning Pathways Grid */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D2E5C', mb: 0.5 }}>
            70:20:10 Recommended Learning Pathways
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Mission Karmayogi blended framework: <strong>70% Experiential Practice</strong> on the job,{' '}
            <strong>20% Collaborative Social Learning</strong> with peers, and <strong>10% Formal Courseware</strong>.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {recommendedPathways.map((pathway) => (
            <Grid item xs={12} md={4} key={pathway.id}>
              <PathwayCard
                pathway={pathway}
                onActionClick={(selectedPathway) => {
                  if (selectedPathway.type === '70_experiential') {
                    onStartDynamicAssessment();
                  } else {
                    onSelectPathway(selectedPathway);
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
