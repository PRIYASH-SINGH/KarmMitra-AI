import { createTheme } from '@mui/material/styles';

// KarmMitra AI Government & iGOT Karmayogi inspired Design System
const theme = createTheme({
  palette: {
    primary: {
      main: '#0D2E5C', // Deep Navy Blue (Authority & Governance)
      light: '#1B4782',
      dark: '#071C38',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F37021', // Vibrant Saffron / Warm Orange (National Energy & Focus)
      light: '#FF8B3D',
      dark: '#C85307',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#138808', // India Green / Growth
      light: '#2EAA1F',
      dark: '#0C5B05',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#0288D1',
      light: '#03A9F4',
      dark: '#01579B',
    },
    background: {
      default: '#F4F6F9', // Soft, clean institutional grey
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B', // Slate 800 for high readability
      secondary: '#64748B', // Slate 500
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: {
      textTransform: 'none', // Friendly, modern government UI standard
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '8px 20px',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(13, 46, 92, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(13, 46, 92, 0.06)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0 2px 10px rgba(13, 46, 92, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
