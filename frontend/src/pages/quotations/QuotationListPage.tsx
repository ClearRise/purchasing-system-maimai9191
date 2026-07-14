import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Button, CircularProgress, Chip, IconButton, Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { dataGridSx } from 'src/theme/theme';
import { pageTableRootSx, tableFlexPaperSx } from 'src/constants/layout';
import { QUOTATION_STATUS_LABELS } from 'src/constants/enums';
import { usePermissions } from 'src/hooks/usePermissions';

const QuotationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { canManageQuotations } = usePermissions();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.quotations.list, { params: { limit: 50 } });
      setRows(res.data.data.data);
    } catch {
      enqueueSnackbar('見積書の取得に失敗しました', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = useCallback(async (id: number, quotationNo: string) => {
    if (!confirm(`見積書「${quotationNo}」を削除してよろしいですか？`)) return;
    try {
      await api.delete(endpoints.quotations.delete(id));
      enqueueSnackbar('見積書を削除しました', { variant: 'success' });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '削除に失敗しました', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchData]);

  const columns: GridColDef[] = useMemo(() => [
    { field: 'quotationNo', headerName: '見積番号', width: 160 },
    { field: 'customerName', headerName: '得意先', flex: 1, minWidth: 140, valueGetter: (_v, row) => row.customer?.name },
    { field: 'storeName', headerName: '店舗', width: 130, valueGetter: (_v, row) => row.store?.name },
    { field: 'periodStart', headerName: '期間開始', width: 110 },
    { field: 'periodEnd', headerName: '期間終了', width: 110 },
    { field: 'note', headerName: '備考', flex: 1, minWidth: 120 },
    {
      field: 'status',
      headerName: 'ステータス',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={QUOTATION_STATUS_LABELS[params.value] || params.value}
          size="small"
          color={params.value === 'sent' ? 'success' : 'default'}
        />
      ),
    },
    ...(canManageQuotations ? [{
      field: 'actions',
      headerName: '',
      width: 52,
      sortable: false,
      renderCell: (params: { row: { id: number; quotationNo: string; status: string } }) => {
        const isSent = params.row.status === 'sent';
        return (
          <Box sx={{ display: 'flex' }} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={isSent ? '送信済みは削除不可' : '削除'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isSent}
                  onClick={() => handleDelete(params.row.id, params.row.quotationNo)}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    } as GridColDef] : []),
  ], [canManageQuotations, handleDelete]);

  return (
    <Box sx={pageTableRootSx}>
      <PageHeader
        title="見積書一覧"
        subtitle="作成済み見積書の管理"
        action={canManageQuotations && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/quotations/new')}>
            新規見積
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
            initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
            onRowClick={(params) => navigate(`/quotations/${params.id}`)}
            disableRowSelectionOnClick
            sx={{ ...dataGridSx, cursor: 'pointer' }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default QuotationListPage;
