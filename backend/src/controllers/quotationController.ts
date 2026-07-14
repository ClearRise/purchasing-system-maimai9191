import { Request, Response } from 'express';
import quotationService from '@/services/quotationService';
import logger from '@/utils/logger';

export const listQuotations = async (req: Request, res: Response) => {
  try {
    const data = await quotationService.list(req.query);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuotation = async (req: Request, res: Response) => {
  try {
    const data = await quotationService.getById(Number(req.params.id));
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await quotationService.create(req.body, user.id);
    res.status(201).json({ success: true, message: '見積書を作成しました', data });
  } catch (error: any) {
    logger.error(error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateQuotationLines = async (req: Request, res: Response) => {
  try {
    const data = await quotationService.updateLines(Number(req.params.id), req.body.lines);
    res.json({ success: true, message: '見積明細を更新しました', data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateQuotationStatus = async (req: Request, res: Response) => {
  try {
    const data = await quotationService.updateStatus(Number(req.params.id), req.body.status);
    res.json({ success: true, message: 'ステータスを更新しました', data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    await quotationService.delete(Number(req.params.id));
    res.json({ success: true, message: '見積書を削除しました' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const simulateQuotation = async (req: Request, res: Response) => {
  try {
    const { customerId, storeId, targetYearMonth, adjustmentPct } = req.body;
    const data = await quotationService.simulate(customerId, storeId, targetYearMonth, adjustmentPct || 0);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const exportQuotationPdf = async (req: Request, res: Response) => {
  try {
    const quotationPdfService = (await import('@/services/quotationPdfService')).default;
    const { buffer, filename } = await quotationPdfService.generateBuffer(Number(req.params.id));
    const disposition = req.query.preview === '1' ? 'inline' : 'attachment';
    const encoded = encodeURIComponent(filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${encoded}"; filename*=UTF-8''${encoded}`);
    res.send(buffer);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
