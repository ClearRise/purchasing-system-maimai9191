import React, { forwardRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { closeSnackbar, SnackbarContent, type CustomContentProps, type VariantType } from 'notistack';

const toneByVariant: Record<
  VariantType,
  { bg: string; text: string; border: string; icon: string; Icon: React.ElementType }
> = {
  default: {
    bg: '#FFFFFF',
    text: '#1E293B',
    border: '#E2E8F0',
    icon: '#64748B',
    Icon: InfoOutlinedIcon,
  },
  success: {
    bg: '#FFFFFF',
    text: '#14532D',
    border: '#BBF7D0',
    icon: '#16A34A',
    Icon: CheckCircleOutlineOutlinedIcon,
  },
  error: {
    bg: '#FFFFFF',
    text: '#7F1D1D',
    border: '#FECACA',
    icon: '#DC2626',
    Icon: ErrorOutlineOutlinedIcon,
  },
  warning: {
    bg: '#FFFFFF',
    text: '#78350F',
    border: '#FDE68A',
    icon: '#D97706',
    Icon: WarningAmberOutlinedIcon,
  },
  info: {
    bg: '#FFFFFF',
    text: '#1E293B',
    border: '#E2E8F0',
    icon: '#2563EB',
    Icon: InfoOutlinedIcon,
  },
};

/** Clear, readable toast — still light, centered horizontally. */
const MinimalSnackbar = forwardRef<HTMLDivElement, CustomContentProps>(
  ({ id, message, variant = 'default', style, className }, ref) => {
    const tone = toneByVariant[variant] || toneByVariant.default;
    const Icon = tone.Icon;

    return (
      <SnackbarContent
        ref={ref}
        role="status"
        className={className}
        style={{
          ...style,
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.25,
            minWidth: { xs: 280, sm: 360 },
            maxWidth: { xs: 'calc(100vw - 32px)', sm: 480 },
            px: 2,
            py: 1.35,
            bgcolor: tone.bg,
            border: '1px solid',
            borderColor: tone.border,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
          }}
        >
          <Icon sx={{ fontSize: 22, color: tone.icon, flexShrink: 0 }} />
          <Typography
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              color: tone.text,
              fontWeight: 500,
              lineHeight: 1.5,
              fontSize: '0.9375rem',
            }}
          >
            {message}
          </Typography>
          <IconButton
            size="small"
            aria-label="閉じる"
            onClick={() => closeSnackbar(id)}
            sx={{
              p: 0.4,
              color: 'text.secondary',
              flexShrink: 0,
              '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
            }}
          >
            <CloseOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </SnackbarContent>
    );
  }
);

MinimalSnackbar.displayName = 'MinimalSnackbar';

export default MinimalSnackbar;
