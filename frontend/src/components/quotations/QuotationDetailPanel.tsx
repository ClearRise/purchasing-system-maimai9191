import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, IconButton, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import QuotationPdfPreviewDialog from 'src/components/quotations/QuotationPdfPreviewDialog';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { QUOTATION_STATUS_LABELS } from 'src/constants/enums';
import { tableScrollPaperSx } from 'src/constants/layout';
import type { IProduct, IQuotation, IQuotationLine } from 'src/types';

type CatalogOption = Pick<IProduct, 'id' | 'name' | 'spec' | 'unit' | 'categoryLabel' | 'productCode'>;

interface QuotationDetailPanelProps {
  quotationId: number;
  canEdit?: boolean;
  onUpdated?: () => void;
  onClose?: () => void;
}

let tempIdSeq = -1;

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
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

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

  const linkedIds = useMemo(() => new Set(lines.map((l) => l.productId)), [lines]);
  const availableOptions = useMemo(
    () => catalogOptions.filter((o) => !linkedIds.has(o.id)),
    [catalogOptions, linkedIds]
  );

  const fetchCatalog = useCallback(async (search: string) => {
    setCatalogLoading(true);
    try {
      const res = await api.get(endpoints.masters.productsCatalog, {
        params: { search: search.trim() || undefined },
      });
      setCatalogOptions(res.data.data || []);
    } catch {
      setCatalogOptions([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const visibleLines = useMemo(() => lines.filter((l) => l.isVisible), [lines]);

  const totals = useMemo(() => {
    let purchase = 0;
    let autoQuote = 0;
    let finalQuote = 0;
    for (const line of visibleLines) {
      purchase += Number(line.purchasePrice) || 0;
      autoQuote += Number(line.autoQuotePrice) || 0;
      finalQuote += Number(line.finalQuotePrice) || 0;
    }
    return { purchase, autoQuote, finalQuote, count: visibleLines.length };
  }, [visibleLines]);

  const targetMonthLabel = useMemo(() => {
    if (!quotation?.periodStart) return '';
    const d = new Date(quotation.periodStart);
    if (Number.isNaN(d.getTime())) return String(quotation.periodStart).slice(0, 7);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [quotation?.periodStart]);

  const updateLine = (lineId: number, field: string, value: number | boolean | string) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)));
  };

  const addProduct = (product: CatalogOption) => {
    if (linkedIds.has(product.id)) return;
    setLines((prev) => [
      ...prev,
      {
        id: tempIdSeq--,
        lineNo: prev.length + 1,
        productId: product.id,
        productName: product.name,
        spec: product.spec || undefined,
        unit: product.unit || 'PC',
        purchasePrice: 0,
        rankMarginRate: 0,
        autoQuotePrice: 0,
        finalQuotePrice: 0,
        isVisible: true,
        note: '',
        isNew: true,
      },
    ]);
  };

  const removeLine = (lineId: number) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId).map((l, i) => ({ ...l, lineNo: i + 1 })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(endpoints.quotations.lines(quotationId), {
        lines: lines.map((l) => {
          const isNew = Boolean(l.isNew || l.id < 0);
          return {
            ...(isNew ? {} : { id: l.id }),
            productId: l.productId,
            // New lines: omit 0 so the server fills auto quote from purchase price.
            ...((!isNew || l.finalQuotePrice > 0) ? { finalQuotePrice: l.finalQuotePrice } : {}),
            isVisible: l.isVisible,
            note: l.note,
          };
        }),
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
            {quotation.store?.name}
            {quotation.store?.rank ? `（${quotation.store.rank}）` : ''}
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

      {editable && (
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Autocomplete
            options={availableOptions}
            loading={catalogLoading}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(x) => x}
            value={null}
            onOpen={() => fetchCatalog('')}
            onInputChange={(_e, value, reason) => {
              if (reason === 'reset') return;
              fetchCatalog(value);
            }}
            onChange={(_e, value) => {
              if (value) addProduct(value);
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[option.unit, option.spec, option.categoryLabel].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="商品を追加"
                placeholder="品名で検索して明細に追加"
              />
            )}
          />
        </Box>
      )}

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
              {editable && <TableCell padding="checkbox" />}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleLines.map((line) => (
              <TableRow key={line.id} sx={line.isNew ? { bgcolor: 'action.hover' } : undefined}>
                <TableCell>{line.lineNo}</TableCell>
                <TableCell>{line.productName}</TableCell>
                <TableCell>{line.spec || '—'}</TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell align="right">
                  {line.isNew ? '—' : `¥${Number(line.purchasePrice).toLocaleString()}`}
                </TableCell>
                <TableCell align="right">{line.isNew ? '—' : `${line.rankMarginRate}%`}</TableCell>
                <TableCell align="right">
                  {line.isNew ? '—' : `¥${Number(line.autoQuotePrice).toLocaleString()}`}
                </TableCell>
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
                {editable && (
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => removeLine(line.id)} aria-label="明細を削除">
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!visibleLines.length && (
              <TableRow>
                <TableCell colSpan={editable ? 10 : 9} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    明細がありません。上の検索から商品を追加してください。
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          flexShrink: 0,
          bgcolor: 'grey.50',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {targetMonthLabel ? `${targetMonthLabel}分` : '対象月'}
          {' · '}
          明細 {totals.count}件
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            仕入合計 ¥{Math.round(totals.purchase).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            自動見積合計 ¥{Math.round(totals.autoQuote).toLocaleString()}
          </Typography>
          <Typography variant="subtitle2" component="div" sx={{ fontWeight: 700 }}>
            正式見積合計 ¥{Math.round(totals.finalQuote).toLocaleString()}
          </Typography>
        </Box>
      </Box>

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
