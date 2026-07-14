import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';

interface QuotationPdfPreviewDialogProps {
  open: boolean;
  quotationId: number | null;
  quotationNo?: string;
  onClose: () => void;
}

const QuotationPdfPreviewDialog: React.FC<QuotationPdfPreviewDialogProps> = ({
  open,
  quotationId,
  quotationNo,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !quotationId) return;

    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setPdfUrl(null);

    api.get(endpoints.quotations.pdf(quotationId, true), { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setPdfUrl(objectUrl);
      })
      .catch(() => setError('PDFの読み込みに失敗しました'))
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, quotationId]);

  const handleDownload = async () => {
    if (!quotationId) return;
    const res = await api.get(endpoints.quotations.pdf(quotationId), { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `見積書_${quotationNo || quotationId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>見積書プレビュー {quotationNo ? `- ${quotationNo}` : ''}</DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: '75vh' }}>
        {loading && (
          <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && error && (
          <Box sx={{ p: 3, color: 'error.main' }}>{error}</Box>
        )}
        {!loading && pdfUrl && (
          <iframe
            title="見積書プレビュー"
            src={pdfUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} disabled={!quotationId}>
          PDFダウンロード
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationPdfPreviewDialog;
