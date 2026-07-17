import { useCallback, useEffect, useMemo, useState } from 'react';
import { Paper, Button, IconButton, Box, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormDrawer, { type MasterField } from 'src/components/common/MasterFormDrawer';
import { api } from 'src/libs/api';
import { dataGridSx } from 'src/theme/theme';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { getSelectedRowIds } from 'src/utils/gridSelection';

export type { MasterField };

interface MasterCrudPageProps {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: GridColDef[];
  fields: MasterField[];
  canEdit?: boolean;
}

type FormRow = Record<string, string>;

function emptyForm(fields: MasterField[]): FormRow {
  return Object.fromEntries(fields.map((f) => [f.name, '']));
}

function MasterCrudPage<T extends { id: number; [key: string]: unknown }>({
  title, subtitle, endpoint, columns, fields, canEdit = true,
}: MasterCrudPageProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [forms, setForms] = useState<FormRow[]>([emptyForm(fields)]);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  const selectedIds = useMemo(
    () => getSelectedRowIds(selection, rows.map((r) => r.id)),
    [selection, rows]
  );
  const mode = editId != null ? 'edit' : 'create';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint, { params: { limit: 500 } });
      setRows(res.data.data.data || res.data.data);
    } catch {
      enqueueSnackbar('データの取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [endpoint, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditId(null);
    setForms([emptyForm(fields)]);
  };

  const openCreate = () => {
    setEditId(null);
    setForms([emptyForm(fields)]);
    setDrawerOpen(true);
  };

  const openEdit = (row: T) => {
    setEditId(row.id);
    setForms([Object.fromEntries(fields.map((f) => [f.name, String(row[f.name] ?? '')]))]);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    for (let i = 0; i < forms.length; i++) {
      const missing = fields.filter((f) => f.required && !forms[i][f.name]?.trim()).map((f) => f.label);
      if (missing.length) {
        enqueueSnackbar(`${i + 1}行目: ${missing.join('・')}は必須です`, { variant: 'warning' });
        return;
      }
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`${endpoint}/${editId}`, forms[0]);
        enqueueSnackbar('更新しました', { variant: 'success' });
      } else {
        await Promise.all(forms.map((form) => api.post(endpoint, form)));
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
      await Promise.all(selectedIds.map((id) => api.delete(`${endpoint}/${id}`)));
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
      await api.delete(`${endpoint}/${id}`);
      enqueueSnackbar('削除しました', { variant: 'success' });
      setSelection({ type: 'include', ids: new Set() });
      fetchData();
    } catch {
      enqueueSnackbar('削除に失敗しました', { variant: 'error' });
    }
  };

  const gridColumns: GridColDef[] = useMemo(() => {
    if (!canEdit) return columns;
    return [
      ...columns,
      {
        field: 'actions',
        headerName: '',
        width: 88,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" onClick={() => openEdit(params.row as T)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ];
  }, [canEdit, columns]);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title={title}
        subtitle={subtitle}
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

      <Paper sx={tableFlexPaperSx}>
        {loading ? (
          <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={gridColumns}
            checkboxSelection={canEdit}
            rowSelectionModel={selection}
            onRowSelectionModelChange={setSelection}
            pageSizeOptions={[20, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
            disableRowSelectionOnClick
            onRowDoubleClick={(params) => canEdit && openEdit(params.row as T)}
            sx={{ ...dataGridSx }}
          />
        )}
      </Paper>

      <MasterFormDrawer
        open={drawerOpen}
        mode={mode}
        forms={forms}
        fields={fields}
        saving={saving}
        onClose={closeDrawer}
        onSave={handleSave}
        onAddRow={() => setForms((prev) => [...prev, emptyForm(fields)])}
        onRemoveRow={(index) => setForms((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index))}
        onChange={(index, name, value) => {
          setForms((prev) => prev.map((f, i) => (i === index ? { ...f, [name]: value } : f)));
        }}
      />
    </Box>
  );
}

export default MasterCrudPage;
