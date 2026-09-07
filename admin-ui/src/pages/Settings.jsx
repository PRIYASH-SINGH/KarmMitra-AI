import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Divider,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PageHeader from '../components/PageHeader';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { notify } = useNotification();
  const [denseTables, setDenseTables] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const handleSave = () => {
    notify('Dashboard preferences saved.', 'success');
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Account"
        title="Settings & Profile"
        subtitle="Administrator profile and dashboard preferences"
      />
      <Box sx={{ px: { xs: 3, md: 6 }, py: 4, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 640 }}>
        <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            <PersonOutlineOutlinedIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">Administrator</Typography>
            <Typography variant="body2" color="text.secondary">
              Institutional access — MoSPI / NSSTA governance role
            </Typography>
          </Box>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dashboard preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Controls how data is displayed across KarmMitra AI
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={<Switch checked={denseTables} onChange={(e) => setDenseTables(e.target.checked)} />}
            label="Compact table rows"
          />
          <Box>
            <FormControlLabel
              control={<Switch checked={emailDigest} onChange={(e) => setEmailDigest(e.target.checked)} />}
              label="Weekly readiness summary by email"
            />
          </Box>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>
            Save preferences
          </Button>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            About KarmMitra AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            KarmMitra AI is a workforce competency intelligence layer for iGOT Karmayogi / MoSPI capacity
            building, helping institutional administrators track readiness, competency gaps, and training
            progress against the 34 KCM competencies.
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
