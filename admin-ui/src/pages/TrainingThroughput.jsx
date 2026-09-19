import React from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusChip from '../components/StatusChip';
import { useAnalytics } from '../context/AnalyticsContext';

export default function TrainingThroughput() {
  const { analytics, loading } = useAnalytics();

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading training progress…
        </Typography>
      </Box>
    );
  }

  const throughput = analytics?.trainingThroughput || {};
  const kpi = throughput?.kpi || {};
  const monthly = Array.isArray(throughput?.monthly) ? throughput.monthly : [];
  const workshops = Array.isArray(throughput?.workshops) ? throughput.workshops : [];

  const workshopsScheduled = Number(kpi?.workshopsScheduled ?? 0) || 0;
  const workshopsCompleted = Number(kpi?.workshopsCompleted ?? 0) || 0;
  const inProgress = Math.max(workshopsScheduled - workshopsCompleted, 0);
  const safeInProgress = isNaN(inProgress) ? 0 : inProgress;

  const staffEnrolled = Number(kpi?.staffEnrolled ?? 0) || 0;
  const staffCompleted = Number(kpi?.staffCompleted ?? 0) || 0;

  // Safe completion rate calculation: check if explicit valid number, else calculate with zero-division check
  const rawCompletionRate = kpi?.completionRate;
  const calculatedCompletionRate = staffEnrolled > 0
    ? Math.round((staffCompleted / staffEnrolled) * 100)
    : 0;

  const completionRate = (rawCompletionRate !== undefined && rawCompletionRate !== null && !isNaN(Number(rawCompletionRate)))
    ? Math.round(Number(rawCompletionRate))
    : calculatedCompletionRate;
  const safeCompletionRate = isNaN(completionRate) ? 0 : Math.min(Math.max(completionRate, 0), 100);

  const cards = [
    {
      label: 'Training Planned',
      value: workshopsScheduled,
      description: 'Workshops scheduled this cycle',
    },
    {
      label: 'Training In Progress',
      value: safeInProgress,
      description: 'Scheduled, not yet completed',
    },
    {
      label: 'Training Completed',
      value: workshopsCompleted,
      description: `${staffCompleted.toLocaleString()} staff completed`,
    },
    {
      label: 'Completion Rate',
      value: `${safeCompletionRate}%`,
      description: `${staffEnrolled.toLocaleString()} staff enrolled`,
    },
  ];

  const rawCompetencies = Array.isArray(analytics?.kcmCompetencies) && analytics.kcmCompetencies.length > 0
    ? analytics.kcmCompetencies
    : (Array.isArray(analytics?.kcmRadar) ? analytics.kcmRadar : []);

  const demandByCompetency = [...rawCompetencies]
    .map((c) => {
      const subject = c?.subject || c?.name || 'General Competency';
      const affectedStaff = Number(c?.affectedStaff ?? c?.needTraining ?? 0) || 0;
      return { subject, affectedStaff };
    })
    .filter((c) => c.affectedStaff > 0)
    .sort((a, b) => b.affectedStaff - a.affectedStaff)
    .slice(0, 5);

  const divisionStatus = (analytics?.divisionData || []).map((d) => {
    const proficient = Number(d?.proficient ?? 0) || 0;
    const needTraining = Number(d?.needTraining ?? 0) || 0;
    const total = proficient + needTraining;
    const calculatedReadiness = total > 0 ? Math.round((proficient / total) * 100) : 0;
    const rawReadiness = d?.readinessPercent;
    const readinessPercent = (rawReadiness !== undefined && rawReadiness !== null && !isNaN(Number(rawReadiness)))
      ? Number(rawReadiness)
      : calculatedReadiness;

    const code = d?.code || (d?.name ? d.name.split(' ')[0] : 'DIV');
    const name = d?.name || 'Unknown Division';

    return {
      code,
      name,
      readinessPercent: isNaN(readinessPercent) ? 0 : readinessPercent,
      needTraining,
    };
  });

  return (
    <Box>
      <PageHeader
        title="Training Progress"
        subtitle="How identified competency gaps are translating into training activity"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <StatCard label={card.label} value={card.value} description={card.description} tone="primary" />
            </Grid>
          ))}
        </Grid>

        <Card sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Monthly completion trend
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Staff enrolled vs. staff completed, by month
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#D9E1E7" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid #D9E1E7',
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="enrolled" name="Staff enrolled" stroke="#123B5D" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="completedStaff"
                  name="Staff completed"
                  stroke="#C97A1E"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.8rem' }}>
            Shows how identified competency gaps are translating into training activity.
          </Typography>
        </Card>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Training demand by competency
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workforce still needing training, per KCM competency
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={demandByCompetency} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#D9E1E7" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="subject" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #D9E1E7', borderRadius: 8 }} />
                    <Bar dataKey="affectedStaff" name="People needing training" radius={[0, 6, 6, 0]} fill="#1F5A7A" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Division-wise training status
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Readiness and remaining training demand, by division
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Division</TableCell>
                      <TableCell align="right">Readiness</TableCell>
                      <TableCell align="right">Needs Training</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {divisionStatus.map((d) => (
                      <TableRow key={d.code} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{d.name}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {d.readinessPercent ?? 0}%
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {(d.needTraining ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {divisionStatus.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                          No division training data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography variant="h6" gutterBottom>
              Workshop status
            </Typography>
          </Box>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Workshop</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workshops.map((w, idx) => (
                  <TableRow key={w?.name || idx} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{w?.name ?? 'Unnamed Workshop'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{w?.division ?? 'General'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{w?.date ?? 'Scheduled'}</TableCell>
                    <TableCell>
                      <StatusChip status={w?.status ?? 'Scheduled'} />
                    </TableCell>
                  </TableRow>
                ))}
                {workshops.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No workshops recorded for this cycle.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
