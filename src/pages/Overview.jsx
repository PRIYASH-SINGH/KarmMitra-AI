import React, { useState } from 'react';
import { Box, Grid, Typography, Card, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import StatCard from '../components/StatCard';
import CompetencyRadar from '../components/CompetencyRadar';
import DivisionReadiness from '../components/DivisionReadiness';
import StateHeatmapTable from '../components/StateHeatmapTable';
import DetailDrawer from '../components/DetailDrawer';
import StatRowList from '../components/StatRowList';
import PageHeader from '../components/PageHeader';
import { useAnalytics } from '../context/AnalyticsContext';
import { useNavigate } from 'react-router-dom';

const SEVERITY_ICON = {
  critical: ErrorOutlineOutlinedIcon,
  warning: WarningAmberOutlinedIcon,
};

const SEVERITY_COLOR = {
  critical: '#B54747',
  warning: '#B7791F',
};

// Maps a governance alert's linkType to a short attention-category label and
// the destination page, so "What needs attention" reads like a worklist
// rather than a generic alert feed.
const ATTENTION_META = {
  competency: { category: 'High gap', cta: 'View competency', path: '/competency-intelligence' },
  division: { category: 'High demand', cta: 'View division', path: '/division-readiness' },
  state: { category: 'Regional priority', cta: 'View state', path: '/state-readiness' },
  training: { category: 'Training focus', cta: 'View training', path: '/training-throughput' },
};

const FLOW_STEPS = ['Workforce Readiness', 'Competency Gaps', 'Training Needs', 'Institutional Action'];

export default function Overview() {
  const { analytics, loading } = useAnalytics();
  const [activeKpi, setActiveKpi] = useState(null);
  const navigate = useNavigate();

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading workforce metrics…
        </Typography>
      </Box>
    );
  }

  const { kpi, kpiDetails, kcmRadar, divisionData, stateRankings, alerts } = analytics;

  const kpiCards = [
    {
      key: 'totalAssessed',
      label: 'Total Assessments',
      value: kpi.totalAssessed.toLocaleString(),
      description: 'People assessed',
      tone: 'primary',
    },
    {
      key: 'averageReadiness',
      label: 'Overall Readiness',
      value: `${kpi.averageReadiness}%`,
      description: 'Across assessed workforce',
      tone: 'primary',
    },
    {
      key: 'criticalSkillGaps',
      label: 'Critical Competency Gaps',
      value: kpi.criticalSkillGaps,
      description: 'Competencies requiring priority action',
      tone: 'secondary',
    },
    {
      key: 'nsstaWorkshopsScheduled',
      label: 'Training Actions',
      value: kpi.nsstaWorkshopsScheduled,
      description: 'Planned / recommended interventions',
      tone: 'primary',
    },
  ];

  const goToAlert = (alert) => {
    const meta = ATTENTION_META[alert.linkType] || ATTENTION_META.training;
    navigate(meta.path);
  };

  return (
    <Box>
      <PageHeader
        title="Overview"
        subtitle="How the workforce is doing this assessment cycle — readiness, gaps, and what needs attention"
      />

      <Box sx={{ px: { xs: 3, md: 6 }, pt: 3 }}>
        {/* First-10-seconds flow: readiness -> gaps -> training -> action */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mb: 3,
          }}
        >
          {FLOW_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <Chip
                label={step}
                size="small"
                sx={{
                  bgcolor: i === FLOW_STEPS.length - 1 ? 'secondary.main' : '#E7EEF3',
                  color: i === FLOW_STEPS.length - 1 ? '#FFFFFF' : 'primary.main',
                  fontWeight: 600,
                }}
              />
              {i < FLOW_STEPS.length - 1 && (
                <ArrowForwardIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 3, md: 6 }, pb: 4 }}>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {kpiCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.key}>
              <StatCard
                label={card.label}
                value={card.value}
                description={card.description}
                tone={card.tone}
                onClick={() => setActiveKpi(card.key)}
              />
            </Grid>
          ))}
        </Grid>

        {/* What needs attention — the dashboard's answer, not just its data */}
        <Card sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            What needs attention
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Conditions that need institutional attention this cycle
          </Typography>
          <Grid container spacing={2}>
            {alerts.map((alert) => {
              const Icon = SEVERITY_ICON[alert.severity];
              const meta = ATTENTION_META[alert.linkType] || ATTENTION_META.training;
              return (
                <Grid item xs={12} sm={6} md={3} key={alert.id}>
                  <Card
                    onClick={() => goToAlert(alert)}
                    sx={{
                      p: 2,
                      height: '100%',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity]}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.75,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(18,59,93,0.10)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Icon fontSize="small" sx={{ color: SEVERITY_COLOR[alert.severity] }} />
                      <Typography
                        variant="overline"
                        sx={{ color: SEVERITY_COLOR[alert.severity], fontWeight: 700 }}
                      >
                        {meta.category}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {alert.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', flex: 1 }}>
                      {alert.description}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.78rem' }}>
                      {meta.cta} →
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Card>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <CompetencyRadar data={kcmRadar} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DivisionReadiness data={divisionData} />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <StateHeatmapTable data={stateRankings} />
          </Grid>
        </Grid>
      </Box>

      <DetailDrawer
        open={!!activeKpi}
        onClose={() => setActiveKpi(null)}
        eyebrow="KPI detail"
        title={activeKpi ? kpiDetails[activeKpi].label : ''}
      >
        {activeKpi && (
          <>
            <Typography variant="body2" sx={{ mb: 3 }}>
              {kpiDetails[activeKpi].summary}
            </Typography>
            <StatRowList
              rows={kpiDetails[activeKpi].breakdown.map((row) => {
                const unit = kpiDetails[activeKpi].unit;
                const value =
                  unit === 'percent'
                    ? `${row.value}%`
                    : unit === 'points'
                    ? `-${row.value} pts`
                    : row.value.toLocaleString();
                return { label: row.label, value };
              })}
            />
          </>
        )}
      </DetailDrawer>
    </Box>
  );
}
