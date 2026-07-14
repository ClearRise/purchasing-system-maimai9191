import { createTheme, alpha } from '@mui/material/styles';

const primary = {
  main: '#166534',
  light: '#22C55E',
  dark: '#14532D',
  contrastText: '#FFFFFF',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary,
    secondary: { main: '#64748B' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    divider: '#E2E8F0',
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    success: { main: '#16A34A' },
    info: { main: '#2563EB' },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 500 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#334155',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#CBD5E1' },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& fieldset': { borderColor: '#E2E8F0' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: '#64748B',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        },
        body: {
          fontSize: '0.875rem',
          borderBottom: '1px solid #F1F5F9',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
          '&:hover': { backgroundColor: '#F8FAFC' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: 6 },
        filled: { border: 'none' },
        outlined: { borderColor: '#E2E8F0' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '1.125rem', paddingBottom: 8 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          borderRight: '1px solid #E2E8F0',
          boxShadow: 'none',
          overflow: 'hidden',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': { backgroundColor: alpha(primary.main, 0.04) },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#E2E8F0' },
      },
    },
  },
});

export const dataGridSx = {
  border: 0,
  height: '100%',
  fontSize: '0.875rem',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    color: '#64748B',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #F1F5F9',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: '#F8FAFC',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid #E2E8F0',
  },
} as const;

export default theme;
