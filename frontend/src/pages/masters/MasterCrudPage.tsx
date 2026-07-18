import { useCallback, useEffect, useMemo, useState } from 'react';
import { Paper, Button, IconButton, Box, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormPanel, { type MasterField } from 'src/components/common/MasterFormPanel';
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormRow>(() => emptyForm(fields));
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
      const res = await api.get(endpoint);
      setRows(res.data.data.data || res.data.data);
    } catch {
      enqueueSnackbar('データの取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [endpoint, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(emptyForm(fields));
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm(fields));
    setPanelOpen(true);
  };

  const openEdit = (row: T) => {
    setEditId(row.id);
    setForm(Object.fromEntries(fields.map((f) => [f.name, String(row[f.name] ?? '')])));
    setPanelOpen(true);
  };

  const handleSave = async () => {
    const missing = fields.filter((f) => f.required && !form[f.name]?.trim()).map((f) => f.label);
    if (missing.length) {
      enqueueSnackbar(`${missing.join('・')}は必須です`, { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`${endpoint}/${editId}`, form);
        enqueueSnackbar('更新しました', { variant: 'success' });
        closePanel();
      } else {
        await api.post(endpoint, form);
        enqueueSnackbar('登録しました', { variant: 'success' });
        setForm(emptyForm(fields));
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
      if (editId === id) closePanel();
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
  }, [canEdit, columns, editId]);

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

        <MasterFormPanel
          open={panelOpen}
          mode={mode}
          form={form}
          fields={fields}
          saving={saving}
          onClose={closePanel}
          onSave={handleSave}
          onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        />
      </Box>
    </Box>
  );
}

export default MasterCrudPage;
