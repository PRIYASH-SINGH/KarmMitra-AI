import React from 'react';
import { Card, Typography, Box, Divider } from '@mui/material';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

/**
 * Visualizes the delta between the required KCM threshold and the current
 * measured workforce level, per competency.
 */
export default function CompetencyRadar({ data }) {
  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        KCM competency gap
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Required threshold vs. current workforce level, by functional standard
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="#D9E1E7" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#5F6F7A', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar
              name="Required threshold"
              dataKey="required"
              stroke="#123B5D"
              fill="#123B5D"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            <Radar
              name="Current workforce level"
              dataKey="current"
              stroke="#C97A1E"
              fill="#C97A1E"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', paddingTop: 12 }}
            />
            <Tooltip
              contentStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                border: '1px solid #D9E1E7',
                borderRadius: 3,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
