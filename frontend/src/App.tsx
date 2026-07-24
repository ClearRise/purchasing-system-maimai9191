import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useDispatch } from 'react-redux';
import theme from 'src/theme/theme';
import { Path } from 'src/constants/enums';
import ProtectedRoute from 'src/components/common/ProtectedRoute';
import MinimalSnackbar from 'src/components/common/MinimalSnackbar';
import MainLayout from 'src/layouts/MainLayout';
import LoginPage from 'src/pages/Login';
import DashboardPage from 'src/pages/Dashboard';
import SuppliersPage from 'src/pages/masters/SuppliersPage';
import StoresPage from 'src/pages/masters/StoresPage';
import ProductsPage from 'src/pages/masters/ProductsPage';
import PurchasePricesPage from 'src/pages/purchase/PurchasePricesPage';
import PriceComparePage from 'src/pages/purchase/PriceComparePage';
import QuotationListPage from 'src/pages/quotations/QuotationListPage';
import QuotationEditPage from 'src/pages/quotations/QuotationEditPage';
import SimulationPage from 'src/pages/quotations/SimulationPage';
import SettingsPage from 'src/pages/admin/SettingsPage';
import { checkAuthStatus } from 'src/store/slices/authSlice';

const AppRoutes: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthStatus() as any);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path={Path.Login} element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path={Path.Suppliers} element={<SuppliersPage />} />
          <Route path={Path.Stores} element={<StoresPage />} />
          <Route path={Path.Products} element={<ProductsPage />} />
          <Route path={Path.Customers} element={<Navigate to={Path.Stores} replace />} />
          <Route path={Path.PurchasePrices} element={<PurchasePricesPage />} />
          <Route path={Path.PriceCompare} element={<PriceComparePage />} />
          <Route path="/purchase-prices/history" element={<Navigate to={Path.PriceCompare} replace />} />
          <Route path={Path.Quotations} element={<QuotationListPage />} />
          <Route path="/quotations/new" element={<Navigate to={`${Path.Quotations}?new=1`} replace />} />
          <Route path="/quotations/:id" element={<QuotationEditPage />} />
          <Route path={Path.Simulation} element={<SimulationPage />} />
          <Route path={Path.Settings} element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={Path.Dashboard} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={2800}
      preventDuplicate
      dense
      hideIconVariant
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      classes={{
        containerRoot: 'minimal-snackbar-container',
        containerAnchorOriginTopCenter: 'minimal-snackbar-top-center',
      }}
      Components={{
        default: MinimalSnackbar,
        success: MinimalSnackbar,
        error: MinimalSnackbar,
        warning: MinimalSnackbar,
        info: MinimalSnackbar,
      }}
    >
      <AppRoutes />
    </SnackbarProvider>
  </ThemeProvider>
);

export default App;
