import { Op } from 'sequelize';
import {
  Quotation,
  QuotationLine,
  Customer,
  Product,
  PurchasePriceLog,
  RankMarginSetting,
} from '@/models';

class DashboardService {
  async getSummary() {
    const [quotationDraft, quotationSent, productCount, customerCount] = await Promise.all([
      Quotation.count({ where: { status: 'draft' } }),
      Quotation.count({ where: { status: 'sent' } }),
      Product.count({ where: { isActive: true } }),
      Customer.count({ where: { isActive: true } }),
    ]);

    return { quotationDraft, quotationSent, productCount, customerCount };
  }

  async getTopProducts(limit = 10) {
    const lines = await QuotationLine.findAll({
      where: { isVisible: true },
      limit: 200,
      order: [['createdAt', 'DESC']],
    });

    const marginMap = new Map<number, { name: string; margins: number[] }>();
    lines.forEach((line) => {
      const purchase = Number(line.purchasePrice);
      const final = Number(line.finalQuotePrice);
      if (purchase <= 0) return;
      const margin = ((final - purchase) / purchase) * 100;
      const existing = marginMap.get(line.productId) || { name: line.productName, margins: [] };
      existing.margins.push(margin);
      marginMap.set(line.productId, existing);
    });

    return Array.from(marginMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        avgMarginRate: Math.round((data.margins.reduce((a, b) => a + b, 0) / data.margins.length) * 100) / 100,
      }))
      .sort((a, b) => b.avgMarginRate - a.avgMarginRate)
      .slice(0, limit);
  }

  async getRiskCustomers() {
    const customers = await Customer.findAll({ where: { isActive: true } });
    const margins = await RankMarginSetting.findAll();
    const marginMap = Object.fromEntries(margins.map((m) => [m.rank, Number(m.minMarginRate)]));

    const risks = [];
    for (const customer of customers) {
      const latest = await Quotation.findOne({
        where: { customerId: customer.id },
        order: [['createdAt', 'DESC']],
      });
      if (!latest) continue;

      const lines = await QuotationLine.findAll({
        where: { quotationId: latest.id, isVisible: true },
      });
      if (!lines.length) continue;

      const avgMargin =
        lines.reduce((acc, line) => {
          const p = Number(line.purchasePrice);
          const f = Number(line.finalQuotePrice);
          return acc + (p > 0 ? ((f - p) / p) * 100 : 0);
        }, 0) / lines.length;

      const minRequired = marginMap[customer.rank] || 15;
      if (avgMargin < minRequired) {
        risks.push({
          customerId: customer.id,
          customerName: customer.name,
          rank: customer.rank,
          avgMarginRate: Math.round(avgMargin * 100) / 100,
          minRequired,
        });
      }
    }
    return risks;
  }

  async getPriceAlerts(thresholdPct = 10) {
    const logs = await PurchasePriceLog.findAll({
      where: {
        changeType: 'update',
        priceBefore: { [Op.ne]: null as unknown as number },
      },
      order: [['changedAt', 'DESC']],
      limit: 100,
      include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
    });

    return logs
      .map((log) => {
        const before = Number(log.priceBefore);
        const after = Number(log.priceAfter);
        if (!before || before <= 0) return null;
        const changePct = ((after - before) / before) * 100;
        if (Math.abs(changePct) < thresholdPct) return null;
        return {
          productName: (log as any).product?.name,
          targetYearMonth: log.targetYearMonth,
          priceBefore: before,
          priceAfter: after,
          changePct: Math.round(changePct * 100) / 100,
          changedAt: log.changedAt,
        };
      })
      .filter(Boolean)
      .slice(0, 20);
  }
}

export default new DashboardService();
