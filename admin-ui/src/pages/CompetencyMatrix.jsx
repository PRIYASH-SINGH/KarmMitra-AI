import React, { useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  InputBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../components/PageHeader';
import DetailDrawer from '../components/DetailDrawer';
import StatRowList from '../components/StatRowList';
import StatusChip from '../components/StatusChip';
import { useAnalytics } from '../context/AnalyticsContext';

export default function CompetencyMatrix() {
  const { analytics, loading } = useAnalytics();
  const [activeRow, setActiveRow] = useState(null);
  const [search, setSearch] = useState('');

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading competency matrix…
        </Typography>
      </Box>
    );
  }

  const { divisions, rows } = analytics.competencyMatrix;
  const visibleRows = rows.filter((row) =>
    row.competency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <PageHeader
        title="KCM Competency Matrix"
        subtitle="Competency readiness status by division — click a row for the full breakdown"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            maxWidth: 320,
            mb: 2.5,
            bgcolor: 'background.paper',
          }}
        >
          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <InputBase
            placeholder="Search competency…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ fontSize: '0.85rem', width: '100%' }}
          />
        </Box>

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Competency</TableCell>
                  {divisions.map((d) => (
                    <TableCell key={d} align="center" sx={{ fontFamily: 'monospace' }}>
                      {d}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.competency} hover onClick={() => setActiveRow(row)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 500 }}>{row.competency}</TableCell>
                    {divisions.map((d) => (
                      <TableCell key={d} align="center">
                        <StatusChip status={row.cells[d]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {visibleRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={divisions.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No competencies match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <DetailDrawer
        open={!!activeRow}
        onClose={() => setActiveRow(null)}
        eyebrow="Competency matrix detail"
        title={activeRow?.competency}
      >
        {activeRow && (
          <StatRowList
            rows={divisions.map((d) => ({ label: d, value: activeRow.cells[d] }))}
          />
        )}
      </DetailDrawer>
    </Box>
  );
}
