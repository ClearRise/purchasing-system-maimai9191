import React from 'react';
import { Box, Typography } from '@mui/material';

interface PanelHeaderProps {
  title: string;
  action?: React.ReactNode;
}

/** Compact title + action row for settings cards / editors. */
const PanelHeader: React.FC<PanelHeaderProps> = ({ title, action }) => (
  <Box
    sx={{
      px: 2,
      py: 1.25,
      minHeight: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1.5,
      '& .MuiButton-root': {
        minHeight: 32,
        px: 1.25,
      },
    }}
  >
    <Typography variant="h4" component="h2">
      {title}
    </Typography>
    {action != null && action !== false && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {action}
      </Box>
    )}
  </Box>
);

export default PanelHeader;
