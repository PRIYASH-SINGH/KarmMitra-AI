import React from 'react';
import { Card, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

/**
 * A KPI card: a plain-language label, the figure itself, and a short
 * supporting description so administrators never have to guess what a
 * number means. Clickable when onClick is supplied, opening a drill-down
 * drawer with the underlying breakdown.
 */
export default function StatCard({ label, value, description, tone = 'primary', onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        borderTop: (theme) => `3px solid ${theme.palette[tone].main}`,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(18,59,93,0.12)' }
          : undefined,
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ color: (theme) => theme.palette[tone].main, lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {description}
        </Typography>
      )}
      {onClick && (
        <ArrowOutwardIcon
          fontSize="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary', opacity: 0.5 }}
        />
      )}
    </Card>
  );
}
