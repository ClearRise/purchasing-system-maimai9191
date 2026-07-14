export interface MatrixColumn {
  key: string;
  label: string;
  subLabel?: string;
}

export interface MatrixRow {
  id: number;
  productCode: string;
  name: string;
  spec?: string;
  unit: string;
  note?: string;
  cells: Record<string, number | null>;
  minPrice?: number | null;
  changePct?: Record<string, number | null>;
}

interface GridSupplier {
  supplierId: number;
  supplierName: string;
  purchasePrice: number | null;
}

interface GridRow {
  productId: number;
  productCode: string;
  name: string;
  spec?: string;
  unit: string;
  note?: string;
  suppliers: GridSupplier[];
  minPrice?: number | null;
}

export function gridToMatrix(rows: GridRow[]) {
  const supplierMap = new Map<number, string>();
  rows.forEach((r) => r.suppliers.forEach((s) => supplierMap.set(s.supplierId, s.supplierName)));

  const columns: MatrixColumn[] = Array.from(supplierMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1], 'ja'))
    .map(([id, name]) => ({ key: String(id), label: name }));

  const matrixRows: MatrixRow[] = rows.map((r) => ({
    id: r.productId,
    productCode: r.productCode,
    name: r.name,
    spec: r.spec,
    unit: r.unit,
    note: r.note,
    cells: Object.fromEntries(r.suppliers.map((s) => [String(s.supplierId), s.purchasePrice])),
    minPrice: r.minPrice,
  }));

  return { columns, rows: matrixRows };
}

export function formatYearMonth(ym: string) {
  const [y, m] = ym.split('-');
  return `${y}年${Number(m)}月`;
}

export function compareYearMonth(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return ay !== by ? ay - by : am - bm;
}

export function getDefaultMonthRange(monthSpan = 6): { start: string; end: string } {
  const d = new Date();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const startDate = new Date(d.getFullYear(), d.getMonth() - (monthSpan - 1), 1);
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  return { start, end };
}

export function normalizeMonthRange(start: string, end: string): { start: string; end: string } {
  if (compareYearMonth(start, end) <= 0) return { start, end };
  return { start: end, end: start };
}

export function cellKey(productId: number, colKey: string) {
  return `${productId}-${colKey}`;
}
