import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Button, TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Chip, Slider, Typography,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { pageTableRootSx, filterPaperSx, tableScrollPaperSx } from 'src/constants/layout';
import type { ICustomer, IStore } from 'src/types';

const SimulationPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [form, setForm] = useState({ customerId: '', storeId: '', targetYearMonth: '', adjustmentPct: 0 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(endpoints.masters.customers, { params: { limit: 200 } }).then((res) => setCustomers(res.data.data.data));
    api.get(endpoints.masters.lookup).then((res) => setStores(res.data.data.stores));
    const d = new Date();
    setForm((f) => ({ ...f, targetYearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }));
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post(endpoints.quotations.simulate, {
        customerId: Number(form.customerId),
        storeId: Number(form.storeId),
        targetYearMonth: form.targetYearMonth,
        adjustmentPct: form.adjustmentPct,
      });
      setResult(res.data.data);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'シミュレーションに失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader title="見積シミュレーション" subtitle="値上げ・値下げの利益影響を確認" />

      <Paper sx={{ ...filterPaperSx, maxWidth: 560, flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
        <TextField select label="得意先" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} fullWidth>
          {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}（{c.rank}）</MenuItem>)}
        </TextField>
        <TextField select label="店舗" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} fullWidth>
          {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </TextField>
        <TextField label="仕入価格参照月" type="month" value={form.targetYearMonth} onChange={(e) => setForm({ ...form, targetYearMonth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <Box>
          <Typography variant="body2" gutterBottom>価格調整: {form.adjustmentPct > 0 ? '+' : ''}{form.adjustmentPct}%</Typography>
          <Slider value={form.adjustmentPct} onChange={(_, v) => setForm({ ...form, adjustmentPct: v as number })} min={-20} max={20} step={1} marks valueLabelDisplay="auto" />
        </Box>
        <Button variant="contained" startIcon={<CalculateIcon />} onClick={runSimulation} disabled={loading || !form.customerId || !form.storeId}>
          シミュレーション実行
        </Button>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {result && (
        <Paper sx={tableScrollPaperSx}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>品名</TableCell>
                <TableCell align="right">仕入</TableCell>
                <TableCell align="right">現行</TableCell>
                <TableCell align="right">シナリオ</TableCell>
                <TableCell align="right">現行粗利%</TableCell>
                <TableCell align="right">シナリオ粗利%</TableCell>
                <TableCell>判定</TableCell>
                <TableCell>備考</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.lines.map((line: any) => (
                <TableRow key={line.productId} sx={{ bgcolor: line.alert ? '#FFEBEE' : undefined }}>
                  <TableCell>{line.productName}</TableCell>
                  <TableCell align="right">¥{line.purchasePrice}</TableCell>
                  <TableCell align="right">¥{line.currentPrice}</TableCell>
                  <TableCell align="right">¥{line.scenarioPrice}</TableCell>
                  <TableCell align="right">{line.currentMarginRate}%</TableCell>
                  <TableCell align="right">{line.scenarioMarginRate}%</TableCell>
                  <TableCell>
                    {line.alert ? <Chip label="警告" color="error" size="small" /> : <Chip label="OK" color="success" size="small" />}
                  </TableCell>
                  <TableCell>{line.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default SimulationPage;
