import { createTheme } from '@mui/material/styles';

const primary = {
  main: '#166534',
  light: '#22C55E',
  dark: '#14532D',
  contrastText: '#FFFFFF',
};

/**
 * Typography roles (use variants — avoid one-off fontSize in pages):
 *  h1        page title
 *  h2        major section / login brand
 *  h3        panel / card title
 *  h4        dense panel title / KPI value
 *  h5–h6     compact emphasis
 *  subtitle1 emphasis body (list primary, form section)
 *  subtitle2 compact emphasis (nav active, chips labels)
 *  body1     default UI copy (14px)
 *  body2     secondary copy / table body (13px)
 *  caption   meta / hints (12px)
 *  overline  section labels (nav groups)
 *  button    actions (13px / 500)
 *
 * Weights: 400 regular · 500 medium · 600 semibold only.
 */
const fontFamily =
  '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", Meiryo, sans-serif';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary,
    secondary: { main: '#64748B' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    success: { main: '#16A34A' },
    info: { main: '#2563EB' },
  },
  typography: {
    fontFamily,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontFamily,
      fontSize: '1.375rem',
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: '0.01em',
      color: '#1E293B',
    },
    h2: {
      fontFamily,
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.01em',
      color: '#1E293B',
    },
    h3: {
      fontFamily,
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.01em',
      color: '#1E293B',
    },
    h4: {
      fontFamily,
      fontSize: '0.9375rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#1E293B',
    },
    h5: {
      fontFamily,
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.45,
      color: '#1E293B',
    },
    h6: {
      fontFamily,
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1.45,
      color: '#1E293B',
    },
    subtitle1: {
      fontFamily,
      fontSize: '0.9375rem',
      fontWeight: 500,
      lineHeight: 1.45,
      color: '#1E293B',
    },
    subtitle2: {
      fontFamily,
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1.45,
      color: '#1E293B',
    },
    body1: {
      fontFamily,
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#1E293B',
    },
    body2: {
      fontFamily,
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.55,
      color: '#1E293B',
    },
    button: {
      fontFamily,
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1.5,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontFamily,
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.45,
      color: '#64748B',
    },
    overline: {
      fontFamily,
      fontSize: '0.6875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: '#64748B',
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily,
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: '#1E293B',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: 'h1',
          h2: 'h2',
          h3: 'h3',
          h4: 'h4',
          h5: 'h5',
          h6: 'h6',
          subtitle1: 'p',
          subtitle2: 'p',
          body1: 'p',
          body2: 'p',
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
          fontWeight: 500,
          '&:hover': { boxShadow: 'none' },
        },
        sizeSmall: {
          fontSize: '0.75rem',
          padding: '4px 10px',
        },
        contained: {
          fontWeight: 500,
          '&:hover': { boxShadow: 'none' },
        },
        text: {
          fontWeight: 500,
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
            fontSize: '0.875rem',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#CBD5E1' },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
          '& fieldset': { borderColor: '#E2E8F0' },
        },
        input: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 400,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          fontWeight: 400,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 500,
          fontSize: '0.8125rem',
          color: '#64748B',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 400,
          color: '#1E293B',
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
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
          borderRadius: 6,
        },
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
        root: {
          fontWeight: 500,
          fontSize: '1.125rem',
          lineHeight: 1.4,
          paddingBottom: 8,
          color: '#1E293B',
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: '#64748B',
        },
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
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          color: 'inherit',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem',
          fontWeight: 400,
          color: '#1E293B',
        },
        secondary: {
          fontSize: '0.75rem',
          fontWeight: 400,
          color: '#64748B',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          textTransform: 'none',
          minHeight: 44,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          fontWeight: 400,
          lineHeight: 1.45,
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        li: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.8125rem',
        },
        message: {
          fontWeight: 400,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#E2E8F0' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 400,
        },
      },
    },
  },
});

export const dataGridSx = {
  border: 0,
  height: '100%',
  fontSize: '0.875rem',
  fontWeight: 400,
  color: '#1E293B',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 500,
    fontSize: '0.8125rem',
    color: '#64748B',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #F1F5F9',
    fontWeight: 400,
    fontSize: '0.875rem',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: '#F8FAFC',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid #E2E8F0',
  },
} as const;

export default theme;
