import { Request, Response } from 'express';
import dashboardService from '@/services/dashboardService';
import settingsService from '@/services/settingsService';

export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const [summary, topProducts, riskCustomers, priceAlerts] = await Promise.all([
      dashboardService.getSummary(),
      dashboardService.getTopProducts(),
      dashboardService.getRiskCustomers(),
      dashboardService.getPriceAlerts(),
    ]);
    res.json({ success: true, data: { summary, topProducts, riskCustomers, priceAlerts } });
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
