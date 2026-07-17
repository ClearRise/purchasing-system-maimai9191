import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, IconButton, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useSnackbar } from 'notistack';
import QuotationPdfPreviewDialog from 'src/components/quotations/QuotationPdfPreviewDialog';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { QUOTATION_STATUS_LABELS } from 'src/constants/enums';
import { tableScrollPaperSx } from 'src/constants/layout';
import type { IQuotation, IQuotationLine } from 'src/types';

interface QuotationDetailPanelProps {
  quotationId: number;
  canEdit?: boolean;
  onUpdated?: () => void;
  onClose?: () => void;
}

/** Inline quotation detail / edit panel for the list page split view. */
const QuotationDetailPanel: React.FC<QuotationDetailPanelProps> = ({
  quotationId,
  canEdit = true,
  onUpdated,
  onClose,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [quotation, setQuotation] = useState<IQuotation | null>(null);
  const [lines, setLines] = useState<IQuotationLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.quotations.detail(quotationId));
      setQuotation(res.data.data);
      setLines(res.data.data.lines || []);
    } catch {
      enqueueSnackbar('見積書の取得に失敗しました', { variant: 'error' });
      setQuotation(null);
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [quotationId, enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLine = (lineId: number, field: string, value: number | boolean | string) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(endpoints.quotations.lines(quotationId), {
        lines: lines.map((l) => ({
          id: l.id,
          finalQuotePrice: l.finalQuotePrice,
          isVisible: l.isVisible,
          note: l.note,
        })),
      });
      enqueueSnackbar('見積明細を保存しました', { variant: 'success' });
      await fetchData();
      onUpdated?.();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    try {
      await api.patch(endpoints.quotations.status(quotationId), { status: 'sent' });
      enqueueSnackbar('送信済みに更新しました', { variant: 'success' });
      await fetchData();
      onUpdated?.();
    } catch {
      enqueueSnackbar('更新に失敗しました', { variant: 'error' });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(endpoints.quotations.pdf(quotationId), { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `見積書_${quotation?.quotationNo || quotationId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('PDFの出力に失敗しました', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100%', minHeight: 240, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!quotation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">見積書を表示できません</Typography>
      </Box>
    );
  }

  const isSent = quotation.status === 'sent';
  const editable = canEdit && !isSent;
  const visibleLines = lines.filter((l) => l.isVisible);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
            <Typography variant="h4" component="h2">
              {quotation.quotationNo}
            </Typography>
            <Chip
              size="small"
              label={QUOTATION_STATUS_LABELS[quotation.status] || quotation.status}
              color={isSent ? 'success' : 'default'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {quotation.customer?.name}
            {quotation.customer?.rank ? `（${quotation.customer.rank}）` : ''}
            {' / '}
            {quotation.store?.name}
            {' / '}
            {quotation.periodStart} 〜 {quotation.periodEnd}
          </Typography>
          {quotation.note && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              備考: {quotation.note}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => setPdfPreviewOpen(true)}>
            プレビュー
          </Button>
          <Button size="small" variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />} onClick={handleDownloadPdf}>
            PDF
          </Button>
          {editable && (
            <>
              <Button size="small" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={saving}>
                保存
              </Button>
              <Button size="small" variant="contained" startIcon={<SendOutlinedIcon />} onClick={handleSend}>
                送信済み
              </Button>
            </>
          )}
          {onClose && (
            <IconButton size="small" onClick={onClose} aria-label="閉じる" sx={{ display: { md: 'none' } }}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Paper elevation={0} sx={{ ...tableScrollPaperSx, borderRadius: 0, flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>品名</TableCell>
              <TableCell>規格</TableCell>
              <TableCell>単位</TableCell>
              <TableCell align="right">仕入単価</TableCell>
              <TableCell align="right">粗利率%</TableCell>
              <TableCell align="right">自動見積</TableCell>
              <TableCell align="right">正式見積</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleLines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.lineNo}</TableCell>
                <TableCell>{line.productName}</TableCell>
                <TableCell>{line.spec || '—'}</TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell align="right">¥{Number(line.purchasePrice).toLocaleString()}</TableCell>
                <TableCell align="right">{line.rankMarginRate}%</TableCell>
                <TableCell align="right">¥{Number(line.autoQuotePrice).toLocaleString()}</TableCell>
                <TableCell align="right">
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={line.finalQuotePrice}
                      onChange={(e) => updateLine(line.id, 'finalQuotePrice', Number(e.target.value))}
                      sx={{ width: 100 }}
                    />
                  ) : (
                    `¥${Number(line.finalQuotePrice).toLocaleString()}`
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <TextField
                      size="small"
                      value={line.note || ''}
                      onChange={(e) => updateLine(line.id, 'note', e.target.value)}
                      sx={{ minWidth: 100 }}
                      placeholder="—"
                    />
                  ) : (
                    line.note || '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!visibleLines.length && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    明細がありません。仕入価格を先に入力してください。
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <QuotationPdfPreviewDialog
        open={pdfPreviewOpen}
        quotationId={quotationId}
        quotationNo={quotation.quotationNo}
        onClose={() => setPdfPreviewOpen(false)}
      />
    </Box>
  );
};

export default QuotationDetailPanel;
