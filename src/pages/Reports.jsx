import React, { useState } from 'react';
import { Box, Grid, Card, Typography, Button, Stack } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PageHeader from '../components/PageHeader';
import DetailDrawer from '../components/DetailDrawer';
import { useAnalytics } from '../context/AnalyticsContext';
import { useNotification } from '../context/NotificationContext';

// Builds the tabular data behind each report from the same analytics payload
// every other page reads, so a report's numbers are never invented — only
// exported or previewed.
function buildReportTable(reportId, analytics) {
  switch (reportId) {
    case 'report-institutional':
      return {
        headers: ['Metric', 'Value'],
        rows: [
          ['Total assessed', analytics.kpi.totalAssessed],
          ['Average readiness', `${analytics.kpi.averageReadiness}%`],
          ['Critical competency gaps', analytics.kpi.criticalSkillGaps],
          ['Training actions scheduled', analytics.kpi.nsstaWorkshopsScheduled],
        ],
      };
    case 'report-state':
      return {
        headers: ['State / UT', 'Assessed Workforce', 'Readiness %', 'Training Completion %', 'Status'],
        rows: analytics.stateRankings.map((s) => [s.state, s.totalStaff, s.readiness, s.completionRate, s.status]),
      };
    case 'report-competency':
      return {
        headers: ['Competency', 'Required', 'Current', 'Gap', 'People Affected'],
        rows: analytics.kcmCompetencies.map((c) => [
          c.subject,
          c.required,
          c.current,
          Math.max(c.required - c.current, 0),
          c.affectedStaff,
        ]),
      };
    case 'report-division':
      return {
        headers: ['Division', 'Proficient', 'Needs Training', 'Readiness %'],
        rows: analytics.divisionData.map((d) => [d.name, d.proficient, d.needTraining, d.readinessPercent]),
      };
    case 'report-throughput':
      return {
        headers: ['Month', 'Scheduled', 'Completed', 'Staff Enrolled', 'Staff Completed'],
        rows: analytics.trainingThroughput.monthly.map((m) => [
          m.month,
          m.scheduled,
          m.completed,
          m.enrolled,
          m.completedStaff,
        ]),
      };
    default:
      return { headers: [], rows: [] };
  }
}

function downloadCsv(filename, headers, rows) {
  const escape = (val) => {
    const s = String(val ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { analytics, loading } = useAnalytics();
  const { notify } = useNotification();
  const [activeReport, setActiveReport] = useState(null);

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading reports…
        </Typography>
      </Box>
    );
  }

  const handleExportCsv = (report) => {
    const { headers, rows } = buildReportTable(report.id, analytics);
    downloadCsv(`${report.id}.csv`, headers, rows);
    notify(`${report.title} exported as CSV.`, 'success');
  };

  const handleExportPdf = () => {
    notify('PDF export isn\u2019t connected yet — use View Report or Export CSV for now.', 'info');
  };

  const activeTable = activeReport ? buildReportTable(activeReport.id, analytics) : null;

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Generate cycle reports for MoSPI leadership and state bureau review"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <Grid container spacing={2.5}>
          {analytics.reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <DescriptionOutlinedIcon sx={{ color: 'primary.main', fontSize: 28, mb: 1.5 }} />
                <Typography variant="h6" gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2 }}>
                  {report.description}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                    onClick={() => setActiveReport(report)}
                  >
                    View Report
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
                    onClick={() => handleExportCsv(report)}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<PictureAsPdfOutlinedIcon fontSize="small" />}
                    onClick={handleExportPdf}
                    sx={{ color: 'text.secondary' }}
                  >
                    Export PDF
                  </Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <DetailDrawer
        open={!!activeReport}
        onClose={() => setActiveReport(null)}
        eyebrow="Report preview"
        title={activeReport?.title}
      >
        {activeReport && activeTable && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activeReport.description}
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    {activeTable.headers.map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          borderBottom: '2px solid #123B5D',
                          padding: '6px 8px',
                          color: '#5F6F7A',
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTable.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ borderBottom: '1px solid #D9E1E7', padding: '6px 8px' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ mt: 3 }}
              startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
              onClick={() => handleExportCsv(activeReport)}
            >
              Export CSV
            </Button>
          </Box>
        )}
      </DetailDrawer>
    </Box>
  );
}
