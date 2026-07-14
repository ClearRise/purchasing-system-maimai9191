import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import UserAccountMenu from 'src/components/navbar/UserAccountMenu';
import { COMPANY_NAME } from 'src/constants/config';

interface NavbarProps {
  onMenuClick: () => void;
}

/** Mobile-only compact header */
const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => (
  <AppBar
    position="fixed"
    elevation={0}
    sx={{
      display: { xs: 'block', md: 'none' },
      bgcolor: 'background.paper',
      color: 'text.primary',
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Toolbar sx={{ minHeight: 48, px: 1.5, gap: 1 }}>
      <IconButton edge="start" onClick={onMenuClick} size="small" sx={{ color: 'text.secondary' }}>
        <MenuIcon fontSize="small" />
      </IconButton>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', flex: 1 }}>
        {COMPANY_NAME}
      </Typography>
      <Box sx={{ flexShrink: 0 }}>
        <UserAccountMenu variant="icon" />
      </Box>
    </Toolbar>
  </AppBar>
);

export default Navbar;
