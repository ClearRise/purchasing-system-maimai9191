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
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DescriptionIcon from '@mui/icons-material/Description';
import CalculateIcon from '@mui/icons-material/Calculate';
import SettingsIcon from '@mui/icons-material/Settings';
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
        { label: 'ダッシュボード', path: Path.Dashboard, icon: <DashboardIcon fontSize="small" />, show: true },
      ],
    },
    {
      title: 'マスタ管理',
      items: [
        { label: '発注先', path: Path.Suppliers, icon: <LocalShippingIcon fontSize="small" />, show: perms.canManageMasters },
        { label: '店舗', path: Path.Stores, icon: <StoreIcon fontSize="small" />, show: perms.canManageMasters || perms.isSales },
        { label: '商品', path: Path.Products, icon: <InventoryIcon fontSize="small" />, show: true },
        { label: '得意先', path: Path.Customers, icon: <PeopleIcon fontSize="small" />, show: perms.canManageCustomers },
      ],
    },
    {
      title: '仕入管理',
      items: [
        { label: '月別仕入価格', path: Path.PurchasePrices, icon: <AttachMoneyIcon fontSize="small" />, show: perms.canManagePrices || perms.isSales },
        { label: '仕入価格比較', path: Path.PriceCompare, icon: <CompareArrowsIcon fontSize="small" />, show: perms.canManagePrices || perms.isSales },
      ],
    },
    {
      title: '見積管理',
      items: [
        { label: '見積書一覧', path: Path.Quotations, icon: <DescriptionIcon fontSize="small" />, show: perms.canManageQuotations },
        { label: '見積シミュレーション', path: Path.Simulation, icon: <CalculateIcon fontSize="small" />, show: perms.canManageQuotations },
      ],
    },
    {
      title: 'システム',
      items: [
        { label: '設定', path: Path.Settings, icon: <SettingsIcon fontSize="small" />, show: perms.canManageSettings },
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
      <Toolbar sx={{ px: 2, minHeight: { xs: 48, md: 56 }, flexShrink: 0 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
            イシイフーズ
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
            仕入・見積管理
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
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
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
                        py: 0.75,
                        px: 1.5,
                        mb: 0.25,
                        borderRadius: 1.5,
                        '&.Mui-selected': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`,
                          '& .MuiListItemIcon-root': { color: 'primary.main' },
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: active ? 'primary.main' : 'text.secondary' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: {
                              fontSize: '0.8125rem',
                              fontWeight: active ? 600 : 400,
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
