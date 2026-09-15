import { createTheme } from '@mui/material/styles';

export const tokens = {
  ink: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  line: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  amber: '#F59E0B',
  amberDim: '#D97706',
  violet: '#7C5CFF',
  violetDim: '#6366F1',
  emerald: '#10B981',
  rose: '#EF4444',
  sky: '#0284C7',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: tokens.ink,
      paper: tokens.surface,
    },
    primary: {
      main: tokens.amber,
      dark: tokens.amberDim,
      light: '#FBBF24',
      contrastText: '#0F172A',
    },
    secondary: {
      main: tokens.violet,
      contrastText: '#FFFFFF',
    },
    success: { main: tokens.emerald },
    error: { main: tokens.rose },
    info: { main: tokens.sky },
    warning: { main: tokens.amber },
    text: {
      primary: tokens.text,
      secondary: tokens.textMuted,
    },
    divider: tokens.line,
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontWeight: 700, letterSpacing: '-0.02em', color: tokens.text },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', color: tokens.text },
    h3: { fontWeight: 700, letterSpacing: '-0.01em', color: tokens.text },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', color: tokens.text },
    h5: { fontWeight: 600, color: tokens.text },
    h6: { fontWeight: 600, color: tokens.text },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.line}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: tokens.amber,
          color: '#0F172A',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          '&:hover': {
            backgroundColor: '#E58E00',
            boxShadow: '0 2px 4px rgba(245,158,11,0.25)',
          },
        },
        outlinedInherit: {
          borderColor: tokens.line,
          color: tokens.text,
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.74rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: tokens.line,
          color: tokens.text,
        },
        head: {
          color: tokens.textMuted,
          fontWeight: 600,
          backgroundColor: '#F8FAFC',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
