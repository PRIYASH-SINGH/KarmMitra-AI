import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  InputBase,
  Select,
  MenuItem,
  Button,
  Avatar,
  Typography,
  CircularProgress,
  Divider,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { useFilters } from '../context/FilterContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { useNotification } from '../context/NotificationContext';
import { ASSESSMENT_CYCLES } from '../data/mockData';

const PAGE_TITLES = {
  '/': 'Overview',
  '/competency-intelligence': 'Competency Gaps',
  '/state-readiness': 'State & UT Readiness',
  '/division-readiness': 'Division Readiness',
  '/training-throughput': 'Training Progress',
  '/competency-matrix': 'KCM Competency Matrix',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function TopHeader({ onMenuClick, isMobile }) {
  const { filters, setFilter, resetFilters } = useFilters();
  const { analytics, loading, refresh, lastUpdated } = useAnalytics();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [exporting, setExporting] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'KarmMitra AI';
  const filterOptions = analytics?.filterOptions;

  const handleRefresh = async () => {
    await refresh();
    notify('Dashboard refreshed with the latest available data.', 'success');
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      notify('Report export queued — you will find it in Reports shortly.', 'success');
    }, 900);
  };

  const handleResetFilters = () => {
    resetFilters();
    notify('Filters reset.', 'success');
  };

  const closeProfileMenu = () => setProfileAnchor(null);

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Row 1 — page title, data status, and global actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 2, md: 3 },
          pt: 1.5,
          pb: 1,
          flexWrap: 'wrap',
        }}
      >
        {isMobile && (
          <IconButton onClick={onMenuClick} size="small">
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, mr: 1 }}>
          {pageTitle}
        </Typography>

        <Chip
          size="small"
          label={analytics?.isLive ? 'LIVE DATA' : 'DEMO DATA'}
          sx={{
            bgcolor: analytics?.isLive ? '#E7F3EC' : '#FBF1E0',
            color: analytics?.isLive ? '#2E7D5B' : '#B7791F',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
          }}
        />

        <Box sx={{ flex: 1 }} />

        {lastUpdated && !isMobile && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}

        <Button
          size="small"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon fontSize="small" />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>

        <Button
          size="small"
          variant="contained"
          color="secondary"
          startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <FileDownloadOutlinedIcon fontSize="small" />}
          onClick={handleExport}
          disabled={exporting}
        >
          Export Report
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

        <IconButton
          onClick={(e) => setProfileAnchor(e.currentTarget)}
          size="small"
          aria-label="Profile menu"
          aria-controls={profileAnchor ? 'profile-menu' : undefined}
          aria-haspopup="true"
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
            <PersonOutlineOutlinedIcon fontSize="small" />
          </Avatar>
        </IconButton>
        <Menu
          id="profile-menu"
          anchorEl={profileAnchor}
          open={!!profileAnchor}
          onClose={closeProfileMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <ListItemIcon>
              <PersonOutlineOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Administrator" secondary="Institutional access" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              closeProfileMenu();
              navigate('/settings');
            }}
          >
            <ListItemIcon>
              <TuneOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard preferences" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeProfileMenu();
              notify('Signed out of this session.', 'success');
            }}
          >
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Row 2 — search and governance filters */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: { xs: 2, md: 3 },
          pb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            flex: '1 1 220px',
            maxWidth: 320,
          }}
        >
          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <InputBase
            placeholder="Search state, division, competency…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            sx={{ fontSize: '0.85rem', width: '100%' }}
          />
        </Box>

        <Select
          size="small"
          value={filters.cycle}
          onChange={(e) => setFilter('cycle', e.target.value)}
          sx={{ fontSize: '0.8rem', minWidth: 150 }}
        >
          {ASSESSMENT_CYCLES.map((c) => (
            <MenuItem key={c} value={c} sx={{ fontSize: '0.8rem' }}>
              {c}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={filters.state}
          onChange={(e) => setFilter('state', e.target.value)}
          sx={{ fontSize: '0.8rem', minWidth: 150 }}
        >
          <MenuItem value="All" sx={{ fontSize: '0.8rem' }}>
            State / UT: All
          </MenuItem>
          {(filterOptions?.states || []).map((s) => (
            <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>
              {s}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={filters.division}
          onChange={(e) => setFilter('division', e.target.value)}
          sx={{ fontSize: '0.8rem', minWidth: 150 }}
        >
          <MenuItem value="All" sx={{ fontSize: '0.8rem' }}>
            Division: All
          </MenuItem>
          {(filterOptions?.divisions || []).map((d) => (
            <MenuItem key={d.code} value={d.code} sx={{ fontSize: '0.8rem' }}>
              {d.name}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={filters.competency}
          onChange={(e) => setFilter('competency', e.target.value)}
          sx={{ fontSize: '0.8rem', minWidth: 170 }}
        >
          <MenuItem value="All" sx={{ fontSize: '0.8rem' }}>
            Competency: All
          </MenuItem>
          {(filterOptions?.competencies || []).map((c) => (
            <MenuItem key={c} value={c} sx={{ fontSize: '0.8rem' }}>
              {c}
            </MenuItem>
          ))}
        </Select>

        <Button
          size="small"
          variant="text"
          startIcon={<RestartAltOutlinedIcon fontSize="small" />}
          onClick={handleResetFilters}
          sx={{ color: 'text.secondary' }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
