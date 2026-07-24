import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Button, CircularProgress, Chip, IconButton, Tooltip,
  TextField, MenuItem, Stack, Typography, Divider,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import MasterFormPanel from 'src/components/common/MasterFormPanel';
import QuotationDetailPanel from 'src/components/quotations/QuotationDetailPanel';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { QUOTATION_STATUS_LABELS } from 'src/constants/enums';
import { pageTableRootSx, selectorBarSx } from 'src/constants/layout';
import { usePermissions } from 'src/hooks/usePermissions';
import type { IQuotation, IStore } from 'src/types';

const defaultYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const defaultPeriod = () => {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const start = new Date(next.getFullYear(), next.getMonth(), 1);
  const end = new Date(next.getFullYear(), next.getMonth() + 1, 0);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
};

const emptyCreateForm = () => ({
  storeId: '',
  targetYearMonth: defaultYearMonth(),
  ...defaultPeriod(),
  note: '',
});

const QuotationListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { canManageQuotations } = usePermissions();

  const [rows, setRows] = useState<IQuotation[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [saving, setSaving] = useState(false);
  const preferAutoSelect = useRef(true);

  const storeFilter = searchParams.get('storeId') || '';
  const selectedId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const createOpen = searchParams.get('new') === '1';

  const setSelection = useCallback((next: {
    id?: number | null;
    storeId?: string;
    create?: boolean;
  }) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next.storeId !== undefined) {
        if (next.storeId) params.set('storeId', next.storeId);
        else params.delete('storeId');
      }
      if (next.id !== undefined) {
        if (next.id) params.set('id', String(next.id));
        else params.delete('id');
      }
      if (next.create !== undefined) {
        if (next.create) params.set('new', '1');
        else params.delete('new');
      }
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.quotations.list, {
        params: {
          ...(storeFilter ? { storeId: Number(storeFilter) } : {}),
        },
      });
      setRows(res.data.data.data || []);
    } catch {
      enqueueSnackbar('見積書の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [storeFilter, enqueueSnackbar]);

  useEffect(() => {
    api.get(endpoints.masters.stores)
      .then((res) => setStores(res.data.data.data || res.data.data || []));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!createOpen) return;
    setCreateForm((prev) => ({
      ...emptyCreateForm(),
      storeId: storeFilter || prev.storeId || '',
    }));
  }, [createOpen, storeFilter]);

  useEffect(() => {
    if (loading) return;
    const stillThere = selectedId != null && rows.some((r) => r.id === selectedId);
    if (stillThere) {
      preferAutoSelect.current = true;
      return;
    }
    if (preferAutoSelect.current && rows.length) {
      setSelection({ id: rows[0].id });
      return;
    }
    if (selectedId != null && !stillThere) {
      setSelection({ id: null });
    }
  }, [loading, rows, selectedId, setSelection]);

  const openCreate = () => {
    setSelection({ create: true });
  };

  const closeCreate = () => {
    setSelection({ create: false });
  };

  const handleStoreChange = (value: string) => {
    preferAutoSelect.current = true;
    setSelection({ storeId: value, id: null });
  };

  const handleCloseDetail = () => {
    preferAutoSelect.current = false;
    setSelection({ id: null });
  };

  const handleCreate = async () => {
    if (!createForm.storeId) {
      enqueueSnackbar('得意先を選択してください', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(endpoints.quotations.list, {
        storeId: Number(createForm.storeId),
        targetYearMonth: createForm.targetYearMonth,
        periodStart: createForm.periodStart,
        periodEnd: createForm.periodEnd,
        note: createForm.note,
      });
      const created = res.data.data;
      const lineCount = Array.isArray(created?.lines) ? created.lines.length : 0;
      if (lineCount === 0) {
        enqueueSnackbar(
          '見積書を作成しましたが明細が空です。右側の明細から商品を追加してください。',
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar(`見積書を作成しました（明細 ${lineCount}件）`, { variant: 'success' });
      }
      preferAutoSelect.current = false;
      setSelection({ create: false, id: created.id });
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '作成に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (id: number, quotationNo: string) => {
    if (!confirm(`見積書「${quotationNo}」を削除してよろしいですか？`)) return;
    try {
      await api.delete(endpoints.quotations.delete(id));
      enqueueSnackbar('見積書を削除しました', { variant: 'success' });
      preferAutoSelect.current = true;
      if (selectedId === id) setSelection({ id: null });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchData, selectedId, setSelection]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId]
  );

  const showDetailMobile = Boolean(selectedId) && !createOpen;
  const showCreateMobile = createOpen;

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="見積書一覧"
        subtitle="行をクリックすると右側に明細が表示されます。得意先を切り替えてすぐ確認できます。"
        action={canManageQuotations && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreate}
          >
            新規見積
          </Button>
        )}
      />

      <Paper sx={{ ...selectorBarSx, mb: 2 }}>
        <TextField
          select
          size="small"
          label="得意先"
          value={storeFilter}
          onChange={(e) => handleStoreChange(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 } }}
        >
          <MenuItem value="">すべての得意先</MenuItem>
          {stores.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>
              {s.name}{s.rank ? `（${s.rank}）` : ''}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {loading ? '読込中…' : `${rows.length}件`}
          {selectedRow ? ` ／ 選択中: ${selectedRow.quotationNo}` : ''}
          {createOpen ? ' ／ 新規作成' : ''}
        </Typography>
      </Paper>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Paper
          sx={{
            width: { xs: '100%', md: 340 },
            flexShrink: 0,
            display: {
              xs: (showDetailMobile || showCreateMobile) ? 'none' : 'flex',
              md: 'flex',
            },
            flexDirection: 'column',
            minHeight: { xs: 280, md: 0 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2">見積一覧</Typography>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                見積書がありません
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {rows.map((row, index) => {
                const active = row.id === selectedId;
                return (
                  <Box key={row.id}>
                    {index > 0 && <Divider />}
                    <Box
                      onClick={() => {
                        preferAutoSelect.current = false;
                        setSelection({ id: row.id });
                      }}
                      sx={{
                        px: 1.5,
                        py: 1.25,
                        cursor: 'pointer',
                        bgcolor: active ? 'action.selected' : 'transparent',
                        borderLeft: 3,
                        borderColor: active ? 'primary.main' : 'transparent',
                        '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 0 }} noWrap>
                          {row.quotationNo}
                        </Typography>
                        <Chip
                          size="small"
                          label={QUOTATION_STATUS_LABELS[row.status] || row.status}
                          color={row.status === 'sent' ? 'success' : 'default'}
                          sx={{ height: 22 }}
                        />
                        {canManageQuotations && (
                          <Tooltip title={row.status === 'sent' ? '送信済みは削除不可' : '削除'}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={row.status === 'sent'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(row.id, row.quotationNo);
                                }}
                              >
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                        {row.store?.name || '—'}
                        {row.store?.rank ? `（${row.store.rank}）` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.periodStart} 〜 {row.periodEnd}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>

        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: {
              xs: showDetailMobile ? 'flex' : 'none',
              md: 'flex',
            },
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {selectedId ? (
            <QuotationDetailPanel
              key={selectedId}
              quotationId={selectedId}
              canEdit={canManageQuotations}
              onUpdated={fetchData}
              onClose={handleCloseDetail}
            />
          ) : (
            <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Typography color="text.secondary">
                左側の見積書を選択すると、ここに明細が表示されます
              </Typography>
            </Box>
          )}
        </Paper>

        <MasterFormPanel
          open={createOpen}
          mode="create"
          form={createForm}
          saving={saving}
          createTitle="新規見積書"
          createSaveLabel="作成"
          onClose={closeCreate}
          onSave={handleCreate}
          onChange={(name, value) => setCreateForm((prev) => ({ ...prev, [name]: value }))}
          renderFields={(f) => (
            <Stack spacing={1.5}>
              <TextField
                select
                label="得意先"
                value={f.storeId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, storeId: e.target.value }))}
                required
                fullWidth
                size="small"
              >
                {stores.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.name}{s.rank ? `（${s.rank}）` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="仕入価格参照月"
                type="month"
                value={f.targetYearMonth}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, targetYearMonth: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label="期間開始"
                type="date"
                value={f.periodStart}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, periodStart: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label="期間終了"
                type="date"
                value={f.periodEnd}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, periodEnd: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
              />
              <TextField
                label="備考"
                value={f.note}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, note: e.target.value }))}
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

export default QuotationListPage;
