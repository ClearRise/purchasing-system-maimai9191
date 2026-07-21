export enum Path {
  Login = '/login',
  Dashboard = '/',
  Suppliers = '/masters/suppliers',
  Stores = '/masters/stores',
  Products = '/masters/products',
  Customers = '/masters/customers',
  PurchasePrices = '/purchase-prices',
  PriceCompare = '/purchase-prices/compare',
  Quotations = '/quotations',
  QuotationEdit = '/quotations/:id',
  Simulation = '/quotations/simulation',
  Settings = '/admin/settings',
  Users = '/admin/users',
}

export enum UserRole {
  Admin = 'admin',
  Purchase = 'purchase',
  Sales = 'sales',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: '管理者',
  [UserRole.Purchase]: '仕入担当',
  [UserRole.Sales]: '営業担当',
};

export const RANK_LABELS: Record<string, string> = {
  A: 'Aランク',
  B: 'Bランク',
  C: 'Cランク',
  D: 'Dランク',
  N: 'Nランク',
};

export const QUOTATION_STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  confirmed: '確認済',
  sent: '送信済',
};
