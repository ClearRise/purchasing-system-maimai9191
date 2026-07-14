import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Button, TextField, MenuItem,
} from '@mui/material';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { useSnackbar } from 'notistack';
import type { ICustomer, IStore } from 'src/types';

const QuotationNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    storeId: '',
    targetYearMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    periodStart: '',
    periodEnd: '',
    note: '',
  });

  useEffect(() => {
    api.get(endpoints.masters.customers, { params: { limit: 200 } }).then((res) => setCustomers(res.data.data.data));
    api.get(endpoints.masters.lookup).then((res) => setStores(res.data.data.stores));

    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const start = new Date(next.getFullYear(), next.getMonth(), 1);
    const end = new Date(next.getFullYear(), next.getMonth() + 1, 0);
    setForm((f) => ({
      ...f,
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
    }));
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await api.post(endpoints.quotations.list, {
        customerId: Number(form.customerId),
        storeId: Number(form.storeId),
        targetYearMonth: form.targetYearMonth,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        note: form.note,
      });
      enqueueSnackbar('見積書を作成しました', { variant: 'success' });
      navigate(`/quotations/${res.data.data.id}`);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '作成に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="新規見積書" subtitle="得意先・店舗を選択して見積を自動生成" />
      <Paper className="max-w-lg flex flex-col gap-4 p-6">
        <TextField select label="得意先" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required fullWidth>
          {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}（{c.rank}）</MenuItem>)}
        </TextField>
        <TextField select label="店舗" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} required fullWidth>
          {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </TextField>
        <TextField label="仕入価格参照月" type="month" value={form.targetYearMonth} onChange={(e) => setForm({ ...form, targetYearMonth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <TextField label="期間開始" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <TextField label="期間終了" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <TextField label="備考" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} multiline rows={2} fullWidth />
        <Button variant="contained" onClick={handleCreate} disabled={loading || !form.customerId || !form.storeId}>
          {loading ? '作成中...' : '見積書を作成'}
        </Button>
      </Paper>
    </Box>
  );
};

export default QuotationNewPage;
