import { Op } from 'sequelize';
import sequelize from '@/config/database';
import {
  Quotation,
  QuotationLine,
  Store,
  Product,
  RankMarginSetting,
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
    if (query.storeId) where.storeId = Number(query.storeId);

    const { count, rows } = await Quotation.findAndCountAll({
      where,
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'rank', 'groupName'] },
      ],
      ...pageWindow(page, limit),
      order: [[sortBy, sortOrder]],
    });
    return buildPagination(rows, count, page, limit);
  }

  async getById(id: number) {
    const quotation = await Quotation.findByPk(id, {
      include: [{ model: Store, as: 'store' }],
    });
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);

    const lines = await QuotationLine.findAll({
      where: { quotationId: id },
      order: [['lineNo', 'ASC']],
    });

    return { ...quotation.toJSON(), lines };
  }

  async create(input: CreateQuotationInput, userId: number) {
    const store = await Store.findByPk(input.storeId);
    if (!store || !store.isActive) throw new CustomError('得意先が見つかりません', 404);

    const margin = await RankMarginSetting.findOne({ where: { rank: store.rank } });
    const marginRate = margin ? Number(margin.defaultMarginRate) : 25;

    const products = await loadStoreProducts(input.storeId);

    const quotationNo = await this.generateQuotationNo(input.periodStart);
    const transaction = await sequelize.transaction();

    try {
      const quotation = await Quotation.create(
        {
          quotationNo,
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
        const bestPrice = await purchasePriceService.getBestPrice(
          product.id,
          input.targetYearMonth,
          product.defaultSupplierId || undefined
        );
        const hasPrice = bestPrice != null;
        const purchasePrice = hasPrice ? bestPrice : 0;
        const autoQuotePrice = hasPrice
          ? Math.round(purchasePrice * (1 + marginRate / 100))
          : 0;
        const noteParts = [
          product.note?.trim() || '',
          hasPrice ? '' : '仕入価格未登録',
        ].filter(Boolean);

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
            note: noteParts.length ? noteParts.join(' / ') : undefined,
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

  async simulate(storeId: number, targetYearMonth: string, adjustmentPct = 0) {
    const store = await Store.findByPk(storeId);
    if (!store || !store.isActive) throw new CustomError('得意先が見つかりません', 404);

    const margin = await RankMarginSetting.findOne({ where: { rank: store.rank } });
    const marginRate = margin ? Number(margin.defaultMarginRate) : 25;
    const minMargin = margin ? Number(margin.minMarginRate) : 15;

    const products = await loadStoreProducts(storeId);
    const results = [];

    for (const product of products) {
      const bestPrice = await purchasePriceService.getBestPrice(product.id, targetYearMonth);
      const purchasePrice = bestPrice ?? 0;
      const hasPrice = bestPrice != null;

      const currentPrice = hasPrice ? Math.round(purchasePrice * (1 + marginRate / 100)) : 0;
      const scenarioPrice = hasPrice ? Math.round(currentPrice * (1 + adjustmentPct / 100)) : 0;
      const currentMargin = hasPrice && purchasePrice > 0
        ? ((currentPrice - purchasePrice) / purchasePrice) * 100
        : 0;
      const scenarioMargin = hasPrice && purchasePrice > 0
        ? ((scenarioPrice - purchasePrice) / purchasePrice) * 100
        : 0;

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
        alert: hasPrice ? scenarioMargin < minMargin : true,
        missingPurchasePrice: !hasPrice,
      });
    }

    return { store, marginRate, minMargin, adjustmentPct, lines: results };
  }

  private async generateQuotationNo(periodStart: string): Promise<string> {
    const d = new Date(periodStart);
    const prefix = `EST-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = await Quotation.count({ where: { quotationNo: { [Op.like]: `${prefix}%` } } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}

export default new QuotationService();
