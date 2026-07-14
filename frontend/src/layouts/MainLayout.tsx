import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Navbar from 'src/components/navbar';
import Sidebar from 'src/components/sidebar';

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: { xs: '100vh', md: '100vh' },
          overflow: 'hidden',
        }}
      >
        {/* Spacer only on mobile where fixed AppBar is shown */}
        <Toolbar sx={{ display: { xs: 'block', md: 'none' }, minHeight: 48, flexShrink: 0 }} />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            px: { xs: 1.5, md: 2.5 },
            pt: { xs: 1.5, md: 3 },
            pb: { xs: 1.5, md: 2 },
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
