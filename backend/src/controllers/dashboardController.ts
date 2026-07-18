import { Request, Response } from 'express';
import dashboardService from '@/services/dashboardService';
import settingsService from '@/services/settingsService';
import lookupOptionService from '@/services/lookupOptionService';

export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const [summary, topProducts, riskCustomers, priceAlerts] = await Promise.all([
      dashboardService.getSummary(),
      dashboardService.getTopProducts(),
      dashboardService.getRiskCustomers(),
      dashboardService.getPriceAlerts(),
    ]);
    res.json({
      success: true,
      data: { summary, topProducts, riskCustomers, priceAlerts },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductProfitTrends = async (req: Request, res: Response) => {
  try {
    const startYearMonth = typeof req.query.startYearMonth === 'string' ? req.query.startYearMonth : undefined;
    const endYearMonth = typeof req.query.endYearMonth === 'string' ? req.query.endYearMonth : undefined;
    const data = await dashboardService.getProductProfitTrends(startYearMonth, endYearMonth);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRankMargins = async (_req: Request, res: Response) => {
  try {
    const data = await settingsService.getRankMargins();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRankMargin = async (req: Request, res: Response) => {
  try {
    const data = await settingsService.updateRankMargin(String(req.params.rank), req.body);
    res.json({ success: true, message: '粗利率を更新しました', data });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getSystemSettings = async (_req: Request, res: Response) => {
  try {
    const data = await settingsService.getSystemSettings();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const data = await settingsService.updateSystemSettings(req.body);
    res.json({ success: true, message: '設定を更新しました', data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLookupOptions = async (req: Request, res: Response) => {
  try {
    const kind = String(req.params.kind || '');
    const data = await lookupOptionService.listByKind(kind, false);
    if (kind === 'spec') {
      res.json({
        success: true,
        data: data.map((r) => ({
          value: r.value,
          unit: (r as any).relatedUnit?.value || '',
        })),
      });
      return;
    }
    res.json({ success: true, data: data.map((r) => r.value) });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const replaceLookupOptions = async (req: Request, res: Response) => {
  try {
    const kind = String(req.params.kind || '');
    if (kind === 'unit') {
      const values = Array.isArray(req.body?.values) ? req.body.values : [];
      const rows = await lookupOptionService.replaceUnits(values);
      res.json({ success: true, message: '単位マスタを更新しました', data: rows.map((r) => r.value) });
      return;
    }
    if (kind === 'spec') {
      const items = Array.isArray(req.body?.items)
        ? req.body.items
        : [];
      const rows = await lookupOptionService.replaceSpecs(items);
      res.json({
        success: true,
        message: '規格マスタを更新しました',
        data: rows.map((r) => ({
          value: r.value,
          unit: (r as any).relatedUnit?.value || '',
        })),
      });
      return;
    }
    res.status(400).json({ success: false, message: '不正な区分です' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
