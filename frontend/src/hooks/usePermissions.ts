import { useSelector } from 'react-redux';
import type { RootState } from 'src/store';
import { UserRole } from 'src/constants/enums';

export function useAuth() {
  return useSelector((state: RootState) => state.auth);
}

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    isAdmin: role === UserRole.Admin,
    isPurchase: role === UserRole.Admin || role === UserRole.Purchase,
    isSales: role === UserRole.Admin || role === UserRole.Sales,
    canManageMasters: role === UserRole.Admin || role === UserRole.Purchase,
    canManageCustomers: role === UserRole.Admin || role === UserRole.Sales,
    canManagePrices: role === UserRole.Admin || role === UserRole.Purchase,
    canManageQuotations: role === UserRole.Admin || role === UserRole.Sales,
    canManageSettings: role === UserRole.Admin,
  };
}
