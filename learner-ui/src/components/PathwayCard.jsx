import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

export default function PathwayCard({ pathway, onActionClick }) {
  // Determine pathway theme attributes based on 70:20:10 model
  const getPathwayStyle = (type) => {
    switch (type) {
      case '10_formal':
        return {
          icon: <SchoolIcon sx={{ fontSize: 24, color: '#1B4782' }} />,
          headerBg: '#EFF6FF',
          badgeColor: '#1B4782',
          badgeText: '#FFFFFF',
          borderColor: '#BFDBFE',
          accent: '#1B4782',
          label: '10% FORMAL COURSE',
          descriptionLead: 'Structured Courseware & Manuals',
        };
      case '20_collaborative':
        return {
          icon: <GroupsIcon sx={{ fontSize: 24, color: '#0F766E' }} />,
          headerBg: '#F0FDFA',
          badgeColor: '#0F766E',
          badgeText: '#FFFFFF',
          borderColor: '#99F6E4',
          accent: '#0F766E',
          label: '20% COLLABORATIVE / PEER WORKSHOP',
          descriptionLead: 'Social Learning & Mentorship',
        };
      case '70_experiential':
      default:
        return {
          icon: <EngineeringIcon sx={{ fontSize: 24, color: '#C2410C' }} />,
          headerBg: '#FFF7ED',
          badgeColor: '#EA580C',
          badgeText: '#FFFFFF',
          borderColor: '#FED7AA',
          accent: '#EA580C',
          label: '70% EXPERIENTIAL / ON-THE-JOB ACTIVITY',
          descriptionLead: 'Hands-on Real Scenario Sandbox',
        };
    }
  };

  const style = getPathwayStyle(pathway.type);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: `1.5px solid ${style.borderColor}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(13, 46, 92, 0.12)',
        },
      }}
    >
      {/* Top Banner Tag */}
      <Box
        sx={{
          bgcolor: style.headerBg,
          px: 2.5,
          py: 1.5,
          borderBottom: `1px solid ${style.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Chip
          label={style.label}
          size="small"
          sx={{
            bgcolor: style.badgeColor,
            color: style.badgeText,
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: '0.5px',
          }}
        />
        {style.icon}
      </Box>

      {/* Card Body */}
      <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#0D2E5C',
            fontSize: '1.05rem',
            lineHeight: 1.35,
            mb: 1.5,
          }}
        >
          {pathway.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            mb: 2,
          }}
        >
          {pathway.description}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Metadata: Mapped Competency */}
        <Box sx={{ mb: 1.2 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
            MAPPED COMPETENCY:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0D2E5C' }}>
            {pathway.mappedCompetency}
          </Typography>
        </Box>

        {/* Metadata: Estimated Duration */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.5 }}>
          <AccessTimeIcon sx={{ fontSize: 16, color: '#64748B' }} />
          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
            Estimated Duration: <strong>{pathway.estimatedDuration}</strong>
          </Typography>
        </Box>
      </CardContent>

      {/* Card Action Button */}
      <CardActions sx={{ p: 2.5, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          endIcon={pathway.type === '70_experiential' ? <PlayCircleOutlineIcon /> : <ArrowForwardIcon />}
          onClick={() => onActionClick(pathway)}
          sx={{
            bgcolor: style.accent,
            color: '#FFFFFF',
            fontWeight: 700,
            py: 1,
            '&:hover': {
              bgcolor: style.badgeColor,
              filter: 'brightness(0.92)',
            },
          }}
        >
          {pathway.actionText}
        </Button>
      </CardActions>
    </Card>
  );
}
