import { createTheme } from '@mui/material/styles';

// KarmMitra AI — Institutional Admin Dashboard
// Design concept: a calm, trustworthy government intelligence platform for
// MoSPI / NSSTA / iGOT Karmayogi administrators — restrained institutional
// blue, clear status colour, high-contrast text, generous whitespace.
//
// Color tokens:
//   Primary      #123B5D  deep institutional blue
//   Secondary    #1F5A7A  muted blue
//   Accent       #C97A1E  restrained saffron/amber
//   Success      #2E7D5B
//   Warning      #B7791F
//   Critical     #B54747
//   Background   #F5F7F9
//   Surface      #FFFFFF
//   Border       #D9E1E7
//   Text primary #172B3A
//   Text secondary #5F6F7A

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#123B5D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C97A1E',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#1F5A7A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F7F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#172B3A',
      secondary: '#5F6F7A',
    },
    divider: '#D9E1E7',
    success: { main: '#2E7D5B' },
    warning: { main: '#B7791F' },
    error: { main: '#B54747' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "system-ui", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1.15rem',
      fontWeight: 600,
    },
    overline: {
      letterSpacing: '0.06em',
      fontWeight: 600,
      textTransform: 'uppercase',
      fontSize: '0.68rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #D9E1E7',
          borderRadius: 10,
          boxShadow: '0 1px 2px rgba(23,43,58,0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.72rem',
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: '#5F6F7A',
          borderBottom: '2px solid #123B5D',
        },
        root: {
          borderBottom: '1px solid #D9E1E7',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #1F5A7A',
            outlineOffset: 2,
          },
        },
      },
    },
  },
});
