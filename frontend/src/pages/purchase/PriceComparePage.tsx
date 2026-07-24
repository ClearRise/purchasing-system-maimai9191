import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, TextField, MenuItem, ToggleButton, ToggleButtonGroup, Typography, Divider,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PageHeader from 'src/components/common/PageHeader';
import PriceMatrixTable from 'src/components/purchase/PriceMatrixTable';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import {
  formatYearMonth,
  getDefaultMonthRange,
  normalizeMonthRange,
  type MatrixColumn,
  type MatrixRow,
} from 'src/utils/purchasePriceMatrix';
import type { IStore } from 'src/types';
import { useSnackbar } from 'notistack';
import { pageTableRootSx, selectorBarSx } from 'src/constants/layout';

type CompareMode = 'supplier' | 'month';

interface SupplierCompareData {
  mode: 'supplier';
  targetYearMonth: string;
  suppliers: { id: number; name: string }[];
  products: {
    productId: number;
    productCode: string;
    name: string;
    spec?: string;
    unit: string;
    note?: string;
    prices: Record<number, number | null>;
    minPrice: number | null;
  }[];
}

interface MonthCompareData {
  mode: 'month';
  startYearMonth: string;
  endYearMonth: string;
  months: string[];
  supplierId: number | null;
  supplierName: string | null;
  products: {
    productId: number;
    productCode: string;
    name: string;
    spec?: string;
    unit: string;
    note?: string;
    prices: Record<string, number | null>;
    changePct: Record<string, number | null>;
  }[];
}

const defaultRange = getDefaultMonthRange(6);

const fieldSx = { width: { xs: '100%', sm: 160 } };
const monthFieldSx = { width: { xs: '100%', sm: 148 } };

const PriceComparePage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [mode, setMode] = useState<CompareMode>('supplier');
  const [targetYearMonth, setTargetYearMonth] = useState(defaultRange.end);
  const [startYearMonth, setStartYearMonth] = useState(defaultRange.start);
  const [endYearMonth, setEndYearMonth] = useState(defaultRange.end);
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<IStore[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [data, setData] = useState<SupplierCompareData | MonthCompareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(endpoints.masters.lookup).then((res) => {
      const loaded: IStore[] = res.data.data.stores || [];
      setStores(loaded);
      setSuppliers(res.data.data.suppliers || []);
      if (loaded.length) setStoreId(String(loaded[0].id));
    });
  }, []);

  const handleStartMonthChange = (value: string) => {
    setStartYearMonth(value);
    if (value && endYearMonth) {
      const normalized = normalizeMonthRange(value, endYearMonth);
      setStartYearMonth(normalized.start);
      setEndYearMonth(normalized.end);
    }
  };

  const handleEndMonthChange = (value: string) => {
    setEndYearMonth(value);
    if (startYearMonth && value) {
      const normalized = normalizeMonthRange(startYearMonth, value);
      setStartYearMonth(normalized.start);
      setEndYearMonth(normalized.end);
    }
  };

  const fetchCompare = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.purchasePrices.compare, {
        params: mode === 'supplier'
          ? { storeId: Number(storeId), mode, targetYearMonth }
          : {
              storeId: Number(storeId),
              mode,
              startYearMonth,
              endYearMonth,
              supplierId: supplierId ? Number(supplierId) : undefined,
            },
      });
      setData(res.data.data);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '比較データの取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchCompare();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, targetYearMonth, startYearMonth, endYearMonth, storeId, supplierId]);

  const { columns, rows } = useMemo(() => {
    if (!data) return { columns: [] as MatrixColumn[], rows: [] as MatrixRow[] };

    if (data.mode === 'supplier') {
      return {
        columns: data.suppliers.map((s) => ({ key: String(s.id), label: s.name })),
        rows: data.products.map((p) => ({
          id: p.productId,
          productCode: p.productCode,
          name: p.name,
          spec: p.spec,
          unit: p.unit,
          note: p.note,
          cells: Object.fromEntries(Object.entries(p.prices).map(([k, v]) => [String(k), v])),
          minPrice: p.minPrice,
        })),
      };
    }

    return {
      columns: data.months.map((ym) => ({ key: ym, label: formatYearMonth(ym) })),
      rows: data.products.map((p) => ({
        id: p.productId,
        productCode: p.productCode,
        name: p.name,
        spec: p.spec,
        unit: p.unit,
        note: p.note,
        cells: { ...p.prices },
        changePct: p.changePct,
      })),
    };
  }, [data]);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader title="仕入価格比較" subtitle="発注先比較 · 月別推移" />

      <Paper sx={selectorBarSx}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="supplier" sx={{ gap: 0.75, px: 1.5, py: 0.75, fontSize: '0.8125rem' }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />
            発注先
          </ToggleButton>
          <ToggleButton value="month" sx={{ gap: 0.75, px: 1.5, py: 0.75, fontSize: '0.8125rem' }}>
            <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
            月別
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 0.5, my: 0.5 }} />

        <TextField
          select
          label="得意先"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          size="small"
          sx={fieldSx}
        >
          {stores.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
          ))}
        </TextField>

        {mode === 'supplier' ? (
          <TextField
            label="対象年月"
            type="month"
            value={targetYearMonth}
            onChange={(e) => setTargetYearMonth(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={monthFieldSx}
          />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <TextField
                label="開始"
                type="month"
                value={startYearMonth}
                onChange={(e) => handleStartMonthChange(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={monthFieldSx}
              />
              <Typography variant="caption" color="text.secondary">〜</Typography>
              <TextField
                label="終了"
                type="month"
                value={endYearMonth}
                onChange={(e) => handleEndMonthChange(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={monthFieldSx}
              />
            </Box>
            <TextField
              select
              label="発注先"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              size="small"
              sx={{ ...fieldSx, minWidth: { sm: 180 } }}
            >
              <MenuItem value="">最安値</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
              ))}
            </TextField>
          </>
        )}
      </Paper>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PriceMatrixTable
          columns={columns}
          rows={rows}
          loading={loading}
          highlightMin={mode === 'supplier'}
          showMoMChange={mode === 'month'}
          emptyMessage="比較するデータがありません。先に仕入価格を入力してください。"
        />
      </Box>
    </Box>
  );
};

export default PriceComparePage;
