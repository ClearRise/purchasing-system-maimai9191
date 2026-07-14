import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Chip, Typography, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import QuotationPdfPreviewDialog from 'src/components/quotations/QuotationPdfPreviewDialog';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { Path, QUOTATION_STATUS_LABELS } from 'src/constants/enums';
import { pageTableRootSx, tableScrollPaperSx } from 'src/constants/layout';
import type { IQuotation, IQuotationLine } from 'src/types';

const QuotationEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [quotation, setQuotation] = useState<IQuotation | null>(null);
  const [lines, setLines] = useState<IQuotationLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.quotations.detail(Number(id)));
      setQuotation(res.data.data);
      setLines(res.data.data.lines || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateLine = (lineId: number, field: string, value: number | boolean | string) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(endpoints.quotations.lines(Number(id)), {
        lines: lines.map((l) => ({
          id: l.id,
          finalQuotePrice: l.finalQuotePrice,
          isVisible: l.isVisible,
          note: l.note,
        })),
      });
      enqueueSnackbar('見積明細を保存しました', { variant: 'success' });
      fetchData();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    try {
      await api.patch(endpoints.quotations.status(Number(id)), { status: 'sent' });
      enqueueSnackbar('送信済みに更新しました', { variant: 'success' });
      fetchData();
    } catch {
      enqueueSnackbar('更新に失敗しました', { variant: 'error' });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(endpoints.quotations.pdf(Number(id)), { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `見積書_${quotation?.quotationNo || id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('PDFの出力に失敗しました', { variant: 'error' });
    }
  };

  if (loading) {
    return <Box className="flex h-64 items-center justify-center"><CircularProgress /></Box>;
  }

  return (
    <Box sx={pageTableRootSx}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, flexShrink: 0 }}>
        <IconButton
          onClick={() => navigate(Path.Quotations)}
          aria-label="見積書一覧に戻る"
          sx={{ mt: 0.25 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PageHeader
            title={`見積書 ${quotation?.quotationNo}`}
            subtitle={`${quotation?.customer?.name} / ${quotation?.store?.name}`}
            action={
              <Box className="flex flex-wrap gap-2">
                <Chip label={QUOTATION_STATUS_LABELS[quotation?.status || ''] || quotation?.status} />
                <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setPdfPreviewOpen(true)}>
                  PDFプレビュー
                </Button>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>
                  PDF出力
                </Button>
                {quotation?.status !== 'sent' && (
                  <>
                    <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>保存</Button>
                    <Button variant="contained" startIcon={<SendIcon />} onClick={handleSend}>送信済みにする</Button>
                  </>
                )}
              </Box>
            }
          />
        </Box>
      </Box>

      {quotation?.note && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexShrink: 0 }}>
          備考: {quotation.note}
        </Typography>
      )}

      <Paper sx={tableScrollPaperSx}>
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
            {lines.filter((l) => l.isVisible).map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.lineNo}</TableCell>
                <TableCell>{line.productName}</TableCell>
                <TableCell>{line.spec}</TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell align="right">¥{Number(line.purchasePrice).toLocaleString()}</TableCell>
                <TableCell align="right">{line.rankMarginRate}%</TableCell>
                <TableCell align="right">¥{Number(line.autoQuotePrice).toLocaleString()}</TableCell>
                <TableCell align="right">
                  {quotation?.status === 'sent' ? (
                    `¥${Number(line.finalQuotePrice).toLocaleString()}`
                  ) : (
                    <TextField
                      type="number" size="small" value={line.finalQuotePrice}
                      onChange={(e) => updateLine(line.id, 'finalQuotePrice', Number(e.target.value))}
                      sx={{ width: 100 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {quotation?.status === 'sent' ? (
                    line.note || '-'
                  ) : (
                    <TextField
                      size="small"
                      value={line.note || ''}
                      onChange={(e) => updateLine(line.id, 'note', e.target.value)}
                      sx={{ minWidth: 120 }}
                      placeholder="-"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!lines.length && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" className="py-8">明細がありません。仕入価格を先に入力してください。</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <QuotationPdfPreviewDialog
        open={pdfPreviewOpen}
        quotationId={Number(id)}
        quotationNo={quotation?.quotationNo}
        onClose={() => setPdfPreviewOpen(false)}
      />
    </Box>
  );
};

export default QuotationEditPage;
