import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, action }) => (
  <Box
    sx={{
      mb: 2,
      flexShrink: 0,
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { sm: 'flex-start' },
      justifyContent: 'space-between',
      gap: 2,
    }}
  >
    <Box>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1, fontSize: '0.8125rem' }}>
          {breadcrumbs.map((bc) =>
            bc.path ? (
              <MuiLink
                key={bc.label}
                component={Link}
                to={bc.path}
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: 'inherit' }}
              >
                {bc.label}
              </MuiLink>
            ) : (
              <Typography key={bc.label} color="text.primary" variant="body2" sx={{ fontSize: 'inherit' }}>
                {bc.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Box>
);

export default PageHeader;
