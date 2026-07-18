import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, IconButton, TextField, MenuItem, Typography, Chip,
  CircularProgress, FormControlLabel, Switch, Stack,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import MasterFormPanel from 'src/components/common/MasterFormPanel';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { useAuth } from 'src/hooks/usePermissions';
import { ROLE_LABELS, UserRole } from 'src/constants/enums';
import { dataGridSx } from 'src/theme/theme';
import { tableFlexPaperSx } from 'src/constants/layout';

type SystemUser = {
  id: number;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string | null;
};

type UserForm = {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: string;
};

const EMPTY_FORM: UserForm = {
  email: '',
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  role: UserRole.Sales,
  isActive: 'true',
};

const ROLE_OPTIONS = [
  { value: UserRole.Admin, label: ROLE_LABELS[UserRole.Admin] },
  { value: UserRole.Purchase, label: ROLE_LABELS[UserRole.Purchase] },
  { value: UserRole.Sales, label: ROLE_LABELS[UserRole.Sales] },
];

const SystemUsersPanel: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const mode = editId != null ? 'edit' : 'create';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.users.list, {
        params: { page: 1, sortBy: 'id', sortOrder: 'ASC' },
      });
      setRows(res.data.data || []);
    } catch {
      enqueueSnackbar('ユーザー一覧の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      [u.username, u.email, u.firstName, u.lastName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setPanelOpen(true);
  };

  const openEdit = (row: SystemUser) => {
    setEditId(row.id);
    setForm({
      email: row.email,
      username: row.username,
      password: '',
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      role: row.role,
      isActive: row.isActive ? 'true' : 'false',
    });
    setPanelOpen(true);
  };

  const handleSave = async () => {
    const missing: string[] = [];
    if (!form.email.trim()) missing.push('メール');
    if (!form.username.trim()) missing.push('ユーザー名');
    if (!form.role) missing.push('ロール');
    if (mode === 'create' && !form.password.trim()) missing.push('パスワード');
    if (missing.length) {
      enqueueSnackbar(`${missing.join('・')}は必須です`, { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        isActive: form.isActive === 'true',
      };
      if (form.password.trim()) payload.password = form.password;

      if (editId) {
        await api.put(endpoints.users.detail(editId), payload);
        enqueueSnackbar('ユーザーを更新しました', { variant: 'success' });
        closePanel();
      } else {
        await api.post(endpoints.users.list, payload);
        enqueueSnackbar('ユーザーを登録しました', { variant: 'success' });
        setForm({ ...EMPTY_FORM });
      }
      fetchUsers();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: SystemUser) => {
    if (currentUser?.id === row.id) {
      enqueueSnackbar('自分自身のアカウントは削除できません', { variant: 'warning' });
      return;
    }
    const nameLabel = [row.lastName, row.firstName].filter(Boolean).join(' ');
    const label = nameLabel ? `${nameLabel}（${row.username}）` : row.username;
    if (!confirm(`${label} を削除してよろしいですか？`)) return;
    try {
      await api.delete(endpoints.users.detail(row.id));
      enqueueSnackbar('ユーザーを削除しました', { variant: 'success' });
      if (editId === row.id) closePanel();
      fetchUsers();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  };

  const columns = useMemo<GridColDef<SystemUser>[]>(() => [
    { field: 'username', headerName: 'ユーザー名', width: 120 },
    { field: 'email', headerName: 'メール', flex: 1, minWidth: 180 },
    {
      field: 'lastName',
      headerName: '姓',
      width: 100,
      valueGetter: (_v, row) => row.lastName || '—',
    },
    {
      field: 'firstName',
      headerName: '名',
      width: 100,
      valueGetter: (_v, row) => row.firstName || '—',
    },
    {
      field: 'role',
      headerName: 'ロール',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={ROLE_LABELS[value as UserRole] || value}
          color={value === UserRole.Admin ? 'primary' : 'default'}
          variant={value === UserRole.Admin ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: '状態',
      width: 90,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value ? '有効' : '無効'}
          color={value ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'lastLogin',
      headerName: '最終ログイン',
      width: 160,
      valueFormatter: (value: string | null | undefined) =>
        value ? new Date(value).toLocaleString('ja-JP') : '—',
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box>
          <IconButton size="small" onClick={() => openEdit(row)} title="編集">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
            disabled={currentUser?.id === row.id}
            title="削除"
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ], [currentUser?.id, editId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="名前・メールで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
          ユーザー追加
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          height: 480,
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
              <CircularProgress size={28} />
            </Box>
          ) : (
            <DataGrid
              rows={filteredRows}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              sx={{ ...dataGridSx }}
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
                size="small"
                label="姓"
                value={f.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="名"
                value={f.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="ユーザー名"
                required
                value={f.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="メール"
                type="email"
                required
                value={f.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label={mode === 'edit' ? 'パスワード（変更時のみ）' : 'パスワード'}
                type="password"
                required={mode === 'create'}
                value={f.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                fullWidth
                helperText={mode === 'create' ? '英大文字・小文字・数字を含む8文字以上' : '空欄のままなら変更しません'}
              />
              <TextField
                select
                size="small"
                label="ロール"
                required
                value={f.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                fullWidth
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={f.isActive === 'true'}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked ? 'true' : 'false' }))
                    }
                    disabled={currentUser?.id === editId}
                  />
                }
                label={f.isActive === 'true' ? '有効' : '無効'}
              />
              {currentUser?.id === editId && (
                <Typography variant="caption" color="text.secondary">
                  自分自身のアカウントは無効化できません
                </Typography>
              )}
            </Stack>
          )}
        />
      </Box>
    </Box>
  );
};

export default SystemUsersPanel;
