import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import UserAccountMenu from 'src/components/navbar/UserAccountMenu';
import { COMPANY_NAME, LOGO_URL } from 'src/constants/config';

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
        <MenuOutlinedIcon fontSize="small" />
      </IconButton>
      <Box
        component="img"
        src={LOGO_URL}
        alt={COMPANY_NAME}
        sx={{ height: 28, width: 'auto', maxWidth: 96, objectFit: 'contain', display: 'block' }}
      />
      <Typography variant="subtitle2" color="primary.main" sx={{ flex: 1 }} noWrap>
        {COMPANY_NAME}
      </Typography>
      <Box sx={{ flexShrink: 0 }}>
        <UserAccountMenu variant="icon" />
      </Box>
    </Toolbar>
  </AppBar>
);

export default Navbar;
