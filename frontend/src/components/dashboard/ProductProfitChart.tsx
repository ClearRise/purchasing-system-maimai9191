import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, MenuItem, TextField, Typography, CircularProgress,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useSnackbar } from 'notistack';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import {
  getDefaultMonthRange,
  normalizeMonthRange,
} from 'src/utils/purchasePriceMatrix';
import type { IProductProfitTrends } from 'src/types';

const monthFieldSx = { width: { xs: '100%', sm: 140 } };

interface ProductProfitChartProps {
  /** Smaller paddings / chart height for one-screen dashboard */
  compact?: boolean;
}

const ProductProfitChart: React.FC<ProductProfitChartProps> = ({ compact }) => {
  const { enqueueSnackbar } = useSnackbar();
  const defaultRange = useMemo(() => getDefaultMonthRange(12), []);
  const [startYearMonth, setStartYearMonth] = useState(defaultRange.start);
  const [endYearMonth, setEndYearMonth] = useState(defaultRange.end);
  const [data, setData] = useState<IProductProfitTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState<number | ''>('');

  const fetchTrends = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const range = normalizeMonthRange(start, end);
      const res = await api.get(endpoints.dashboard.productProfitTrends, {
        params: {
          startYearMonth: range.start,
          endYearMonth: range.end,
        },
      });
      setData(res.data.data);
    } catch {
      setData(null);
      enqueueSnackbar('利益推移の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTrends(startYearMonth, endYearMonth);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [startYearMonth, endYearMonth, fetchTrends]);

  const products = data?.products || [];

  useEffect(() => {
    if (!products.length) {
      setProductId('');
      return;
    }
    setProductId((prev) => {
      if (prev !== '' && products.some((p) => p.productId === prev)) return prev;
      const preferred = data?.defaultProductId;
      const exists = preferred != null && products.some((p) => p.productId === preferred);
      return exists ? preferred! : products[0].productId;
    });
  }, [data?.defaultProductId, products]);

  const selected = useMemo(
    () => products.find((p) => p.productId === productId) || null,
    [products, productId]
  );

  const chart = useMemo(() => {
    // Always show every month in the selected range on the X axis
    const xLabels = data?.months?.length
      ? data.months
      : (selected?.points.map((p) => p.yearMonth) || []);

    if (!selected) {
      return {
        xLabels,
        profits: xLabels.map(() => null as number | null),
        purchases: xLabels.map(() => null as number | null),
        sells: xLabels.map(() => null as number | null),
      };
    }

    const byMonth = new Map(selected.points.map((p) => [p.yearMonth, p]));
    return {
      xLabels,
      profits: xLabels.map((ym) => byMonth.get(ym)?.unitProfit ?? null),
      purchases: xLabels.map((ym) => byMonth.get(ym)?.avgPurchase ?? null),
      sells: xLabels.map((ym) => byMonth.get(ym)?.avgSell ?? null),
    };
  }, [data?.months, selected]);

  const handleStartChange = (value: string) => {
    const next = normalizeMonthRange(value, endYearMonth);
    setStartYearMonth(next.start);
    setEndYearMonth(next.end);
  };

  const handleEndChange = (value: string) => {
    const next = normalizeMonthRange(startYearMonth, value);
    setStartYearMonth(next.start);
    setEndYearMonth(next.end);
  };

  return (
    <Box
      sx={{
        px: compact ? 1.25 : 2,
        pb: compact ? 1 : 2,
        pt: compact ? 1 : 1.5,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          mb: compact ? 1 : 1.5,
          flexShrink: 0,
        }}
      >
        <TextField
          size="small"
          label="開始月"
          type="month"
          value={startYearMonth}
          onChange={(e) => handleStartChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={monthFieldSx}
        />
        <TextField
          size="small"
          label="終了月"
          type="month"
          value={endYearMonth}
          onChange={(e) => handleEndChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={monthFieldSx}
        />
        <TextField
          select
          size="small"
          label="商品"
          value={productId === '' ? '' : String(productId)}
          onChange={(e) => setProductId(Number(e.target.value))}
          sx={{ minWidth: { xs: '100%', sm: compact ? 200 : 260 }, flex: compact ? 1 : undefined }}
          disabled={!products.length}
        >
          {products.map((p, index) => (
            <MenuItem key={p.productId} value={String(p.productId)}>
              {index === 0 ? '★ ' : ''}{p.productName}
              {compact ? '' : `（直近利益 ¥${p.latestUnitProfit.toLocaleString()}）`}
            </MenuItem>
          ))}
        </TextField>
        {selected && !compact && (
          <Typography variant="body2" color="text.secondary">
            {startYearMonth} 〜 {endYearMonth}
            {' · '}
            平均利益 ¥{selected.avgUnitProfit.toLocaleString()} / 月
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : !products.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          選択した期間に仕入価格データがありません
        </Typography>
      ) : chart.xLabels.length ? (
        <Box sx={{ flex: 1, minHeight: compact ? 180 : 260, width: '100%' }}>
          <LineChart
            height={compact ? 200 : 300}
            xAxis={[{
              data: chart.xLabels,
              scaleType: 'point',
              label: compact ? undefined : '年月',
            }]}
            yAxis={[{
              label: compact ? undefined : '金額 (円)',
              width: compact ? 52 : 70,
              valueFormatter: (v: number | null) =>
                v == null ? '' : `¥${Math.round(v).toLocaleString()}`,
            }]}
            series={[
              {
                id: 'unitProfit',
                label: '平均利益',
                data: chart.profits,
                color: '#166534',
                curve: 'monotoneX',
                showMark: !compact,
                connectNulls: false,
                valueFormatter: (v) => (v == null ? 'データなし' : `¥${Number(v).toLocaleString()}`),
              },
              {
                id: 'avgSell',
                label: '平均売価',
                data: chart.sells,
                color: '#2563EB',
                curve: 'monotoneX',
                showMark: false,
                connectNulls: false,
                valueFormatter: (v) => (v == null ? 'データなし' : `¥${Number(v).toLocaleString()}`),
              },
              {
                id: 'avgPurchase',
                label: '平均仕入',
                data: chart.purchases,
                color: '#94A3B8',
                curve: 'monotoneX',
                showMark: false,
                connectNulls: false,
                valueFormatter: (v) => (v == null ? 'データなし' : `¥${Number(v).toLocaleString()}`),
              },
            ]}
            margin={{
              left: compact ? 8 : 16,
              right: 8,
              top: compact ? 8 : 20,
              bottom: compact ? 24 : 40,
            }}
            grid={{ horizontal: true }}
            slotProps={{
              legend: { direction: 'horizontal' },
            }}
          />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          表示できる月がありません
        </Typography>
      )}
    </Box>
  );
};

export default ProductProfitChart;
