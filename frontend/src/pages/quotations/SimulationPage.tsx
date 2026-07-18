import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Chip, Slider, Typography, Stack, ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { pageTableRootSx, selectorBarSx, tableScrollPaperSx } from 'src/constants/layout';
import type { ICustomer, IStore } from 'src/types';

type SimLine = {
  productId: number;
  productName: string;
  spec?: string;
  unit?: string;
  note?: string;
  purchasePrice: number;
  currentPrice: number;
  currentMarginRate: number;
};

type SimMeta = {
  marginRate: number;
  minMargin: number;
  customerName?: string;
  customerRank?: string;
};

const ADJUST_PRESETS = [-10, -5, 0, 5, 10] as const;

const fieldSx = { width: { xs: '100%', sm: 200 } };
const monthFieldSx = { width: { xs: '100%', sm: 160 } };

function applyAdjustment(lines: SimLine[], adjustmentPct: number, minMargin: number) {
  return lines.map((line) => {
    const scenarioPrice = Math.round(line.currentPrice * (1 + adjustmentPct / 100));
    const scenarioMarginRate =
      Math.round(((scenarioPrice - line.purchasePrice) / line.purchasePrice) * 10000) / 100;
    return {
      ...line,
      scenarioPrice,
      scenarioMarginRate,
      priceDiff: scenarioPrice - line.currentPrice,
      alert: scenarioMarginRate < minMargin,
    };
  });
}

const SimulationPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [targetYearMonth, setTargetYearMonth] = useState('');
  const [adjustmentPct, setAdjustmentPct] = useState(0);
  const [baseLines, setBaseLines] = useState<SimLine[]>([]);
  const [meta, setMeta] = useState<SimMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const d = new Date();
    setTargetYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);

    Promise.all([
      api.get(endpoints.masters.customers),
      api.get(endpoints.masters.lookup),
    ]).then(([cRes, lRes]) => {
      const loadedCustomers: ICustomer[] = cRes.data.data.data || [];
      const loadedStores: IStore[] = lRes.data.data.stores || [];
      setCustomers(loadedCustomers);
      setStores(loadedStores);
      if (loadedCustomers.length) setCustomerId(String(loadedCustomers[0].id));
      if (loadedStores.length) setStoreId(String(loadedStores[0].id));
    });
  }, []);

  const fetchBase = useCallback(async () => {
    if (!customerId || !storeId || !targetYearMonth) {
      setBaseLines([]);
      setMeta(null);
      setFetched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(endpoints.quotations.simulate, {
        customerId: Number(customerId),
        storeId: Number(storeId),
        targetYearMonth,
        adjustmentPct: 0,
      });
      const data = res.data.data;
      setBaseLines(
        (data.lines || []).map((line: any) => ({
          productId: line.productId,
          productName: line.productName,
          spec: line.spec,
          unit: line.unit,
          note: line.note,
          purchasePrice: line.purchasePrice,
          currentPrice: line.currentPrice,
          currentMarginRate: line.currentMarginRate,
        }))
      );
      setMeta({
        marginRate: data.marginRate,
        minMargin: data.minMargin,
        customerName: data.customer?.name,
        customerRank: data.customer?.rank,
      });
      setFetched(true);
    } catch (err: any) {
      setBaseLines([]);
      setMeta(null);
      setFetched(false);
      enqueueSnackbar(err.response?.data?.message || 'シミュレーションに失敗しました', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [customerId, storeId, targetYearMonth, enqueueSnackbar]);

  // Auto-fetch when customer / store / month change (debounced)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchBase();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [fetchBase]);

  const lines = useMemo(
    () => applyAdjustment(baseLines, adjustmentPct, meta?.minMargin ?? 0),
    [baseLines, adjustmentPct, meta?.minMargin]
  );

  const summary = useMemo(() => {
    if (!lines.length) {
      return { count: 0, alerts: 0, currentTotal: 0, scenarioTotal: 0, avgScenarioMargin: 0 };
    }
    const currentTotal = lines.reduce((s, l) => s + l.currentPrice, 0);
    const scenarioTotal = lines.reduce((s, l) => s + l.scenarioPrice, 0);
    const alerts = lines.filter((l) => l.alert).length;
    const avgScenarioMargin =
      Math.round((lines.reduce((s, l) => s + l.scenarioMarginRate, 0) / lines.length) * 100) / 100;
    return { count: lines.length, alerts, currentTotal, scenarioTotal, avgScenarioMargin };
  }, [lines]);

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="見積シミュレーション"
        subtitle="条件を変えると結果がすぐ反映されます（価格調整は即時計算）"
      />

      <Paper sx={selectorBarSx}>
        <TextField
          select
          size="small"
          label="得意先"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          sx={fieldSx}
        >
          {customers.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}（{c.rank}）
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="店舗"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          sx={fieldSx}
        >
          {stores.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="仕入価格参照月"
          type="month"
          value={targetYearMonth}
          onChange={(e) => setTargetYearMonth(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={monthFieldSx}
        />

        {meta && (
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            基準粗利 {meta.marginRate}% ／ 最低 {meta.minMargin}%
            {selectedCustomer ? ` ／ ${selectedCustomer.name}` : ''}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ ...selectorBarSx, alignItems: 'center', gap: 2.5 }}>
        <Box sx={{ flex: 1, minWidth: 220, maxWidth: 520 }}>
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
            価格調整{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>
              {adjustmentPct > 0 ? '+' : ''}
              {adjustmentPct}%
            </Box>
          </Typography>
          <Slider
            value={adjustmentPct}
            onChange={(_, v) => setAdjustmentPct(v as number)}
            min={-20}
            max={20}
            step={1}
            marks={[
              { value: -20, label: '-20' },
              { value: 0, label: '0' },
              { value: 20, label: '+20' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v > 0 ? '+' : ''}${v}%`}
          />
        </Box>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={ADJUST_PRESETS.includes(adjustmentPct as typeof ADJUST_PRESETS[number]) ? adjustmentPct : null}
          onChange={(_, v) => { if (v !== null) setAdjustmentPct(v); }}
          sx={{ flexWrap: 'wrap' }}
        >
          {ADJUST_PRESETS.map((pct) => (
            <ToggleButton key={pct} value={pct} sx={{ px: 1.5, minWidth: 52 }}>
              {pct > 0 ? `+${pct}%` : `${pct}%`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {fetched && !loading && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: 2, flexShrink: 0 }}
        >
          <SummaryCard label="対象商品" value={`${summary.count}件`} />
          <SummaryCard
            label="警告"
            value={`${summary.alerts}件`}
            emphasize={summary.alerts > 0}
          />
          <SummaryCard label="現行合計" value={`¥${summary.currentTotal.toLocaleString()}`} />
          <SummaryCard
            label="シナリオ合計"
            value={`¥${summary.scenarioTotal.toLocaleString()}`}
            hint={
              summary.scenarioTotal !== summary.currentTotal
                ? `${summary.scenarioTotal - summary.currentTotal > 0 ? '+' : ''}¥${(summary.scenarioTotal - summary.currentTotal).toLocaleString()}`
                : undefined
            }
          />
          <SummaryCard label="平均粗利(シナリオ)" value={`${summary.avgScenarioMargin}%`} />
        </Stack>
      )}

      <Paper sx={{ ...tableScrollPaperSx, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.55)',
              zIndex: 2,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {!customerId || !storeId ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">得意先と店舗を選択してください</Typography>
          </Box>
        ) : fetched && lines.length === 0 && !loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              この条件ではシミュレーション対象の商品がありません（仕入価格未設定の可能性）
            </Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>品名</TableCell>
                <TableCell>規格</TableCell>
                <TableCell align="right">仕入</TableCell>
                <TableCell align="right">現行</TableCell>
                <TableCell align="right">シナリオ</TableCell>
                <TableCell align="right">差額</TableCell>
                <TableCell align="right">現行粗利%</TableCell>
                <TableCell align="right">シナリオ粗利%</TableCell>
                <TableCell>判定</TableCell>
                <TableCell>備考</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.productId} sx={{ bgcolor: line.alert ? '#FFEBEE' : undefined }}>
                  <TableCell>{line.productName}</TableCell>
                  <TableCell>{line.spec || '—'}</TableCell>
                  <TableCell align="right">¥{line.purchasePrice.toLocaleString()}</TableCell>
                  <TableCell align="right">¥{line.currentPrice.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    ¥{line.scenarioPrice.toLocaleString()}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color:
                        line.priceDiff > 0
                          ? 'error.main'
                          : line.priceDiff < 0
                            ? 'success.main'
                            : 'text.secondary',
                    }}
                  >
                    {line.priceDiff > 0 ? '+' : ''}
                    {line.priceDiff ? `¥${line.priceDiff.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell align="right">{line.currentMarginRate}%</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 500, color: line.alert ? 'error.main' : undefined }}
                  >
                    {line.scenarioMarginRate}%
                  </TableCell>
                  <TableCell>
                    {line.alert ? (
                      <Chip label="警告" color="error" size="small" />
                    ) : (
                      <Chip label="OK" color="success" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{line.note || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}> = ({ label, value, hint, emphasize }) => (
  <Paper
    variant="outlined"
    sx={{
      px: 2,
      py: 1.25,
      flex: 1,
      minWidth: 120,
      borderColor: emphasize ? 'error.light' : 'divider',
      bgcolor: emphasize ? '#FFF5F5' : 'background.paper',
    }}
  >
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="subtitle1" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
      {value}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </Paper>
);

export default SimulationPage;
