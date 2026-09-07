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

  const { kpi, monthly, workshops } = analytics.trainingThroughput;
  const inProgress = Math.max(kpi.workshopsScheduled - kpi.workshopsCompleted, 0);

  const cards = [
    { label: 'Training Planned', value: kpi.workshopsScheduled, description: 'Workshops scheduled this cycle' },
    { label: 'Training In Progress', value: inProgress, description: 'Scheduled, not yet completed' },
    { label: 'Training Completed', value: kpi.workshopsCompleted, description: `${kpi.staffCompleted.toLocaleString()} staff completed` },
    { label: 'Completion Rate', value: `${kpi.completionRate}%`, description: `${kpi.staffEnrolled.toLocaleString()} staff enrolled` },
  ];

  const demandByCompetency = [...analytics.kcmCompetencies]
    .map((c) => ({ subject: c.subject, affectedStaff: c.affectedStaff }))
    .filter((c) => c.affectedStaff > 0)
    .sort((a, b) => b.affectedStaff - a.affectedStaff);

  const divisionStatus = analytics.divisionData.map((d) => ({
    code: d.code,
    name: d.name,
    readinessPercent: d.readinessPercent,
    needTraining: d.needTraining,
  }));

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
                          {d.readinessPercent}%
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {d.needTraining.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
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
                {workshops.map((w) => (
                  <TableRow key={w.name} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{w.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{w.division}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{w.date}</TableCell>
                    <TableCell>
                      <StatusChip status={w.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
