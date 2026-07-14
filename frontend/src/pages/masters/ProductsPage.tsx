import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { dataGridSx } from 'src/theme/theme';
import type { IProduct, IStore } from 'src/types';

const EMPTY_FORM = {
  storeId: '',
  name: '',
  spec: '',
  unit: 'PC',
  categoryLabel: '',
  note: '',
};

const ProductsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canManageMasters } = usePermissions();
  const [rows, setRows] = useState<IProduct[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, lookupRes] = await Promise.all([
        api.get(endpoints.masters.products, { params: { limit: 100 } }),
        api.get(endpoints.masters.lookup),
      ]);
      setRows(productsRes.data.data.data);
      setStores(lookupRes.data.data.stores);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (row: IProduct) => {
    setEditId(row.id);
    setForm({
      storeId: String(row.storeId),
      name: row.name,
      spec: row.spec || '',
      unit: row.unit,
      categoryLabel: row.categoryLabel || '',
      note: row.note || '',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, storeId: Number(form.storeId) };
    try {
      if (editId) {
        await api.put(endpoints.masters.product(editId), payload);
        enqueueSnackbar('商品を更新しました', { variant: 'success' });
      } else {
        await api.post(endpoints.masters.products, payload);
        enqueueSnackbar('商品を登録しました', { variant: 'success' });
      }
      setOpen(false);
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除してよろしいですか？`)) return;
    try {
      await api.delete(endpoints.masters.product(id));
      enqueueSnackbar('商品を削除しました', { variant: 'success' });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'No.', width: 72, align: 'center', headerAlign: 'center' },
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
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              <Tooltip title="編集">
                <IconButton size="small" onClick={() => openEdit(params.row)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(params.row.id, params.row.name)}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        } as GridColDef]
      : []),
  ];

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="商品マスタ"
        subtitle="店舗別商品の管理"
        action={canManageMasters && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            新規登録
          </Button>
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
            pageSizeOptions={[20, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
              sorting: { sortModel: [{ field: 'id', sort: 'asc' }] },
            }}
            disableRowSelectionOnClick
            sx={{ ...dataGridSx }}
          />
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? '商品編集' : '商品登録'}</DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-2">
          <TextField
            select
            label="店舗"
            value={form.storeId}
            onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            required
            fullWidth
          >
            {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField
            label="品名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="規格"
            value={form.spec}
            onChange={(e) => setForm({ ...form, spec: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="単位"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            fullWidth
          >
            {['PC', 'kg', 'case', 'hon', 'CS', 'tama'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </TextField>
          <TextField
            label="カテゴリ"
            value={form.categoryLabel}
            onChange={(e) => setForm({ ...form, categoryLabel: e.target.value })}
            fullWidth
          />
          <TextField
            label="備考"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSave}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
