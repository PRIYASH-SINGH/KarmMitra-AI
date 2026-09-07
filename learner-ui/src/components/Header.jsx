import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LanguageIcon from '@mui/icons-material/Language';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HubIcon from '@mui/icons-material/Hub';

export default function Header({
  learner,
  language,
  onLanguageChange,
  isMockMode,
  onToggleMockMode,
}) {
  return (
    <AppBar
      position="sticky"
      elevation={2}
      sx={{
        bgcolor: '#0D2E5C', // Deep Government Navy Blue
        borderBottom: '3px solid #F37021', // Tricolor Saffron accent line
      }}
    >
      {/* Top micro-bar: Government of India / Mission Karmayogi identification */}
      <Box
        sx={{
          bgcolor: '#071C38',
          py: 0.5,
          px: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#CBD5E1',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#138808', // Green dot
            }}
          />
          <span>Government of India • Ministry of Statistics and Programme Implementation (MoSPI)</span>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>Mission Karmayogi | National Programme for Civil Services Capacity Building</span>
        </Box>
      </Box>

      {/* Main App Toolbar */}
      <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1, gap: 2 }}>
        {/* Brand & Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '2px solid #F37021',
            }}
          >
            <HubIcon sx={{ color: '#0D2E5C', fontSize: 30 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  color: '#FFFFFF',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                }}
              >
                KarmMitra <Box component="span" sx={{ color: '#F37021' }}>AI</Box>
              </Typography>
              <Chip
                label="SIH 2026 #26101"
                size="small"
                sx={{
                  bgcolor: 'rgba(243, 112, 33, 0.2)',
                  color: '#FFB74D',
                  border: '1px solid rgba(243, 112, 33, 0.4)',
                  fontSize: '0.68rem',
                  height: 22,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem' }}
            >
              Dynamic Assessment & 70:20:10 Competency Framework
            </Typography>
          </Box>
        </Box>

        {/* Backend / Mock Mode Indicator */}
        <Tooltip
          title={
            isMockMode
              ? 'Running in Standalone Mock Mode (No backend required). Click switch to toggle.'
              : 'Connected to Live Backend (http://localhost:8000).'
          }
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.08)',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!isMockMode}
                  onChange={(e) => onToggleMockMode(!e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Typography variant="caption" sx={{ color: isMockMode ? '#FFB74D' : '#81C784' }}>
                  {isMockMode ? 'Mode: Standalone Mock' : 'Mode: Live API'}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </Tooltip>

        {/* Language Option Dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LanguageIcon sx={{ fontSize: 18, mr: 0.5, color: '#CBD5E1' }} />
          <FormControl size="small" variant="standard">
            <Select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disableUnderline
              sx={{
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                '& .MuiSelect-icon': { color: '#FFFFFF' },
              }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Learner Info Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            py: 0.6,
            px: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#F37021',
              color: '#FFFFFF',
              width: 34,
              height: 34,
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {learner?.avatar || 'LK'}
          </Avatar>
          <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#FFFFFF' }}>
              {learner?.name || 'Learner'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD', display: 'block', fontSize: '0.7rem' }}>
              {learner?.roleTitle || 'Civil Services Trainee'} •{' '}
              <Box component="span" sx={{ color: '#FFD166', fontWeight: 600 }}>
                {learner?.roleCode || 'MOSPI_FOD_INV_01'}
              </Box>
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
