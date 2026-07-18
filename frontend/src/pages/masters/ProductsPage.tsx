import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box, Paper, Button, TextField, MenuItem, CircularProgress, Stack, IconButton, Typography, InputAdornment,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormPanel from 'src/components/common/MasterFormPanel';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';
import { useProductLookups } from 'src/hooks/useProductLookups';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { dataGridSx } from 'src/theme/theme';
import { getSelectedRowIds } from 'src/utils/gridSelection';
import type { ICategory, IProduct, IStore } from 'src/types';

type ProductForm = {
  name: string;
  spec: string;
  unit: string;
  categoryId: string;
  note: string;
};

type CatalogOption = Pick<IProduct, 'id' | 'name' | 'spec' | 'unit' | 'categoryLabel' | 'categoryId' | 'note' | 'productCode'>;

const emptyForm = (defaultUnit = 'PC'): ProductForm => ({
  name: '',
  spec: '',
  unit: defaultUnit,
  categoryId: '',
  note: '',
});

const ProductsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canManageMasters } = usePermissions();
  const { units, specsByUnit } = useProductLookups();
  const [rows, setRows] = useState<IProduct[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [storeId, setStoreId] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(() => emptyForm());
  const [selectedCatalogId, setSelectedCatalogId] = useState<number | null>(null);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  const selectedIds = useMemo(
    () => getSelectedRowIds(selection, rows.map((r) => r.id)),
    [selection, rows]
  );
  const mode = editId != null ? 'edit' : 'create';
  const defaultUnit = units[0] || 'PC';
  const selectedStore = stores.find((s) => String(s.id) === storeId);
  const fieldsLocked = mode === 'create' && selectedCatalogId != null;

  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => {
      const hay = [s.name, s.groupName, s.location].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [stores, storeSearch]);

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const res = await api.get(endpoints.masters.lookup);
      const loaded: IStore[] = res.data.data.stores || [];
      setStores(loaded);
      setCategories(res.data.data.categories || []);
      setStoreId((prev) => {
        if (prev && loaded.some((s) => String(s.id) === prev)) return prev;
        return loaded.length ? String(loaded[0].id) : '';
      });
    } catch {
      enqueueSnackbar('店舗の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoadingStores(false);
    }
  }, [enqueueSnackbar]);

  const fetchProducts = useCallback(async (sid: string) => {
    if (!sid) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(endpoints.masters.products, {
        params: { limit: 500, storeId: Number(sid) },
      });
      setRows(res.data.data.data || []);
    } catch {
      enqueueSnackbar('商品の取得に失敗しました', { variant: 'error' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchCatalog = useCallback(async (search: string, sid: string) => {
    if (!sid) {
      setCatalogOptions([]);
      return;
    }
    setCatalogLoading(true);
    try {
      const res = await api.get(endpoints.masters.productsCatalog, {
        params: {
          search: search.trim() || undefined,
          excludeStoreId: Number(sid),
          limit: 40,
        },
      });
      setCatalogOptions(res.data.data || []);
    } catch {
      setCatalogOptions([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    setSelection({ type: 'include', ids: new Set() });
    setPanelOpen(false);
    setEditId(null);
    setSelectedCatalogId(null);
    setForm(emptyForm(units[0] || 'PC'));
    fetchProducts(storeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fetchProducts]);

  const selectStore = (id: number) => {
    setStoreId(String(id));
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setSelectedCatalogId(null);
    setForm(emptyForm(defaultUnit));
  };

  const openCreate = () => {
    if (!storeId) {
      enqueueSnackbar('先に店舗を選択してください', { variant: 'warning' });
      return;
    }
    setEditId(null);
    setSelectedCatalogId(null);
    const base = emptyForm(defaultUnit);
    const related = specsByUnit[base.unit] || [];
    if (related.length) base.spec = related[0];
    setForm(base);
    setPanelOpen(true);
    fetchCatalog('', storeId);
  };

  const openEdit = (row: IProduct) => {
    setEditId(row.id);
    setSelectedCatalogId(null);
    setForm({
      name: row.name,
      spec: row.spec || '',
      unit: row.unit,
      categoryId: row.categoryId != null ? String(row.categoryId) : '',
      note: row.note || '',
    });
    setPanelOpen(true);
  };

  const applyCatalogProduct = (product: CatalogOption | null, inputName?: string) => {
    if (!product) {
      setSelectedCatalogId(null);
      if (inputName !== undefined) {
        setForm((prev) => ({ ...prev, name: inputName }));
      }
      return;
    }
    setSelectedCatalogId(product.id);
    setForm({
      name: product.name,
      spec: product.spec || '',
      unit: product.unit || defaultUnit,
      categoryId: product.categoryId != null ? String(product.categoryId) : '',
      note: product.note || '',
    });
  };

  const handleSave = async () => {
    if (!storeId) {
      enqueueSnackbar('先に店舗を選択してください', { variant: 'warning' });
      return;
    }
    if (!form.name.trim()) {
      enqueueSnackbar('品名は必須です', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(endpoints.masters.product(editId), {
          name: form.name,
          unit: form.unit,
          spec: form.spec,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          note: form.note,
        });
        enqueueSnackbar('商品を更新しました', { variant: 'success' });
        closePanel();
      } else {
        const payload = selectedCatalogId
          ? { productId: selectedCatalogId, storeId: Number(storeId) }
          : {
              name: form.name,
              unit: form.unit,
              spec: form.spec,
              categoryId: form.categoryId ? Number(form.categoryId) : null,
              note: form.note,
              storeId: Number(storeId),
            };
        await api.post(endpoints.masters.products, payload);
        enqueueSnackbar(
          selectedCatalogId ? '既存商品を店舗に追加しました' : '商品を登録しました',
          { variant: 'success' }
        );
        const next = emptyForm(defaultUnit);
        next.unit = form.unit || defaultUnit;
        const related = specsByUnit[next.unit] || [];
        if (related.length) next.spec = related.includes(form.spec) ? form.spec : related[0];
        setForm(next);
        setSelectedCatalogId(null);
        fetchCatalog('', storeId);
      }
      fetchProducts(storeId);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteParams = { params: { storeId: Number(storeId) } };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !storeId) return;
    if (!confirm(`${selectedIds.length}件をこの店舗から外してよろしいですか？`)) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(endpoints.masters.product(id), deleteParams)));
      enqueueSnackbar(`${selectedIds.length}件を店舗から外しました`, { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      fetchProducts(storeId);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!storeId) return;
    if (!confirm(`「${name}」をこの店舗から外してよろしいですか？`)) return;
    try {
      await api.delete(endpoints.masters.product(id), deleteParams);
      enqueueSnackbar('店舗から商品を外しました', { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      if (editId === id) closePanel();
      fetchProducts(storeId);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    { field: 'name', headerName: '品名', flex: 1, minWidth: 150 },
    { field: 'unit', headerName: '単位', width: 70 },
    { field: 'spec', headerName: '規格', width: 100 },
    { field: 'categoryLabel', headerName: 'カテゴリ', width: 120 },
    { field: 'note', headerName: '備考', flex: 1, minWidth: 120 },
    ...(canManageMasters
      ? [{
          field: 'actions',
          headerName: '',
          width: 88,
          sortable: false,
          renderCell: (params: { row: IProduct }) => (
            <Box sx={{ display: 'flex', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={() => openEdit(params.row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(params.row.id, params.row.name)}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ),
        } as GridColDef]
      : []),
  ], [canManageMasters, editId, storeId]);

  const unitOptions = form.unit && !units.includes(form.unit) ? [form.unit, ...units] : units;
  const relatedSpecs = specsByUnit[form.unit] || [];
  const specOptions = form.spec && !relatedSpecs.includes(form.spec)
    ? [form.spec, ...relatedSpecs]
    : relatedSpecs;

  const handleUnitChange = (nextUnit: string) => {
    const related = specsByUnit[nextUnit] || [];
    setForm((prev) => ({
      ...prev,
      unit: nextUnit,
      spec: related.includes(prev.spec) ? prev.spec : (related[0] || ''),
    }));
  };

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="商品マスタ"
        subtitle="店舗を選んで商品を紐づけます（同一商品を複数店舗で共有）"
        action={canManageMasters && (
          <>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlinedIcon />}
              onClick={handleBulkDelete}
              disabled={!selectedIds.length}
            >
              一括削除{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlinedIcon />}
              onClick={openCreate}
              disabled={!storeId}
            >
              新規登録
            </Button>
          </>
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
              店舗一覧
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="店舗を検索"
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
          ) : filteredStores.length === 0 ? (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {stores.length ? '該当する店舗がありません' : '店舗がありません'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {filteredStores.map((store) => {
                const active = String(store.id) === storeId;
                return (
                  <Box
                    key={store.id}
                    onClick={() => selectStore(store.id)}
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

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 1.5,
          }}
        >
          <Paper
            sx={{
              ...tableFlexPaperSx,
              display: { xs: panelOpen ? 'none' : 'flex', md: 'flex' },
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minHeight: 44,
              }}
            >
              <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {selectedStore ? `${selectedStore.name} の商品` : '商品一覧'}
              </Typography>
              {selectedStore && (
                <Typography variant="caption" color="text.secondary">
                  {loading ? '読込中…' : `${rows.length}件`}
                </Typography>
              )}
            </Box>

            {!storeId ? (
              <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary">
                  左のリストから店舗を選択してください
                </Typography>
              </Box>
            ) : loading ? (
              <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <DataGrid
                rows={rows}
                columns={columns}
                checkboxSelection={canManageMasters}
                rowSelectionModel={selection}
                onRowSelectionModelChange={setSelection}
                pageSizeOptions={[20, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                disableRowSelectionOnClick
                onRowDoubleClick={(params) => canManageMasters && openEdit(params.row)}
                sx={{ ...dataGridSx, border: 0 }}
                localeText={{ noRowsLabel: 'この店舗に商品がありません' }}
              />
            )}
          </Paper>

          <MasterFormPanel
            open={panelOpen}
            mode={mode}
            form={form}
            saving={saving}
            onClose={closePanel}
            onSave={handleSave}
            onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
            renderFields={(f) => (
              <Stack spacing={1.5}>
                <TextField
                  label="店舗"
                  value={selectedStore?.name || ''}
                  fullWidth
                  size="small"
                  disabled
                />
                {mode === 'create' ? (
                  <Autocomplete
                    freeSolo
                    options={catalogOptions}
                    loading={catalogLoading}
                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    filterOptions={(x) => x}
                    value={
                      selectedCatalogId
                        ? catalogOptions.find((o) => o.id === selectedCatalogId) || {
                            id: selectedCatalogId,
                            name: f.name,
                            productCode: '',
                            unit: f.unit,
                            spec: f.spec,
                            categoryId: f.categoryId ? Number(f.categoryId) : null,
                            categoryLabel: categories.find((c) => String(c.id) === f.categoryId)?.name || '',
                            note: f.note,
                          }
                        : null
                    }
                    inputValue={f.name}
                    onInputChange={(_e, value, reason) => {
                      if (reason === 'reset') return;
                      if (selectedCatalogId) {
                        const selected = catalogOptions.find((o) => o.id === selectedCatalogId);
                        if (selected && value === selected.name) return;
                        setSelectedCatalogId(null);
                      }
                      setForm((prev) => ({ ...prev, name: value }));
                      fetchCatalog(value, storeId);
                    }}
                    onChange={(_e, value) => {
                      if (typeof value === 'string') {
                        applyCatalogProduct(null, value);
                      } else {
                        applyCatalogProduct(value);
                      }
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[option.unit, option.spec, option.categoryLabel].filter(Boolean).join(' · ')}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="品名"
                        required
                        size="small"
                        autoFocus
                        helperText="既存商品を選ぶか、新しい品名を入力"
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {catalogLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                ) : (
                  <TextField
                    label="品名"
                    value={f.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    fullWidth
                    size="small"
                    autoFocus
                  />
                )}
                <TextField
                  select
                  label="単位"
                  value={f.unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  disabled={fieldsLocked}
                >
                  {unitOptions.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </TextField>
                <TextField
                  select
                  label="規格"
                  value={f.spec}
                  onChange={(e) => setForm((prev) => ({ ...prev, spec: e.target.value }))}
                  fullWidth
                  size="small"
                  disabled={fieldsLocked || !specOptions.length}
                  helperText={
                    fieldsLocked
                      ? '既存商品の内容です'
                      : (!specOptions.length ? 'この単位に紐づく規格がありません（システム設定で登録）' : undefined)
                  }
                >
                  {specOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField
                  select
                  label="カテゴリ"
                  value={f.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  fullWidth
                  size="small"
                  disabled={fieldsLocked}
                >
                  <MenuItem value="">（なし）</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="備考"
                  value={f.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  disabled={fieldsLocked}
                />
              </Stack>
            )}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProductsPage;
