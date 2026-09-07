import React from 'react';
import { Chip } from '@mui/material';

// Central status/priority vocabulary used across Competency Gaps, State & UT
// Readiness, Division Readiness and the KCM Matrix so the same word always
// maps to the same colour throughout the app.
const COLOR_MAP = {
  Optimal: { bg: '#E7F3EC', fg: '#2E7D5B' },
  'On Track': { bg: '#E7F3EC', fg: '#2E7D5B' },
  Proficient: { bg: '#E7F3EC', fg: '#2E7D5B' },
  Completed: { bg: '#E7F3EC', fg: '#2E7D5B' },

  'Review Needed': { bg: '#FBF1E0', fg: '#B7791F' },
  'Needs Attention': { bg: '#FBF1E0', fg: '#B7791F' },
  Developing: { bg: '#FBF1E0', fg: '#B7791F' },
  'Needs Training': { bg: '#FBF1E0', fg: '#B7791F' },
  Moderate: { bg: '#FBF1E0', fg: '#B7791F' },
  High: { bg: '#FBF1E0', fg: '#B7791F' },

  'Critical Gap': { bg: '#FBEAEA', fg: '#B54747' },
  'Priority Support': { bg: '#FBEAEA', fg: '#B54747' },
  Critical: { bg: '#FBEAEA', fg: '#B54747' },

  Scheduled: { bg: '#E7EEF3', fg: '#123B5D' },
};

export default function StatusChip({ status, size = 'small' }) {
  const colors = COLOR_MAP[status] || { bg: '#E7EEF3', fg: '#123B5D' };
  return (
    <Chip
      label={status}
      size={size}
      sx={{
        bgcolor: colors.bg,
        color: colors.fg,
        fontWeight: 600,
      }}
    />
  );
}
