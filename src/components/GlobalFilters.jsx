import React from 'react';
import { Box, Select, MenuItem, Typography } from '@mui/material';
import { useFilters } from '../context/FilterContext';

const FIELD_LABEL = {
  state: 'State / UT',
  division: 'Division',
  competency: 'Competency',
  status: 'Priority',
};

// Backend status values stay intact in filter state/data; this only changes
// what the dropdown displays, so it matches the Priority vocabulary shown
// throughout State & UT Readiness and the KCM Matrix.
const OPTION_DISPLAY_LABEL = {
  Optimal: 'On Track',
  'Review Needed': 'Needs Attention',
  'Critical Gap': 'Priority Support',
};

/**
 * Renders a subset of the global filters (picked via `fields`) as a compact
 * select bar. Every page that needs filtering reuses this instead of
 * building its own dropdowns, so filter state stays in one context.
 */
export default function GlobalFilters({ fields, options }) {
  const { filters, setFilter } = useFilters();

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ mr: 0.5 }}>
        Filter
      </Typography>
      {fields.map((field) => (
        <Select
          key={field}
          size="small"
          value={filters[field]}
          onChange={(e) => setFilter(field, e.target.value)}
          sx={{ fontSize: '0.8rem', minWidth: 170 }}
        >
          <MenuItem value="All" sx={{ fontSize: '0.8rem' }}>
            {FIELD_LABEL[field]}: All
          </MenuItem>
          {(options[field] || []).map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: '0.8rem' }}>
              {OPTION_DISPLAY_LABEL[opt] || opt}
            </MenuItem>
          ))}
        </Select>
      ))}
    </Box>
  );
}
