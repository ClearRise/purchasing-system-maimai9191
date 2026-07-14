import { useCallback, useEffect, useState } from 'react';
import {
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Box, CircularProgress, Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import { dataGridSx } from 'src/theme/theme';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';

interface MasterCrudPageProps {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: GridColDef[];
  fields: { name: string; label: string; required?: boolean }[];
  canEdit?: boolean;
}

function MasterCrudPage<T extends { id: number; [key: string]: unknown }>({
  title, subtitle, endpoint, columns, fields, canEdit = true,
}: MasterCrudPageProps & { endpoint: string }) {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint, { params: { limit: 100 } });
      setRows(res.data.data.data || res.data.data);
    } catch {
      enqueueSnackbar('データの取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [endpoint, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, ''])));
    setOpen(true);
  };

  const openEdit = (row: T) => {
    setEditId(row.id);
    setForm(Object.fromEntries(fields.map((f) => [f.name, String(row[f.name] ?? '')])));
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`${endpoint}/${editId}`, form);
        enqueueSnackbar('更新しました', { variant: 'success' });
      } else {
        await api.post(endpoint, form);
        enqueueSnackbar('登録しました', { variant: 'success' });
      }
      setOpen(false);
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除してよろしいですか？')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      enqueueSnackbar('削除しました', { variant: 'success' });
      fetchData();
    } catch {
      enqueueSnackbar('削除に失敗しました', { variant: 'error' });
    }
  };

  const actionColumns: GridColDef[] = canEdit ? [{
    field: 'actions',
    headerName: '',
    width: 88,
    sortable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 0.25 }}>
        <Tooltip title="編集">
          <IconButton size="small" onClick={() => openEdit(params.row as T)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="削除">
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  }] : [];

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={canEdit && (
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
            columns={[...columns, ...actionColumns]}
            pageSizeOptions={[20, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
            disableRowSelectionOnClick
            sx={{ ...dataGridSx }}
          />
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? '編集' : '新規登録'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {fields.map((f) => (
              <TextField
                key={f.name}
                label={f.label}
                value={form[f.name] || ''}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                required={f.required}
                fullWidth
                multiline={f.name === 'note'}
                rows={f.name === 'note' ? 2 : undefined}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit">
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleSave}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MasterCrudPage;
