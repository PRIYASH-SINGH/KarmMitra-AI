import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const SIDEBAR_WIDTH = 264;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

const NAV_ITEMS = [
  { label: 'Overview', path: '/', icon: DashboardOutlinedIcon },
  { label: 'Competency Gaps', path: '/competency-intelligence', icon: PsychologyOutlinedIcon },
  { label: 'State & UT Readiness', path: '/state-readiness', icon: PublicOutlinedIcon },
  { label: 'Division Readiness', path: '/division-readiness', icon: AccountTreeOutlinedIcon },
  { label: 'Training Progress', path: '/training-throughput', icon: SchoolOutlinedIcon },
  { label: 'KCM Competency Matrix', path: '/competency-matrix', icon: GridViewOutlinedIcon },
  { label: 'Reports', path: '/reports', icon: DescriptionOutlinedIcon },
  { label: 'Settings / Profile', path: '/settings', icon: SettingsOutlinedIcon },
];

function SidebarContent({ collapsed, onToggleCollapse, isMobile }) {
  const location = useLocation();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#123B5D',
        color: '#F5F7F9',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2.5,
          py: 2.5,
        }}
      >
        {!collapsed && (
          <Box>
            <Typography variant="h6" sx={{ color: '#F5F7F9', lineHeight: 1.15, fontWeight: 700 }}>
              KarmMitra AI
            </Typography>
            <Typography
              variant="overline"
              sx={{ color: 'rgba(245,247,249,0.65)', letterSpacing: '0.05em', fontWeight: 500 }}
            >
              Workforce Competency Intelligence
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            sx={{ color: '#F5F7F9', border: '1px solid rgba(245,247,249,0.25)' }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(245,247,249,0.15)' }} />

      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1.5, py: 1.5 }}>
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          const item = (
            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              selected={active}
              sx={{
                mb: 0.5,
                borderRadius: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? '#123B5D' : 'rgba(245,247,249,0.85)',
                bgcolor: active ? '#F5F7F9' : 'transparent',
                '&:hover': { bgcolor: active ? '#F5F7F9' : 'rgba(245,247,249,0.08)' },
                '&.Mui-selected': { bgcolor: '#F5F7F9' },
                '&.Mui-selected:hover': { bgcolor: '#F5F7F9' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: active ? '#123B5D' : 'rgba(245,247,249,0.85)',
                  justifyContent: 'center',
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 500 }}
                />
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={path} title={label} placement="right">
              <Box>{item}</Box>
            </Tooltip>
          ) : (
            item
          );
        })}
      </List>

      {!collapsed && (
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid rgba(245,247,249,0.15)' }}>
          <Typography variant="body2" sx={{ color: 'rgba(245,247,249,0.85)', fontSize: '0.75rem', fontWeight: 600 }}>
            KarmMitra AI
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(245,247,249,0.5)', fontSize: '0.68rem' }}>
            Institutional Intelligence Platform
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, isMobile, mobileOpen, onCloseMobile }) {
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' } }}
      >
        <SidebarContent collapsed={false} isMobile onToggleCollapse={onToggleCollapse} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
          width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          transition: 'width 0.2s ease',
        },
      }}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} isMobile={false} />
    </Drawer>
  );
}
