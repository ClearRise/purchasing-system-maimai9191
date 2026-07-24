import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Toolbar,
} from '@mui/material';
import { COMPANY_NAME, SYSTEM_NAME, LOGO_URL } from 'src/constants/config';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import UserAccountMenu from 'src/components/navbar/UserAccountMenu';
import { Path } from 'src/constants/enums';
import { usePermissions } from 'src/hooks/usePermissions';
import { isNavItemActive } from 'src/utils/navActive';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  show?: boolean;
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const drawerPaperSx = {
  width: DRAWER_WIDTH,
  boxSizing: 'border-box',
  bgcolor: 'background.paper',
  height: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: 'none',
  borderRight: '1px solid',
  borderColor: 'divider',
};

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const perms = usePermissions();

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'メイン',
      items: [
        { label: 'ダッシュボード', path: Path.Dashboard, icon: <DashboardOutlinedIcon fontSize="small" />, show: true },
      ],
    },
    {
      title: 'マスタ管理',
      items: [
        { label: '発注先', path: Path.Suppliers, icon: <LocalShippingOutlinedIcon fontSize="small" />, show: perms.canManageMasters },
        { label: '商品', path: Path.Products, icon: <Inventory2OutlinedIcon fontSize="small" />, show: true },
        { label: '得意先', path: Path.Stores, icon: <StoreOutlinedIcon fontSize="small" />, show: perms.canManageMasters || perms.canManageCustomers || perms.isSales },
      ],
    },
    {
      title: '仕入管理',
      items: [
        { label: '月別仕入価格', path: Path.PurchasePrices, icon: <AttachMoneyOutlinedIcon fontSize="small" />, show: perms.canManagePrices || perms.isSales },
        { label: '仕入価格比較', path: Path.PriceCompare, icon: <CompareArrowsOutlinedIcon fontSize="small" />, show: perms.canManagePrices || perms.isSales },
      ],
    },
    {
      title: '見積管理',
      items: [
        { label: '見積書一覧', path: Path.Quotations, icon: <DescriptionOutlinedIcon fontSize="small" />, show: perms.canManageQuotations },
        { label: '見積シミュレーション', path: Path.Simulation, icon: <CalculateOutlinedIcon fontSize="small" />, show: perms.canManageQuotations },
      ],
    },
    {
      title: 'システム',
      items: [
        { label: '設定', path: Path.Settings, icon: <SettingsOutlinedIcon fontSize="small" />, show: perms.canManageSettings },
      ],
    },
  ];

  const navPaths = useMemo(
    () => sections.flatMap((s) => s.items.filter((i) => i.show !== false).map((i) => i.path)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sections depend on permissions
    [perms.canManageMasters, perms.isSales, perms.canManageCustomers, perms.canManagePrices, perms.canManageQuotations, perms.canManageSettings],
  );

  const drawerContent = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toolbar
        sx={{
          px: 2,
          py: 2,
          minHeight: { xs: 88, md: 100 },
          flexShrink: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          textAlign: 'center',
        }}
      >
        <Box
          component="img"
          src={LOGO_URL}
          alt={COMPANY_NAME}
          sx={{
            height: 64,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <Box>
          <Typography variant="subtitle2" color="primary.main" sx={{ lineHeight: 1.3 }}>
            {COMPANY_NAME}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
            {SYSTEM_NAME}
          </Typography>
        </Box>
      </Toolbar>

      <Box
        component="nav"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 1.5,
          pb: 2,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {sections.map((section) => {
          const visibleItems = section.items.filter((i) => i.show !== false);
          if (!visibleItems.length) return null;
          return (
            <Box key={section.title} sx={{ mb: 1.5 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: 'block',
                }}
              >
                {section.title}
              </Typography>
              <List dense disablePadding>
                {visibleItems.map((item) => {
                  const active = isNavItemActive(location.pathname, item.path, navPaths);
                  return (
                    <ListItemButton
                      key={item.path}
                      selected={active}
                      onClick={() => { navigate(item.path); onClose(); }}
                      sx={{
                        py: 0.85,
                        px: 1.25,
                        mb: 0.15,
                        borderRadius: 1,
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          color: 'text.primary',
                          '& .MuiListItemIcon-root': { color: 'text.primary' },
                        },
                        '&.Mui-selected': {
                          bgcolor: '#F1F5F9',
                          color: 'text.primary',
                          '& .MuiListItemIcon-root': { color: 'text.primary' },
                          '&:hover': {
                            bgcolor: '#E2E8F0',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: 'inherit',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            variant: 'body2',
                            sx: {
                              fontWeight: active ? 500 : 400,
                              color: 'inherit',
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
        <UserAccountMenu variant="sidebar" />
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': drawerPaperSx,
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
export { DRAWER_WIDTH };
