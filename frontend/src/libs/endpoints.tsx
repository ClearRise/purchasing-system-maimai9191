const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    changePassword: '/auth/change-password',
  },
  users: {
    list: '/users',
    stats: '/users/stats',
    detail: (id: number) => `/users/${id}`,
  },
  masters: {
    lookup: '/masters/lookup',
    suppliers: '/masters/suppliers',
    supplier: (id: number) => `/masters/suppliers/${id}`,
    stores: '/masters/stores',
    store: (id: number) => `/masters/stores/${id}`,
    categories: '/masters/categories',
    customers: '/masters/customers',
    customer: (id: number) => `/masters/customers/${id}`,
    products: '/masters/products',
    product: (id: number) => `/masters/products/${id}`,
  },
  purchasePrices: {
    grid: '/purchase-prices/grid',
    bulk: '/purchase-prices/bulk',
    compare: '/purchase-prices/compare',
  },
  quotations: {
    list: '/quotations',
    detail: (id: number) => `/quotations/${id}`,
    pdf: (id: number, preview = false) => `/quotations/${id}/pdf${preview ? '?preview=1' : ''}`,
    lines: (id: number) => `/quotations/${id}/lines`,
    status: (id: number) => `/quotations/${id}/status`,
    delete: (id: number) => `/quotations/${id}`,
    simulate: '/quotations/simulate',
  },
  dashboard: {
    summary: '/dashboard/summary',
  },
  admin: {
    rankMargins: '/admin/rank-margins',
    rankMargin: (rank: string) => `/admin/rank-margins/${rank}`,
    settings: '/admin/settings',
  },
};

export default endpoints;
