export type UserRole = 'admin' | 'purchase' | 'sales';

export interface IUser {
  id: number;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface IAuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: IPagination;
}

export interface ISupplier {
  id: number;
  name: string;
  shortName?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface IStore {
  id: number;
  storeCode: string;
  name: string;
  groupName?: string;
  location?: string;
  isActive: boolean;
}

export interface ICustomer {
  id: number;
  name: string;
  rank: string;
  nameKana?: string;
  email?: string;
  stores?: IStore[];
  note?: string;
  isActive: boolean;
}

export interface IProduct {
  id: number;
  storeId: number;
  productCode: string;
  name: string;
  spec?: string;
  unit: string;
  categoryLabel?: string;
  note?: string;
  store?: IStore;
  suppliers?: ISupplier[];
  isActive: boolean;
}

export interface IQuotation {
  id: number;
  quotationNo: string;
  customerId: number;
  storeId: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  note?: string;
  customer?: ICustomer;
  store?: IStore;
  lines?: IQuotationLine[];
}

export interface IQuotationLine {
  id: number;
  lineNo: number;
  productId: number;
  productName: string;
  spec?: string;
  unit: string;
  purchasePrice: number;
  rankMarginRate: number;
  autoQuotePrice: number;
  finalQuotePrice: number;
  isVisible: boolean;
  note?: string;
}

export interface IProductProfitPoint {
  yearMonth: string;
  avgPurchase: number | null;
  avgSell: number | null;
  unitProfit: number | null;
  marginPct: number | null;
}

export interface IProductProfitProduct {
  productId: number;
  productName: string;
  latestUnitProfit: number;
  avgUnitProfit: number;
  points: IProductProfitPoint[];
}

export interface IProductProfitTrends {
  startYearMonth?: string | null;
  endYearMonth?: string | null;
  months: string[];
  rankMargins: number[];
  defaultProductId: number | null;
  products: IProductProfitProduct[];
}

export interface IDashboardData {
  summary: {
    quotationDraft: number;
    quotationSent: number;
    productCount: number;
    customerCount: number;
  };
  topProducts: { productId: number; productName: string; avgMarginRate: number }[];
  riskCustomers: { customerId: number; customerName: string; rank: string; avgMarginRate: number; minRequired: number }[];
  priceAlerts: {
    productName: string;
    supplierName?: string;
    prevYearMonth?: string;
    targetYearMonth: string;
    priceBefore?: number;
    priceAfter?: number;
    changePct: number;
  }[];
}
