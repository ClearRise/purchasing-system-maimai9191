import { Request, Response } from 'express';
import purchasePriceService from '@/services/purchasePriceService';
import logger from '@/utils/logger';

export const getPriceGrid = async (req: Request, res: Response) => {
  try {
    const { targetYearMonth, storeId, categoryId, forEntry } = req.query;
    if (!targetYearMonth) {
      return res.status(400).json({ success: false, message: '対象年月を指定してください' });
    }
    const data = await purchasePriceService.getGrid(
      String(targetYearMonth),
      storeId ? Number(storeId) : undefined,
      categoryId ? Number(categoryId) : undefined,
      forEntry === 'true'
    );
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getCompareMatrix = async (req: Request, res: Response) => {
  try {
    const { storeId, mode, targetYearMonth, startYearMonth, endYearMonth, supplierId } = req.query;
    if (!storeId || !mode) {
      return res.status(400).json({ success: false, message: '店舗と比較モードを指定してください' });
    }
    if (mode !== 'supplier' && mode !== 'month') {
      return res.status(400).json({ success: false, message: '比較モードが不正です' });
    }
    if (mode === 'supplier' && !targetYearMonth) {
      return res.status(400).json({ success: false, message: '対象年月を指定してください' });
    }
    if (mode === 'month' && (!startYearMonth || !endYearMonth)) {
      return res.status(400).json({ success: false, message: '開始年月と終了年月を指定してください' });
    }
    const data = await purchasePriceService.getCompareMatrix(
      Number(storeId),
      mode as 'supplier' | 'month',
      {
        targetYearMonth: targetYearMonth ? String(targetYearMonth) : undefined,
        startYearMonth: startYearMonth ? String(startYearMonth) : undefined,
        endYearMonth: endYearMonth ? String(endYearMonth) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
      }
    );
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const bulkSavePrices = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { targetYearMonth, items } = req.body;
    await purchasePriceService.bulkSave(targetYearMonth, items, user.id);
    res.json({ success: true, message: '仕入価格を保存しました' });
  } catch (error: any) {
    logger.error(error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getPriceHistory = async (req: Request, res: Response) => {
  try {
    const data = await purchasePriceService.getHistory(req.query);
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
