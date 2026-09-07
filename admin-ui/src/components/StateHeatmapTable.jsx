import React from 'react';
import {
  Card,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import StatusChip from './StatusChip';

// Renders the completion rate as an inline horizontal bar rather than a
// colored chip — this is what makes the table read as a heatmap without
// resorting to a full grid-of-colored-cells widget.
function CompletionBar({ value }) {
  const color = value >= 75 ? '#2E7D5B' : value >= 55 ? '#B7791F' : '#B54747';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
      <Box sx={{ flex: 1, height: 6, bgcolor: '#E7ECEF', borderRadius: 3, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${value}%`,
            bgcolor: color,
            borderRadius: 3,
          }}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{ fontFamily: 'monospace', fontSize: '0.78rem', width: 34, textAlign: 'right' }}
      >
        {value}%
      </Typography>
    </Box>
  );
}

export default function StateHeatmapTable({ data }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        State &amp; UT readiness overview
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Assessment completion by state, ranked by assessed workforce
      </Typography>
      <Divider sx={{ my: 2 }} />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>State / UT</TableCell>
              <TableCell align="right">Assessed workforce</TableCell>
              <TableCell>Completion rate</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.state} hover>
                <TableCell sx={{ fontWeight: 500 }}>{row.state}</TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {row.totalStaff.toLocaleString()}
                </TableCell>
                <TableCell>
                  <CompletionBar value={row.completionRate} />
                </TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
