import { Op } from 'sequelize';
import sequelize from '@/config/database';
import {
  Quotation,
  QuotationLine,
  Customer,
  Store,
  Product,
  RankMarginSetting,
  PurchasePrice,
  Category,
  LookupOption,
} from '@/models';
import CustomError from '@/utils/customError';
import { buildPagination, parsePagination, pageWindow } from '@/utils/pagination';
import purchasePriceService from '@/services/purchasePriceService';

async function loadStoreProducts(storeId: number) {
  return Product.findAll({
    where: { isActive: true },
    include: [
      {
        model: Store,
        as: 'stores',
        attributes: ['id'],
        through: { attributes: [] },
        where: { id: storeId },
        required: true,
      },
      { model: Category, as: 'category', attributes: ['id', 'name', 'categoryCode'] },
      { model: LookupOption, as: 'unitOption', attributes: ['id', 'value'] },
      { model: LookupOption, as: 'specOption', attributes: ['id', 'value'] },
    ],
    order: [['id', 'ASC']],
  });
}

interface CreateQuotationInput {
  customerId: number;
  storeId: number;
  periodStart: string;
  periodEnd: string;
  note?: string;
  targetYearMonth: string;
}

interface LineUpdate {
  id?: number;
  productId: number;
  finalQuotePrice?: number;
  isVisible?: boolean;
  note?: string;
}

class QuotationService {
  async list(query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder } = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = Number(query.customerId);

    const { count, rows } = await Quotation.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'rank'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] },
      ],
      ...pageWindow(page, limit),
      order: [[sortBy, sortOrder]],
    });
    return buildPagination(rows, count, page, limit);
  }

  async getById(id: number) {
    const quotation = await Quotation.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Store, as: 'store' },
      ],
    });
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);

    const lines = await QuotationLine.findAll({
      where: { quotationId: id },
      order: [['lineNo', 'ASC']],
    });

    return { ...quotation.toJSON(), lines };
  }

  async create(input: CreateQuotationInput, userId: number) {
    const customer = await Customer.findByPk(input.customerId);
    if (!customer) throw new CustomError('得意先が見つかりません', 404);

    const margin = await RankMarginSetting.findOne({ where: { rank: customer.rank } });
    const marginRate = margin ? Number(margin.defaultMarginRate) : 25;

    const products = await loadStoreProducts(input.storeId);

    const quotationNo = await this.generateQuotationNo(input.periodStart);
    const transaction = await sequelize.transaction();

    try {
      const quotation = await Quotation.create(
        {
          quotationNo,
          customerId: input.customerId,
          storeId: input.storeId,
          periodStart: new Date(input.periodStart),
          periodEnd: new Date(input.periodEnd),
          status: 'draft',
          note: input.note,
          createdBy: userId,
        },
        { transaction }
      );

      let lineNo = 1;
      for (const product of products) {
        const purchasePrice = await purchasePriceService.getBestPrice(
          product.id,
          input.targetYearMonth,
          product.defaultSupplierId || undefined
        );
        if (purchasePrice == null) continue;

        const autoQuotePrice = Math.round(purchasePrice * (1 + marginRate / 100));

        await QuotationLine.create(
          {
            quotationId: quotation.id,
            lineNo: lineNo++,
            productId: product.id,
            categoryCode: (product as any).category?.categoryCode
              || (product as any).category?.name
              || undefined,
            productName: product.name,
            spec: (product as any).specOption?.value || undefined,
            unit: (product as any).unitOption?.value || 'PC',
            purchasePrice,
            supplierId: product.defaultSupplierId,
            rankMarginRate: marginRate,
            autoQuotePrice,
            finalQuotePrice: autoQuotePrice,
            isVisible: true,
            note: product.note,
          },
          { transaction }
        );
      }

      await transaction.commit();
      return this.getById(quotation.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async updateLines(id: number, lines: LineUpdate[]) {
    const quotation = await Quotation.findByPk(id);
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);
    if (quotation.status === 'sent') throw new CustomError('送信済みの見積書は編集できません', 400);

    for (const line of lines) {
      if (!line.id) continue;
      const existing = await QuotationLine.findOne({ where: { id: line.id, quotationId: id } });
      if (!existing) continue;
      await existing.update({
        finalQuotePrice: line.finalQuotePrice ?? existing.finalQuotePrice,
        isVisible: line.isVisible ?? existing.isVisible,
        note: line.note ?? existing.note,
      });
    }
    return this.getById(id);
  }

  async updateStatus(id: number, status: 'draft' | 'confirmed' | 'sent') {
    const quotation = await Quotation.findByPk(id);
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);
    const updates: Partial<Quotation> = { status };
    if (status === 'sent') updates.sentAt = new Date();
    await quotation.update(updates);
    return this.getById(id);
  }

  async delete(id: number) {
    const quotation = await Quotation.findByPk(id);
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);
    if (quotation.status === 'sent') {
      throw new CustomError('送信済みの見積書は削除できません', 400);
    }

    const transaction = await sequelize.transaction();
    try {
      await QuotationLine.destroy({ where: { quotationId: id }, transaction });
      await quotation.destroy({ transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async simulate(customerId: number, storeId: number, targetYearMonth: string, adjustmentPct = 0) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) throw new CustomError('得意先が見つかりません', 404);

    const margin = await RankMarginSetting.findOne({ where: { rank: customer.rank } });
    const marginRate = margin ? Number(margin.defaultMarginRate) : 25;
    const minMargin = margin ? Number(margin.minMarginRate) : 15;

    const products = await loadStoreProducts(storeId);
    const results = [];

    for (const product of products) {
      const purchasePrice = await purchasePriceService.getBestPrice(product.id, targetYearMonth);
      if (purchasePrice == null) continue;

      const currentPrice = Math.round(purchasePrice * (1 + marginRate / 100));
      const scenarioPrice = Math.round(currentPrice * (1 + adjustmentPct / 100));
      const currentMargin = ((currentPrice - purchasePrice) / purchasePrice) * 100;
      const scenarioMargin = ((scenarioPrice - purchasePrice) / purchasePrice) * 100;

      results.push({
        productId: product.id,
        productName: product.name,
        spec: (product as any).specOption?.value || undefined,
        unit: (product as any).unitOption?.value || 'PC',
        note: product.note,
        purchasePrice,
        currentPrice,
        scenarioPrice,
        currentMarginRate: Math.round(currentMargin * 100) / 100,
        scenarioMarginRate: Math.round(scenarioMargin * 100) / 100,
        priceDiff: scenarioPrice - currentPrice,
        alert: scenarioMargin < minMargin,
      });
    }

    return { customer, marginRate, minMargin, adjustmentPct, lines: results };
  }

  private async generateQuotationNo(periodStart: string): Promise<string> {
    const d = new Date(periodStart);
    const prefix = `EST-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = await Quotation.count({ where: { quotationNo: { [Op.like]: `${prefix}%` } } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}

export default new QuotationService();
