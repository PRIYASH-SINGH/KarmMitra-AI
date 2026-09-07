import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import CompetencyRadar from '../components/CompetencyRadar';
import CompetencyGapChart from '../components/CompetencyGapChart';
import GlobalFilters from '../components/GlobalFilters';
import DetailDrawer from '../components/DetailDrawer';
import StatRowList from '../components/StatRowList';
import StatusChip from '../components/StatusChip';
import { useAnalytics } from '../context/AnalyticsContext';
import { useFilters, applyCompetencyFilters } from '../context/FilterContext';

// Turns a required-vs-current gap into the plain-language priority band an
// administrator scans for, consistent with the vocabulary used across
// State & UT Readiness and the KCM Matrix.
function priorityForGap(gap) {
  if (gap >= 25) return 'Critical';
  if (gap >= 15) return 'High';
  if (gap > 0) return 'Moderate';
  return 'On Track';
}

export default function CompetencyIntelligence() {
  const { analytics, loading } = useAnalytics();
  const { filters } = useFilters();
  const [activeCompetency, setActiveCompetency] = useState(null);

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading competency gap data…
        </Typography>
      </Box>
    );
  }

  const competencies = applyCompetencyFilters(analytics.kcmCompetencies, filters).map((c) => ({
    ...c,
    gap: Math.max(c.required - c.current, 0),
    priority: priorityForGap(Math.max(c.required - c.current, 0)),
  }));
  const radarData = competencies.map(({ subject, required, current }) => ({ subject, required, current }));
  const topCritical = [...competencies]
    .filter((c) => c.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  return (
    <Box>
      <PageHeader
        title="Competency Gaps"
        subtitle="Where workforce capability is below the required KCM standard"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <GlobalFilters
          fields={['competency']}
          options={{ competency: analytics.filterOptions.competencies }}
        />

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <CompetencyRadar data={radarData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CompetencyGapChart competencies={competencies} />
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top critical competency gaps
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                {topCritical.map((c) => (
                  <Chip
                    key={c.code}
                    label={`${c.subject} · −${c.gap} pts`}
                    onClick={() => setActiveCompetency(c)}
                    sx={{ bgcolor: '#FBEAEA', color: '#B54747', fontWeight: 600, cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography variant="h6" gutterBottom>
              Competency gap ranking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click a row for affected workforce and the recommended training response
            </Typography>
          </Box>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Competency</TableCell>
                  <TableCell align="right">Required Level</TableCell>
                  <TableCell align="right">Current Level</TableCell>
                  <TableCell align="right">Gap</TableCell>
                  <TableCell align="right">People Affected</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {competencies.map((c) => (
                  <TableRow key={c.code} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{c.subject}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {c.required}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {c.current}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: c.gap > 0 ? '#B54747' : '#2E7D5B',
                        fontWeight: 600,
                      }}
                    >
                      {c.gap > 0 ? `-${c.gap}` : 'Met'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {c.affectedStaff.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={c.priority} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => setActiveCompetency(c)}>
                        View competency
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <DetailDrawer
        open={!!activeCompetency}
        onClose={() => setActiveCompetency(null)}
        eyebrow={activeCompetency?.code}
        title={activeCompetency?.subject}
      >
        {activeCompetency && (
          <>
            <StatusChip status={activeCompetency.priority} />
            <Box sx={{ mt: 2 }}>
              <StatRowList
                rows={[
                  { label: 'Domain', value: activeCompetency.domain },
                  { label: 'Required level', value: activeCompetency.required },
                  { label: 'Current level', value: activeCompetency.current },
                  {
                    label: 'Gap',
                    value: activeCompetency.gap > 0 ? `-${activeCompetency.gap} pts` : 'Met',
                    color: activeCompetency.gap > 0 ? '#B54747' : '#2E7D5B',
                  },
                  { label: 'People affected', value: activeCompetency.affectedStaff.toLocaleString() },
                ]}
              />
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
              Suggested training response
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {activeCompetency.recommendedTraining}
            </Typography>
          </>
        )}
      </DetailDrawer>
    </Box>
  );
}
