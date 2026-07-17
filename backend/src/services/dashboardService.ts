import { Op } from 'sequelize';
import {
  Quotation,
  QuotationLine,
  Customer,
  Product,
  PurchasePrice,
  Supplier,
  RankMarginSetting,
} from '@/models';
import settingsService from '@/services/settingsService';

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

  /**
   * 仕入単価急騰: same product+supplier, compare consecutive months.
   * Alert only when price rose by >= price_increase_alert_pct (system setting).
   */
  async getPriceAlerts(limit = 20) {
    const settings = await settingsService.getSystemSettings();
    const thresholdPct = Number(settings.price_increase_alert_pct);
    const threshold = Number.isFinite(thresholdPct) && thresholdPct > 0 ? thresholdPct : 10;

    const rows = await PurchasePrice.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      ],
      order: [
        ['productId', 'ASC'],
        ['supplierId', 'ASC'],
        ['targetYearMonth', 'ASC'],
      ],
    });

    type Alert = {
      productId: number;
      productName: string;
      supplierName: string;
      prevYearMonth: string;
      targetYearMonth: string;
      priceBefore: number;
      priceAfter: number;
      changePct: number;
    };

    const alerts: Alert[] = [];
    let i = 0;
    while (i < rows.length) {
      const productId = rows[i].productId;
      const supplierId = rows[i].supplierId;
      const series: typeof rows = [];
      while (
        i < rows.length
        && rows[i].productId === productId
        && rows[i].supplierId === supplierId
      ) {
        series.push(rows[i]);
        i += 1;
      }

      for (let j = 1; j < series.length; j += 1) {
        const prev = series[j - 1];
        const curr = series[j];
        // Only compare adjacent calendar months (skip gaps like Jan→Mar)
        if (this.nextYearMonth(prev.targetYearMonth) !== curr.targetYearMonth) continue;

        const before = Number(prev.purchasePrice);
        const after = Number(curr.purchasePrice);
        if (!(before > 0) || !(after > 0)) continue;

        const changePct = ((after - before) / before) * 100;
        if (changePct < threshold) continue;

        alerts.push({
          productId,
          productName: (curr as any).product?.name || `商品#${productId}`,
          supplierName: (curr as any).supplier?.name || `発注先#${supplierId}`,
          prevYearMonth: prev.targetYearMonth,
          targetYearMonth: curr.targetYearMonth,
          priceBefore: before,
          priceAfter: after,
          changePct: Math.round(changePct * 100) / 100,
        });
      }
    }

    return alerts
      .sort((a, b) => b.changePct - a.changePct || b.targetYearMonth.localeCompare(a.targetYearMonth))
      .slice(0, limit);
  }

  /**
   * Monthly unit-profit by product for an inclusive year-month range.
   * - avgPurchase: average of all suppliers for that month
   * - avgSell: average of sell prices using each customer-rank default margin
   * - unitProfit: avgSell - avgPurchase
   * Every month in the selected range is returned (null metrics when no purchase data).
   */
  async getProductProfitTrends(startYearMonth?: string, endYearMonth?: string) {
    const months = this.yearMonthsInRange(startYearMonth, endYearMonth);
    const ranks = await RankMarginSetting.findAll({ order: [['rank', 'ASC']] });
    const marginRates = ranks.map((r) => Number(r.defaultMarginRate)).filter((n) => Number.isFinite(n));
    const rates = marginRates.length ? marginRates : [25];

    const prices = await PurchasePrice.findAll({
      where: { targetYearMonth: { [Op.in]: months } },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name'],
        where: { isActive: true },
        required: true,
      }],
    });

    type MonthAgg = { sum: number; count: number };
    const byProductMonth = new Map<number, Map<string, MonthAgg>>();
    const productNames = new Map<number, string>();

    for (const row of prices) {
      const productId = row.productId;
      const ym = row.targetYearMonth;
      const price = Number(row.purchasePrice);
      if (!(price > 0)) continue;

      productNames.set(productId, (row as any).product?.name || `商品#${productId}`);
      if (!byProductMonth.has(productId)) byProductMonth.set(productId, new Map());
      const monthMap = byProductMonth.get(productId)!;
      const agg = monthMap.get(ym) || { sum: 0, count: 0 };
      agg.sum += price;
      agg.count += 1;
      monthMap.set(ym, agg);
    }

    type Point = {
      yearMonth: string;
      avgPurchase: number | null;
      avgSell: number | null;
      unitProfit: number | null;
      marginPct: number | null;
    };

    const products: {
      productId: number;
      productName: string;
      latestUnitProfit: number;
      avgUnitProfit: number;
      points: Point[];
    }[] = [];

    for (const [productId, monthMap] of byProductMonth.entries()) {
      const points: Point[] = [];
      const valuedProfits: number[] = [];

      for (const ym of months) {
        const agg = monthMap.get(ym);
        if (!agg || !agg.count) {
          points.push({
            yearMonth: ym,
            avgPurchase: null,
            avgSell: null,
            unitProfit: null,
            marginPct: null,
          });
          continue;
        }
        const avgPurchase = agg.sum / agg.count;
        const sellPrices = rates.map((rate) => avgPurchase * (1 + rate / 100));
        const avgSell = sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length;
        const unitProfit = avgSell - avgPurchase;
        const marginPct = avgPurchase > 0 ? (unitProfit / avgPurchase) * 100 : 0;
        valuedProfits.push(unitProfit);
        points.push({
          yearMonth: ym,
          avgPurchase: Math.round(avgPurchase * 100) / 100,
          avgSell: Math.round(avgSell * 100) / 100,
          unitProfit: Math.round(unitProfit * 100) / 100,
          marginPct: Math.round(marginPct * 100) / 100,
        });
      }

      if (!valuedProfits.length) continue;
      const latestValued = [...points].reverse().find((p) => p.unitProfit != null);
      const avgUnitProfit = valuedProfits.reduce((s, n) => s + n, 0) / valuedProfits.length;
      products.push({
        productId,
        productName: productNames.get(productId) || `商品#${productId}`,
        latestUnitProfit: latestValued?.unitProfit ?? 0,
        avgUnitProfit: Math.round(avgUnitProfit * 100) / 100,
        points,
      });
    }

    products.sort((a, b) => b.latestUnitProfit - a.latestUnitProfit || b.avgUnitProfit - a.avgUnitProfit);

    return {
      startYearMonth: months[0] || null,
      endYearMonth: months[months.length - 1] || null,
      months,
      rankMargins: rates,
      defaultProductId: products[0]?.productId ?? null,
      products,
    };
  }

  /** Inclusive year-month list. Defaults to last 12 months when omitted/invalid. */
  private yearMonthsInRange(startYearMonth?: string, endYearMonth?: string): string[] {
    const fallback = this.lastYearMonths(12);
    const start = this.isYearMonth(startYearMonth) ? startYearMonth! : fallback[0];
    const end = this.isYearMonth(endYearMonth) ? endYearMonth! : fallback[fallback.length - 1];
    const [s, e] = start <= end ? [start, end] : [end, start];

    const out: string[] = [];
    let cur = s;
    // Cap at 36 months to keep responses light
    for (let i = 0; i < 36; i += 1) {
      out.push(cur);
      if (cur === e) break;
      cur = this.nextYearMonth(cur);
    }
    return out;
  }

  private isYearMonth(value?: string): boolean {
    return Boolean(value && /^\d{4}-\d{2}$/.test(value));
  }

  private lastYearMonths(count: number): string[] {
    const out: string[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }

  private nextYearMonth(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

export default new DashboardService();
