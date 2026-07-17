import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, TextField, MenuItem, Typography, Alert,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import PriceMatrixTable from 'src/components/purchase/PriceMatrixTable';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { gridToMatrix } from 'src/utils/purchasePriceMatrix';
import type { IStore } from 'src/types';
import { usePermissions } from 'src/hooks/usePermissions';
import { pageTableRootSx, filterPaperSx } from 'src/constants/layout';

const PurchasePricesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canManagePrices } = usePermissions();
  const [targetYearMonth, setTargetYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<IStore[]>([]);
  const [gridRows, setGridRows] = useState<any[]>([]);
  const [edited, setEdited] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(endpoints.masters.lookup).then((res) => {
      const loaded: IStore[] = res.data.data.stores || [];
      setStores(loaded);
      if (loaded.length) setStoreId(String(loaded[0].id));
    });
  }, []);

  const fetchGrid = async () => {
    if (!storeId) return;
    setLoading(true);
    setEdited({});
    try {
      const res = await api.get(endpoints.purchasePrices.grid, {
        params: {
          targetYearMonth,
          storeId: Number(storeId),
          forEntry: true,
        },
      });
      setGridRows(res.data.data);
    } catch {
      enqueueSnackbar('データの取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchGrid();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetYearMonth, storeId]);

  const { columns, rows } = useMemo(() => gridToMatrix(gridRows), [gridRows]);

  const editedCount = Object.keys(edited).length;

  const handleCellChange = (productId: number, colKey: string, value: string) => {
    const key = `${productId}-${colKey}`;
    if (value === '' || value === '-') {
      const next = { ...edited };
      delete next[key];
      setEdited(next);
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) setEdited({ ...edited, [key]: num });
  };

  const handleSave = async () => {
    if (!editedCount) {
      enqueueSnackbar('変更がありません', { variant: 'info' });
      return;
    }
    const items = Object.entries(edited).map(([key, purchasePrice]) => {
      const [productId, supplierId] = key.split('-').map(Number);
      const row = gridRows.find((r) => r.productId === productId);
      const sp = row?.suppliers.find((s: any) => s.supplierId === supplierId);
      return { productId, supplierId, purchasePrice, unit: sp?.unit || row?.unit || 'PC' };
    });
    setSaving(true);
    try {
      await api.post(endpoints.purchasePrices.bulk, { targetYearMonth, items });
      enqueueSnackbar(`${items.length}件の仕入価格を保存しました`, { variant: 'success' });
      fetchGrid();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const selectedStore = stores.find((s) => String(s.id) === storeId);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="月別仕入価格入力"
        subtitle="商品を行、発注先を列としたマトリクスで一括入力"
        action={canManagePrices && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSave}
            disabled={saving || !editedCount}
          >
            {saving ? '保存中...' : `保存${editedCount ? ` (${editedCount})` : ''}`}
          </Button>
        )}
      />

      <Paper sx={filterPaperSx}>
        <TextField
          label="対象年月"
          type="month"
          value={targetYearMonth}
          onChange={(e) => setTargetYearMonth(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="店舗"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          sx={{ minWidth: 220 }}
          required
        >
          {stores.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
          ))}
        </TextField>
        {selectedStore && (
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: { sm: 0.5 } }}>
            {rows.length} 商品 · {columns.length} 発注先
          </Typography>
        )}
      </Paper>

      {canManagePrices && editedCount > 0 && (
        <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
          {editedCount} セルに未保存の変更があります。入力後「保存」を押してください。
        </Alert>
      )}

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PriceMatrixTable
        columns={columns}
        rows={rows}
        loading={loading}
        editable={canManagePrices}
        edited={edited}
        onCellChange={handleCellChange}
        emptyMessage="この店舗に商品がありません。商品マスタを登録してください。"
        />
      </Box>
    </Box>
  );
};

export default PurchasePricesPage;
