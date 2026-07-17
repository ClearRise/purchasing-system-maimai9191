import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, TextField, MenuItem, CircularProgress, Stack, IconButton,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormDrawer from 'src/components/common/MasterFormDrawer';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';
import { useProductLookups } from 'src/hooks/useProductLookups';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { dataGridSx } from 'src/theme/theme';
import { getSelectedRowIds } from 'src/utils/gridSelection';
import type { IProduct, IStore } from 'src/types';

type ProductForm = {
  storeId: string;
  name: string;
  spec: string;
  unit: string;
  categoryLabel: string;
  note: string;
};

const emptyForm = (defaultUnit = 'PC'): ProductForm => ({
  storeId: '',
  name: '',
  spec: '',
  unit: defaultUnit,
  categoryLabel: '',
  note: '',
});

const ProductsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canManageMasters } = usePermissions();
  const { units, specs } = useProductLookups();
  const [rows, setRows] = useState<IProduct[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [forms, setForms] = useState<ProductForm[]>([emptyForm()]);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  const selectedIds = useMemo(
    () => getSelectedRowIds(selection, rows.map((r) => r.id)),
    [selection, rows]
  );
  const mode = editId != null ? 'edit' : 'create';
  const defaultUnit = units[0] || 'PC';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, lookupRes] = await Promise.all([
        api.get(endpoints.masters.products, { params: { limit: 500 } }),
        api.get(endpoints.masters.lookup),
      ]);
      setRows(productsRes.data.data.data);
      setStores(lookupRes.data.data.stores);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditId(null);
    setForms([emptyForm(defaultUnit)]);
  };

  const openCreate = () => {
    setEditId(null);
    const base = emptyForm(defaultUnit);
    if (stores.length) base.storeId = String(stores[0].id);
    if (specs.length) base.spec = specs[0];
    setForms([base]);
    setDrawerOpen(true);
  };

  const openEdit = (row: IProduct) => {
    setEditId(row.id);
    setForms([{
      storeId: String(row.storeId),
      name: row.name,
      spec: row.spec || '',
      unit: row.unit,
      categoryLabel: row.categoryLabel || '',
      note: row.note || '',
    }]);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    for (let i = 0; i < forms.length; i++) {
      if (!forms[i].storeId || !forms[i].name.trim()) {
        enqueueSnackbar(`${i + 1}行目: 店舗と品名は必須です`, { variant: 'warning' });
        return;
      }
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(endpoints.masters.product(editId), {
          ...forms[0],
          storeId: Number(forms[0].storeId),
        });
        enqueueSnackbar('商品を更新しました', { variant: 'success' });
      } else {
        await Promise.all(forms.map((form) =>
          api.post(endpoints.masters.products, { ...form, storeId: Number(form.storeId) })
        ));
        enqueueSnackbar(`${forms.length}件を登録しました`, { variant: 'success' });
      }
      closeDrawer();
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`${selectedIds.length}件を削除してよろしいですか？`)) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(endpoints.masters.product(id))));
      enqueueSnackbar(`${selectedIds.length}件を削除しました`, { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除してよろしいですか？`)) return;
    try {
      await api.delete(endpoints.masters.product(id));
      enqueueSnackbar('商品を削除しました', { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    { field: 'name', headerName: '品名', flex: 1, minWidth: 150 },
    { field: 'spec', headerName: '規格', width: 100 },
    { field: 'unit', headerName: '単位', width: 70 },
    { field: 'categoryLabel', headerName: 'カテゴリ', width: 100 },
    {
      field: 'store',
      headerName: '店舗',
      width: 120,
      valueGetter: (_v, row) => row.store?.name || '',
    },
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
  ], [canManageMasters]);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="商品マスタ"
        subtitle="店舗別商品の管理"
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
            <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
              新規登録
            </Button>
          </>
        )}
      />

      <Paper sx={tableFlexPaperSx}>
        {loading ? (
          <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
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
            sx={{ ...dataGridSx }}
          />
        )}
      </Paper>

      <MasterFormDrawer
        open={drawerOpen}
        mode={mode}
        forms={forms}
        saving={saving}
        onClose={closeDrawer}
        onSave={handleSave}
        onAddRow={() => {
          const next = emptyForm(defaultUnit);
          if (stores.length) next.storeId = forms[0]?.storeId || String(stores[0].id);
          if (specs.length) next.spec = forms[0]?.spec || specs[0];
          setForms((prev) => [...prev, next]);
        }}
        onRemoveRow={(index) => setForms((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))}
        onChange={(index, name, value) => {
          setForms((prev) => prev.map((f, i) => (i === index ? { ...f, [name]: value } : f)));
        }}
        renderFields={(form, index) => {
          const patch = (key: keyof ProductForm, value: string) => {
            setForms((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));
          };
          const unitOptions = form.unit && !units.includes(form.unit) ? [form.unit, ...units] : units;
          const specOptions = form.spec && !specs.includes(form.spec) ? [form.spec, ...specs] : specs;

          return (
            <Stack spacing={1.5}>
              <TextField
                select
                label="店舗"
                value={form.storeId}
                onChange={(e) => patch('storeId', e.target.value)}
                required
                fullWidth
                size="small"
              >
                {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
              <TextField
                label="品名"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                select
                label="規格"
                value={form.spec}
                onChange={(e) => patch('spec', e.target.value)}
                fullWidth
                size="small"
                disabled={!specOptions.length}
              >
                {specOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField
                select
                label="単位"
                value={form.unit}
                onChange={(e) => patch('unit', e.target.value)}
                fullWidth
                size="small"
              >
                {unitOptions.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
              <TextField
                label="カテゴリ"
                value={form.categoryLabel}
                onChange={(e) => patch('categoryLabel', e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="備考"
                value={form.note}
                onChange={(e) => patch('note', e.target.value)}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </Stack>
          );
        }}
      />
    </Box>
  );
};

export default ProductsPage;
