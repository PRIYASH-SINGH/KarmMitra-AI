import React from 'react';
import { Card, Typography, Box, Divider } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Headcount split — competency cleared vs. active gap — across the four
 * MoSPI operational divisions (FOD, SDRD, NAD, NSSTA).
 */
export default function DivisionReadiness({ data }) {
  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Training demand by division
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Workforce at required level vs. needing training, across FOD, SDRD, NAD and NSSTA
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#D9E1E7" />
            <XAxis
              dataKey="code"
              tick={{ fontSize: 12, fontFamily: 'monospace', fill: '#172B3A' }}
              axisLine={{ stroke: '#123B5D' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#5F6F7A' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                border: '1px solid #D9E1E7',
                borderRadius: 3,
              }}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?.name ?? label
              }
            />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
            <Bar dataKey="proficient" name="At required level" stackId="a" fill="#123B5D" />
            <Bar dataKey="needTraining" name="Needs training" stackId="a" fill="#C97A1E" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
