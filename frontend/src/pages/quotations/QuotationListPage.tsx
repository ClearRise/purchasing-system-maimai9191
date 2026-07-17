import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Button, CircularProgress, Chip, IconButton, Tooltip,
  TextField, MenuItem, Typography, Divider,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import QuotationDetailPanel from 'src/components/quotations/QuotationDetailPanel';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { Path, QUOTATION_STATUS_LABELS } from 'src/constants/enums';
import { pageTableRootSx, selectorBarSx } from 'src/constants/layout';
import { usePermissions } from 'src/hooks/usePermissions';
import type { ICustomer, IQuotation } from 'src/types';

const QuotationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { canManageQuotations } = usePermissions();

  const [rows, setRows] = useState<IQuotation[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const preferAutoSelect = useRef(true);

  const customerFilter = searchParams.get('customerId') || '';
  const selectedId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const setSelection = useCallback((next: { id?: number | null; customerId?: string }) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next.customerId !== undefined) {
        if (next.customerId) params.set('customerId', next.customerId);
        else params.delete('customerId');
      }
      if (next.id !== undefined) {
        if (next.id) params.set('id', String(next.id));
        else params.delete('id');
      }
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.quotations.list, {
        params: {
          limit: 100,
          ...(customerFilter ? { customerId: Number(customerFilter) } : {}),
        },
      });
      setRows(res.data.data.data || []);
    } catch {
      enqueueSnackbar('見積書の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [customerFilter, enqueueSnackbar]);

  useEffect(() => {
    api.get(endpoints.masters.customers, { params: { limit: 200 } })
      .then((res) => setCustomers(res.data.data.data || []));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-select first quotation when filter changes or deep-link id is missing
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

  const handleCustomerChange = (value: string) => {
    preferAutoSelect.current = true;
    setSelection({ customerId: value, id: null });
  };

  const handleCloseDetail = () => {
    preferAutoSelect.current = false;
    setSelection({ id: null });
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

  const showDetailMobile = Boolean(selectedId);

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
            onClick={() => navigate(Path.QuotationNew)}
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
          value={customerFilter}
          onChange={(e) => handleCustomerChange(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 } }}
        >
          <MenuItem value="">すべての得意先</MenuItem>
          {customers.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}（{c.rank}）
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {loading ? '読込中…' : `${rows.length}件`}
          {selectedRow ? ` ／ 選択中: ${selectedRow.quotationNo}` : ''}
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
        {/* List pane */}
        <Paper
          sx={{
            width: { xs: '100%', md: 340 },
            flexShrink: 0,
            display: { xs: showDetailMobile ? 'none' : 'flex', md: 'flex' },
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
                      onClick={() => setSelection({ id: row.id })}
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
                        {row.customer?.name || '—'} / {row.store?.name || '—'}
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

        {/* Detail pane */}
        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: { xs: showDetailMobile ? 'flex' : 'none', md: 'flex' },
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
      </Box>
    </Box>
  );
};

export default QuotationListPage;
