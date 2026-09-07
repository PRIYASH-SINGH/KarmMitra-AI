import React from 'react';
import { Box, Typography } from '@mui/material';

export default function StatRowList({ rows }) {
  return (
    <Box>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {row.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontWeight: 500, color: row.color || 'text.primary' }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
