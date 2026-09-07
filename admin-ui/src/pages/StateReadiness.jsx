import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
  Typography,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import GlobalFilters from '../components/GlobalFilters';
import DetailDrawer from '../components/DetailDrawer';
import StatusChip from '../components/StatusChip';
import { useAnalytics } from '../context/AnalyticsContext';
import { useFilters, applyStateFilters } from '../context/FilterContext';

// Backend status values (Optimal / Review Needed / Critical Gap) are kept
// intact in the data layer; this maps them to the plain-language priority
// label an administrator scans a table for.
const PRIORITY_LABEL = {
  Optimal: 'On Track',
  'Review Needed': 'Needs Attention',
  'Critical Gap': 'Priority Support',
};

export default function StateReadiness() {
  const { analytics, loading } = useAnalytics();
  const { filters } = useFilters();
  const [orderBy, setOrderBy] = useState('totalStaff');
  const [order, setOrder] = useState('desc');
  const [activeState, setActiveState] = useState(null);

  const rows = analytics ? applyStateFilters(analytics.stateRankings, filters) : [];

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[orderBy];
      const bv = b[orderBy];
      if (typeof av === 'string') return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return order === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }, [rows, orderBy, order]);

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(field);
      setOrder('desc');
    }
  };

  if (loading || !analytics) {
    return (
      <Box sx={{ p: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Loading state readiness data…
        </Typography>
      </Box>
    );
  }

  const detail = activeState ? analytics.stateDetails[activeState.state] : null;

  return (
    <Box>
      <PageHeader
        title="State & UT Readiness"
        subtitle="Compare workforce readiness across States and Union Territories"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4 }}>
        <GlobalFilters
          fields={['status']}
          options={{ status: analytics.filterOptions.statuses }}
        />

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'state'} direction={order} onClick={() => handleSort('state')}>
                      State / UT
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'totalStaff'}
                      direction={order}
                      onClick={() => handleSort('totalStaff')}
                    >
                      Assessed Workforce
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'readiness'}
                      direction={order}
                      onClick={() => handleSort('readiness')}
                    >
                      Readiness
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'completionRate'}
                      direction={order}
                      onClick={() => handleSort('completionRate')}
                    >
                      Training Completion
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.map((row) => (
                  <TableRow key={row.state} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{row.state}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {row.totalStaff.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {row.readiness}%
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {row.completionRate}%
                    </TableCell>
                    <TableCell>
                      <StatusChip status={PRIORITY_LABEL[row.status] || row.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => setActiveState(row)}>
                        View state
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No states match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <DetailDrawer
        open={!!activeState}
        onClose={() => setActiveState(null)}
        eyebrow="State / UT detail"
        title={activeState?.state}
      >
        {activeState && detail && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {detail.note}
            </Typography>
            <StatusChip status={PRIORITY_LABEL[activeState.status] || activeState.status} />
            <Box sx={{ mt: 3 }}>
              {[
                { label: 'Assessed workforce', value: activeState.totalStaff.toLocaleString() },
                { label: 'Readiness score', value: `${activeState.readiness}%` },
                { label: 'Training completion', value: `${activeState.completionRate}%` },
                { label: 'Critical gaps', value: activeState.criticalGaps },
                { label: 'Top competency gap', value: detail.topGap },
                { label: 'Workshops held this cycle', value: detail.workshopsHeld },
                { label: 'Next scheduled workshop', value: detail.nextWorkshop },
              ].map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {row.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DetailDrawer>
    </Box>
  );
}
