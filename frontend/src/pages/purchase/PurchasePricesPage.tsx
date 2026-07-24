import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, TextField, Typography, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import PriceMatrixTable from 'src/components/purchase/PriceMatrixTable';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { gridToMatrix } from 'src/utils/purchasePriceMatrix';
import type { IStore } from 'src/types';
import { usePermissions } from 'src/hooks/usePermissions';
import { pageTableRootSx } from 'src/constants/layout';

const ALL_STORES = 'all';

const PurchasePricesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canManagePrices } = usePermissions();
  const [targetYearMonth, setTargetYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [storeId, setStoreId] = useState(ALL_STORES);
  const [storeSearch, setStoreSearch] = useState('');
  const [stores, setStores] = useState<IStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [gridRows, setGridRows] = useState<any[]>([]);
  const [edited, setEdited] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingStores(true);
    api.get(endpoints.masters.lookup)
      .then((res) => {
        setStores(res.data.data.stores || []);
      })
      .catch(() => enqueueSnackbar('得意先の取得に失敗しました', { variant: 'error' }))
      .finally(() => setLoadingStores(false));
  }, [enqueueSnackbar]);

  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => {
      const hay = [s.name, s.groupName, s.location].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [stores, storeSearch]);

  const fetchGrid = async () => {
    setLoading(true);
    setEdited({});
    try {
      const res = await api.get(endpoints.purchasePrices.grid, {
        params: {
          targetYearMonth,
          forEntry: true,
          ...(storeId !== ALL_STORES ? { storeId: Number(storeId) } : {}),
        },
      });
      setGridRows(res.data.data);
    } catch {
      enqueueSnackbar('データの取得に失敗しました', { variant: 'error' });
      setGridRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetYearMonth, storeId]);

  const { columns, rows } = useMemo(() => gridToMatrix(gridRows), [gridRows]);

  const editedCount = Object.keys(edited).length;
  const selectedStore = storeId === ALL_STORES
    ? null
    : stores.find((s) => String(s.id) === storeId);
  const storeLabel = storeId === ALL_STORES ? '全得意先' : (selectedStore?.name || '');
  const storeSearchQ = storeSearch.trim().toLowerCase();
  const showAllInSearch = !storeSearchQ || '全得意先'.includes(storeSearch.trim()) || 'すべて'.includes(storeSearchQ);


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

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="月別仕入価格入力"
        subtitle="得意先で商品を絞り込み、発注先×年月で価格を入力（価格は得意先共通）"
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

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
        }}
      >
        <Paper
          sx={{
            width: { xs: '100%', md: 260 },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: { xs: 220, md: 0 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              得意先一覧
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="得意先を検索"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {loadingStores ? (
            <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : !showAllInSearch && filteredStores.length === 0 ? (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                該当する得意先がありません
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {showAllInSearch && (
                <Box
                  onClick={() => setStoreId(ALL_STORES)}
                  sx={{
                    px: 1.5,
                    py: 1.1,
                    cursor: 'pointer',
                    bgcolor: storeId === ALL_STORES ? '#F1F5F9' : 'transparent',
                    color: storeId === ALL_STORES ? 'text.primary' : 'text.secondary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: storeId === ALL_STORES ? '#E2E8F0' : 'action.hover',
                      color: 'text.primary',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: storeId === ALL_STORES ? 500 : 400, color: 'inherit' }}
                  >
                    全得意先
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    すべての商品を表示
                  </Typography>
                </Box>
              )}
              {filteredStores.map((store) => {
                const active = String(store.id) === storeId;
                return (
                  <Box
                    key={store.id}
                    onClick={() => setStoreId(String(store.id))}
                    sx={{
                      px: 1.5,
                      py: 1.1,
                      cursor: 'pointer',
                      bgcolor: active ? '#F1F5F9' : 'transparent',
                      color: active ? 'text.primary' : 'text.secondary',
                      '&:hover': {
                        bgcolor: active ? '#E2E8F0' : 'action.hover',
                        color: 'text.primary',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: active ? 500 : 400, color: 'inherit' }}
                    >
                      {store.name}
                    </Typography>
                    {(store.groupName || store.location) && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {[store.groupName, store.location].filter(Boolean).join(' · ')}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>

        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Paper
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 1.5,
              flexShrink: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              label="対象年月"
              type="month"
              value={targetYearMonth}
              onChange={(e) => setTargetYearMonth(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Typography variant="body2" color="text.secondary">
              {storeLabel}
              {!loading && ` · ${rows.length} 商品 · ${columns.length} 発注先`}
            </Typography>
          </Paper>

          {canManagePrices && editedCount > 0 && (
            <Alert severity="info" sx={{ flexShrink: 0 }}>
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
              emptyMessage={
                storeId === ALL_STORES
                  ? '商品がありません。商品マスタを登録してください。'
                  : 'この得意先に商品がありません。商品マスタを登録してください。'
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PurchasePricesPage;
