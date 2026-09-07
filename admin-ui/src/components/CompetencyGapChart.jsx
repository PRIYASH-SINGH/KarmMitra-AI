import React from 'react';
import { Card, Typography, Box, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * Horizontal-reading gap distribution: required minus current, per
 * competency, sorted worst-first. Bars past the 20-point line are flagged
 * in the alert color so the "top critical gaps" are visible at a glance.
 */
export default function CompetencyGapChart({ competencies }) {
  const data = [...competencies]
    .map((c) => ({ subject: c.subject, gap: Math.max(c.required - c.current, 0) }))
    .sort((a, b) => b.gap - a.gap);

  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Competency gap distribution
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Required minus current level, ranked worst-first
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#D9E1E7" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="subject"
              width={150}
              tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            />
            <Tooltip
              contentStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                border: '1px solid #D9E1E7',
                borderRadius: 3,
              }}
            />
            <Bar dataKey="gap" name="Gap (points)" radius={[0, 3, 3, 0]}>
              {data.map((entry) => (
                <Cell key={entry.subject} fill={entry.gap >= 20 ? '#C97A1E' : '#123B5D'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
