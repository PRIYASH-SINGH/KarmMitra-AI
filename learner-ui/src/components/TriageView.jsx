import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

export default function TriageView({ learner, onStartAssessment, isMockMode }) {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Welcome Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0D2E5C 0%, #1B4782 100%)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(243, 112, 33, 0.15)',
            pointerEvents: 'none',
          }}
        />
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Chip
              label="Mission Karmayogi Competency Baseline"
              sx={{
                bgcolor: 'rgba(243, 112, 33, 0.25)',
                color: '#FFB74D',
                border: '1px solid rgba(243, 112, 33, 0.5)',
                fontWeight: 700,
                mb: 1.5,
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}>
              Welcome, {learner?.name || 'Officer'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#E2E8F0', mb: 2, maxWidth: 600 }}>
              Initiate your personalized <strong>KarmMitra AI Baseline Triage Assessment</strong>. 
              This 5-question diagnostic evaluates your core functional and technical competencies 
              for your assigned cadre role.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={onStartAssessment}
                endIcon={<PlayArrowIcon />}
                sx={{
                  bgcolor: '#F37021',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.2,
                  '&:hover': {
                    bgcolor: '#E65100',
                  },
                }}
              >
                Start Baseline Assessment
              </Button>
              <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                Takes only ~4-5 minutes • 5 Questions
              </Typography>
            </Box>
          </Grid>

          {/* Officer Identity Card Preview */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#F37021', fontWeight: 700 }}>
                  CADRE & ROLE PROFILE
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {learner?.roleTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                  Code: <strong>{learner?.roleCode}</strong>
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                <Typography variant="caption" sx={{ display: 'block', color: '#CBD5E1' }}>
                  <strong>Ministry:</strong> {learner?.department}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#CBD5E1', mt: 0.5 }}>
                  <strong>Zone:</strong> {learner?.zone || 'North Zone Field Operations'}
                </Typography>
                {learner?.isFromUrlParams && (
                  <Chip
                    label="Loaded from URL Parameters"
                    size="small"
                    color="warning"
                    sx={{ mt: 1.5, fontSize: '0.65rem' }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Assessment Structure & Guidelines */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AssignmentIcon sx={{ color: '#0D2E5C' }} />
                <Typography variant="h6" sx={{ color: '#0D2E5C', fontWeight: 700 }}>
                  Assessment Overview & Format
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                The triage assessment is designed in alignment with <strong>Mission Karmayogi’s FRAC (Framework for Roles, Activities, and Competencies)</strong>:
              </Typography>

              <List disablePadding>
                <ListItem disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Exactly 5 Diagnostic Questions"
                    secondary="Presented one at a time for focused single-instance decision making."
                  />
                </ListItem>
                <ListItem disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TrackChangesIcon color="secondary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="No Penal Deduction"
                    secondary="Evaluates your current familiarity with field manuals, CAPI tablets, and sampling protocols."
                  />
                </ListItem>
                <ListItem disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PsychologyIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Instant Competency Gap Analysis"
                    secondary="Pinpoints your primary growth area and generates a tailored 70:20:10 learning pathway."
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Competencies Evaluated Card */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SpeedIcon sx={{ color: '#F37021' }} />
                <Typography variant="h6" sx={{ color: '#0D2E5C', fontWeight: 700 }}>
                  Core Competencies Evaluated
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D2E5C' }}>
                    1. Statistical Sampling & Stratification
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    ASUSE casualty rules, hamlet selection & circular systematic sampling
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D2E5C' }}>
                    2. Digital CAPI Survey Systems
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Offline data capture, secure local caching & synchronized batch uploads
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D2E5C' }}>
                    3. Data Quality & Field Triangulation
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Expenditure cross-checks, recall probing & statutory ethics
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                onClick={onStartAssessment}
                sx={{
                  mt: 3,
                  borderColor: '#0D2E5C',
                  color: '#0D2E5C',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#F1F5F9' },
                }}
              >
                Proceed to Question 1 &rarr;
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
