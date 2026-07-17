import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  /** Primary page actions (新規 / 保存 / 一括削除 etc.) */
  action?: React.ReactNode;
  /** Tighter spacing for dense screens (e.g. dashboard) */
  dense?: boolean;
}

/** Shared page title + action toolbar used across list/edit screens. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, action, dense }) => (
  <Box
    sx={{
      mb: dense ? 1.25 : 2.5,
      pb: dense ? 1 : 2,
      flexShrink: 0,
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    {breadcrumbs && breadcrumbs.length > 0 && (
      <Breadcrumbs sx={{ mb: 1 }}>
        {breadcrumbs.map((bc) =>
          bc.path ? (
            <MuiLink
              key={bc.label}
              component={Link}
              to={bc.path}
              underline="hover"
              color="text.secondary"
              variant="caption"
            >
              {bc.label}
            </MuiLink>
          ) : (
            <Typography key={bc.label} color="text.primary" variant="caption">
              {bc.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    )}

    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
        <Typography
          variant={dense ? 'h2' : 'h1'}
          component="h1"
          sx={dense ? { fontSize: '1.2rem' } : undefined}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: dense ? 0.25 : 0.5, maxWidth: 560 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action != null && action !== false && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            gap: 1,
            flexShrink: 0,
            '& .MuiButton-root': {
              minHeight: 34,
              px: 1.5,
              whiteSpace: 'nowrap',
            },
            '& .MuiButton-outlined': {
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
            '& .MuiButton-outlinedError': {
              borderColor: 'error.light',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.main',
                bgcolor: 'rgba(220, 38, 38, 0.04)',
              },
              '&.Mui-disabled': {
                borderColor: 'divider',
                color: 'action.disabled',
              },
            },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  </Box>
);

export default PageHeader;
