import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, TextField, MenuItem, CircularProgress, Stack, IconButton, Link,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormPanel from 'src/components/common/MasterFormPanel';
import StoreProductsPanel from 'src/components/masters/StoreProductsPanel';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { dataGridSx } from 'src/theme/theme';
import { getSelectedRowIds } from 'src/utils/gridSelection';
import type { IStore } from 'src/types';

const RANK_OPTIONS = ['A', 'B', 'C', 'D', 'N'] as const;

type StoreForm = {
  name: string;
  rank: string;
  groupName: string;
  location: string;
  nameKana: string;
  nameAbbr: string;
  email: string;
  ccEmail: string;
  note: string;
};

const emptyForm = (): StoreForm => ({
  name: '',
  rank: 'C',
  groupName: '',
  location: '',
  nameKana: '',
  nameAbbr: '',
  email: '',
  ccEmail: '',
  note: '',
});

const StoresPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canManageMasters, canManageCustomers } = usePermissions();
  const canEdit = canManageMasters || canManageCustomers;

  const [rows, setRows] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StoreForm>(() => emptyForm());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [productsStore, setProductsStore] = useState<IStore | null>(null);

  const selectedIds = useMemo(
    () => getSelectedRowIds(selection, rows.map((r) => r.id)),
    [selection, rows]
  );
  const mode = editId != null ? 'edit' : 'create';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.masters.stores);
      setRows(res.data.data.data || res.data.data);
    } catch {
      enqueueSnackbar('得意先の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const loadStoreDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(endpoints.masters.store(id));
      const store: IStore = res.data.data;
      setForm({
        name: store.name || '',
        rank: store.rank || 'C',
        groupName: store.groupName || '',
        location: store.location || '',
        nameKana: store.nameKana || '',
        nameAbbr: store.nameAbbr || '',
        email: store.email || '',
        ccEmail: store.ccEmail || '',
        note: store.note || '',
      });
    } catch {
      enqueueSnackbar('得意先詳細の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const closeProducts = () => {
    setProductsStore(null);
  };

  const openCreate = () => {
    setProductsStore(null);
    setEditId(null);
    setForm(emptyForm());
    setPanelOpen(true);
  };

  const openEdit = async (row: IStore) => {
    setProductsStore(null);
    setEditId(row.id);
    setPanelOpen(true);
    await loadStoreDetail(row.id);
  };

  const openProducts = (row: IStore) => {
    setPanelOpen(false);
    setEditId(null);
    setForm(emptyForm());
    setProductsStore(row);
  };

  const buildPayload = () => ({
    name: form.name,
    rank: form.rank,
    groupName: form.groupName,
    location: form.location,
    nameKana: form.nameKana,
    nameAbbr: form.nameAbbr,
    email: form.email,
    ccEmail: form.ccEmail,
    note: form.note,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('得意先名は必須です', { variant: 'warning' });
      return;
    }
    if (!form.rank.trim()) {
      enqueueSnackbar('ランクは必須です', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(endpoints.masters.store(editId), buildPayload());
        enqueueSnackbar('得意先を更新しました', { variant: 'success' });
        closePanel();
      } else {
        await api.post(endpoints.masters.stores, buildPayload());
        enqueueSnackbar('得意先を登録しました。取扱商品は一覧のリンクから登録できます。', { variant: 'success' });
        setForm(emptyForm());
      }
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
      await Promise.all(selectedIds.map((id) => api.delete(endpoints.masters.store(id))));
      enqueueSnackbar(`${selectedIds.length}件を削除しました`, { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      fetchData();
    } catch {
      enqueueSnackbar('削除に失敗しました', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除してよろしいですか？')) return;
    try {
      await api.delete(endpoints.masters.store(id));
      enqueueSnackbar('削除しました', { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      if (editId === id) closePanel();
      fetchData();
    } catch {
      enqueueSnackbar('削除に失敗しました', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    { field: 'name', headerName: '得意先名', flex: 1, minWidth: 150 },
    { field: 'rank', headerName: 'ランク', width: 80 },
    {
      field: 'productCount',
      headerName: '取扱商品',
      width: 110,
      sortable: false,
      renderCell: (params) => {
        const count = Number(params.row.productCount ?? 0);
        return (
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={(e) => {
              e.stopPropagation();
              openProducts(params.row);
            }}
            sx={{
              font: 'inherit',
              cursor: 'pointer',
              border: 0,
              background: 'none',
              p: 0,
              color: 'primary.main',
            }}
          >
            {count}件
          </Link>
        );
      },
    },
    { field: 'groupName', headerName: 'グループ', width: 130 },
    { field: 'location', headerName: '位置', width: 130 },
    { field: 'email', headerName: 'メール', width: 180 },
    { field: 'note', headerName: '備考', flex: 1, minWidth: 120 },
    ...(canEdit
      ? [{
          field: 'actions',
          headerName: '',
          width: 88,
          sortable: false,
          renderCell: (params: { row: IStore }) => (
            <Box sx={{ display: 'flex', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={() => openEdit(params.row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ),
        } as GridColDef]
      : []),
  ], [canEdit]);

  const sidePanelOpen = panelOpen || Boolean(productsStore);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="得意先マスタ"
        subtitle="取扱商品は一覧の件数リンクから登録します。見積作成時に明細へ自動反映されます。"
        action={canEdit && (
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
            display: { xs: sidePanelOpen ? 'none' : 'flex', md: 'flex' },
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
              checkboxSelection={canEdit}
              rowSelectionModel={selection}
              onRowSelectionModelChange={setSelection}
              pageSizeOptions={[20, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
              disableRowSelectionOnClick
              onRowDoubleClick={(params) => canEdit && openEdit(params.row)}
              sx={{ ...dataGridSx }}
            />
          )}
        </Paper>

        <MasterFormPanel
          open={panelOpen}
          mode={mode}
          form={form as unknown as Record<string, string>}
          saving={saving}
          onClose={closePanel}
          onSave={handleSave}
          onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
          renderFields={(f) => (
            loadingDetail ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Stack spacing={1.5}>
                <TextField
                  label="得意先名"
                  value={f.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  fullWidth
                  size="small"
                  autoFocus
                />
                <TextField
                  select
                  label="ランク"
                  value={f.rank}
                  onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value }))}
                  required
                  fullWidth
                  size="small"
                >
                  {RANK_OPTIONS.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="グループ"
                  value={f.groupName}
                  onChange={(e) => setForm((prev) => ({ ...prev, groupName: e.target.value }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="位置"
                  value={f.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="フリガナ"
                  value={f.nameKana}
                  onChange={(e) => setForm((prev) => ({ ...prev, nameKana: e.target.value }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="略号"
                  value={f.nameAbbr}
                  onChange={(e) => setForm((prev) => ({ ...prev, nameAbbr: e.target.value }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="メール"
                  value={f.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="CCメール"
                  value={f.ccEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, ccEmail: e.target.value }))}
                  fullWidth
                  size="small"
                />
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
            )
          )}
        />

        <StoreProductsPanel
          open={Boolean(productsStore)}
          store={productsStore}
          canEdit={canEdit}
          onClose={closeProducts}
          onSaved={(storeId, productCount) => {
            setRows((prev) => prev.map((r) => (
              r.id === storeId ? { ...r, productCount } : r
            )));
          }}
        />
      </Box>
    </Box>
  );
};

export default StoresPage;
