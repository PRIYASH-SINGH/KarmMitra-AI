import React from 'react';
import { Box, Typography } from '@mui/material';

export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <Box
      sx={{
        px: { xs: 3, md: 6 },
        pt: 5,
        pb: 3,
        borderBottom: '1px solid #D9E1E7',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        {eyebrow && (
          <Typography variant="overline" color="text.secondary">
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h5" color="primary" sx={{ mt: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}
