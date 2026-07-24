import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, TextField, MenuItem, CircularProgress, Stack, IconButton,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormPanel from 'src/components/common/MasterFormPanel';
import CategoryManagerDialog from 'src/components/masters/CategoryManagerDialog';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';
import { useProductLookups } from 'src/hooks/useProductLookups';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { dataGridSx } from 'src/theme/theme';
import { getSelectedRowIds } from 'src/utils/gridSelection';
import type { ICategory, IProduct } from 'src/types';

type ProductForm = {
  name: string;
  spec: string;
  unit: string;
  categoryId: string;
  note: string;
};

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
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const selectedIds = useMemo(
    () => getSelectedRowIds(selection, rows.map((r) => r.id)),
    [selection, rows]
  );
  const mode = editId != null ? 'edit' : 'create';
  const defaultUnit = units[0] || 'PC';

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get(endpoints.masters.lookup);
      setCategories(res.data.data.categories || []);
    } catch {
      enqueueSnackbar('カテゴリの取得に失敗しました', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.masters.products);
      setRows(res.data.data.data || res.data.data || []);
    } catch {
      enqueueSnackbar('商品の取得に失敗しました', { variant: 'error' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(emptyForm(defaultUnit));
  };

  const openCreate = () => {
    setEditId(null);
    const base = emptyForm(defaultUnit);
    const related = specsByUnit[base.unit] || [];
    if (related.length) base.spec = related[0];
    setForm(base);
    setPanelOpen(true);
  };

  const openEdit = (row: IProduct) => {
    setEditId(row.id);
    setForm({
      name: row.name,
      spec: row.spec || '',
      unit: row.unit,
      categoryId: row.categoryId != null ? String(row.categoryId) : '',
      note: row.note || '',
    });
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('品名は必須です', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        unit: form.unit,
        spec: form.spec,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        note: form.note,
      };
      if (editId) {
        await api.put(endpoints.masters.product(editId), payload);
        enqueueSnackbar('商品を更新しました', { variant: 'success' });
        closePanel();
      } else {
        await api.post(endpoints.masters.products, payload);
        enqueueSnackbar('商品を登録しました', { variant: 'success' });
        setForm(emptyForm(defaultUnit));
      }
      fetchProducts();
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
      fetchProducts();
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
      if (editId === id) closePanel();
      fetchProducts();
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
  ], [canManageMasters, editId]);

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
        subtitle="全社共通の商品マスタ"
        action={canManageMasters && (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CategoryOutlinedIcon />}
              onClick={() => setCategoryDialogOpen(true)}
            >
              カテゴリ
            </Button>
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
            >
              新規登録
            </Button>
          </>
        )}
      />

      <CategoryManagerDialog
        open={categoryDialogOpen}
        categories={categories}
        onClose={() => setCategoryDialogOpen(false)}
        onSaved={(next) => {
          setCategories(next);
          setForm((prev) => {
            if (!prev.categoryId) return prev;
            const still = next.some((c) => String(c.id) === prev.categoryId);
            return still ? prev : { ...prev, categoryId: '' };
          });
          fetchProducts();
        }}
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
            ...tableFlexPaperSx,
            display: { xs: panelOpen ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
          }}
        >
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
              sx={{ ...dataGridSx, border: 0 }}
              localeText={{ noRowsLabel: '商品がありません' }}
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
                label="品名"
                value={f.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
                size="small"
                autoFocus
              />
              <TextField
                select
                label="単位"
                value={f.unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                fullWidth
                size="small"
                required
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
                disabled={!specOptions.length}
                helperText={
                  !specOptions.length ? 'この単位に紐づく規格がありません（システム設定で登録）' : undefined
                }
              >
                {specOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  select
                  label="カテゴリ"
                  value={f.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  fullWidth
                  size="small"
                  helperText={
                    !categories.length
                      ? 'カテゴリがありません。「カテゴリ」から登録してください'
                      : undefined
                  }
                >
                  <MenuItem value="">（なし）</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </TextField>
                {canManageMasters && (
                  <IconButton
                    size="small"
                    onClick={() => setCategoryDialogOpen(true)}
                    sx={{ mt: 0.5, flexShrink: 0 }}
                    title="カテゴリを管理"
                  >
                    <CategoryOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <TextField
                label="備考"
                value={f.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </Stack>
          )}
        />
      </Box>
    </Box>
  );
};

export default ProductsPage;
