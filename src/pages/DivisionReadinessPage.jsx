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
  Button,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import DivisionReadinessChart from '../components/DivisionReadiness';
import DetailDrawer from '../components/DetailDrawer';
import StatRowList from '../components/StatRowList';
import StatusChip from '../components/StatusChip';
import { useAnalytics } from '../context/AnalyticsContext';
import { useFilters, applyDivisionFilters } from '../context/FilterContext';
import GlobalFilters from '../components/GlobalFilters';

// Readiness band used only for the display chip — underlying data keeps its
// raw readinessPercent field intact.
function readinessBand(percent) {
  if (percent >= 75) return 'On Track';
  if (percent >= 60) return 'Needs Attention';
  return 'Priority Support';
}

export default function DivisionReadinessPage() {
  const { analytics, loading } = useAnalytics();
  const { filters } = useFilters();
  const [activeDivision, setActiveDivision] = useState(null);

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading division readiness data…
        </Typography>
      </Box>
    );
  }

  const rows = applyDivisionFilters(analytics.divisionData, filters);

  return (
    <Box>
      <PageHeader
        title="Division Readiness"
        subtitle="Workforce readiness and training demand across participating divisions"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <GlobalFilters
          fields={['division']}
          options={{ division: analytics.filterOptions.divisions.map((d) => d.code) }}
        />

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <DivisionReadinessChart data={rows} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Division register
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click a row for training-demand detail
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Division</TableCell>
                      <TableCell align="right">Proficient</TableCell>
                      <TableCell align="right">Needs Training</TableCell>
                      <TableCell align="right">Readiness</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.code} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary' }}>
                            {row.code}
                          </Typography>
                          {row.name}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {row.proficient.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {row.needTraining.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {row.readinessPercent}%
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => setActiveDivision(row)}>
                            View division
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <DetailDrawer
        open={!!activeDivision}
        onClose={() => setActiveDivision(null)}
        eyebrow="Division detail"
        title={activeDivision?.name}
      >
        {activeDivision && (
          <>
            <StatusChip status={readinessBand(activeDivision.readinessPercent)} />
            <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
              {activeDivision.trainingDemand}
            </Typography>
            <StatRowList
              rows={[
                { label: 'Division code', value: activeDivision.code },
                { label: 'Proficient staff', value: activeDivision.proficient.toLocaleString() },
                { label: 'Needs training', value: activeDivision.needTraining.toLocaleString() },
                { label: 'Readiness', value: `${activeDivision.readinessPercent}%` },
              ]}
            />
          </>
        )}
      </DetailDrawer>
    </Box>
  );
}
