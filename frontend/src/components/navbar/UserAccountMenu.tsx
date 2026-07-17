import React from 'react';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from 'src/store/slices/authSlice';
import { useAuth } from 'src/hooks/usePermissions';
import { ROLE_LABELS } from 'src/constants/enums';
import type { UserRole } from 'src/types';

interface UserAccountMenuProps {
  /** Sidebar footer vs compact mobile header */
  variant?: 'sidebar' | 'icon';
}

const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ variant = 'sidebar' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const displayName = user ? `${user.lastName} ${user.firstName}` : '';
  const roleLabel = user ? ROLE_LABELS[user.role as UserRole] : '';

  if (variant === 'icon') {
    return (
      <Tooltip title="ログアウト">
        <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary' }}>
          <LogoutOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
      }}
    >
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8125rem', flexShrink: 0 }}>
        {user?.lastName?.charAt(0) || 'U'}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {roleLabel}
        </Typography>
      </Box>
      <Tooltip title="ログアウト">
        <IconButton
          size="small"
          onClick={handleLogout}
          sx={{
            flexShrink: 0,
            color: 'text.secondary',
            '&:hover': { color: 'error.main', bgcolor: 'error.50' },
          }}
        >
          <LogoutOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default UserAccountMenu;
