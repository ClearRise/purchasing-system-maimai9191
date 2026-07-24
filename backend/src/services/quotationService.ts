import { Op } from 'sequelize';
import sequelize from '@/config/database';
import {
  Quotation,
  QuotationLine,
  Store,
  Product,
  ProductStore,
  RankMarginSetting,
  Category,
  LookupOption,
} from '@/models';
import CustomError from '@/utils/customError';
import { buildPagination, parsePagination, pageWindow } from '@/utils/pagination';
import purchasePriceService from '@/services/purchasePriceService';

const productDetailIncludes = [
  { model: Category, as: 'category', attributes: ['id', 'name', 'categoryCode'] },
  { model: LookupOption, as: 'unitOption', attributes: ['id', 'value'] },
  { model: LookupOption, as: 'specOption', attributes: ['id', 'value'] },
];

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
      ...productDetailIncludes,
    ],
    order: [['id', 'ASC']],
  });
}

async function loadProductForLine(productId: number) {
  const product = await Product.findByPk(productId, {
    include: [...productDetailIncludes],
  });
  if (!product || !product.isActive) {
    throw new CustomError('商品が見つかりません', 404);
  }
  return product;
}

function yearMonthFromDate(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function buildLineFields(
  product: Product,
  targetYearMonth: string,
  marginRate: number
) {
  const bestPrice = await purchasePriceService.getBestPrice(
    product.id,
    targetYearMonth,
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

  return {
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
  };
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
  productId?: number;
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
        const fields = await buildLineFields(product, input.targetYearMonth, marginRate);
        await QuotationLine.create(
          {
            quotationId: quotation.id,
            lineNo: lineNo++,
            ...fields,
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

  /**
   * Sync quotation lines: update existing, create new (productId without id),
   * delete rows whose id is not included in the payload.
   */
  async updateLines(id: number, lines: LineUpdate[]) {
    const quotation = await Quotation.findByPk(id);
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);
    if (quotation.status === 'sent') throw new CustomError('送信済みの見積書は編集できません', 400);

    const store = await Store.findByPk(quotation.storeId);
    if (!store) throw new CustomError('得意先が見つかりません', 404);

    const margin = await RankMarginSetting.findOne({ where: { rank: store.rank } });
    const marginRate = margin ? Number(margin.defaultMarginRate) : 25;
    const targetYearMonth = yearMonthFromDate(quotation.periodStart);

    const existingLines = await QuotationLine.findAll({ where: { quotationId: id } });
    const existingById = new Map(existingLines.map((l) => [l.id, l]));
    const keepIds = new Set(
      lines.filter((l) => typeof l.id === 'number' && l.id > 0).map((l) => l.id as number)
    );

    const transaction = await sequelize.transaction();
    try {
      for (const existing of existingLines) {
        if (!keepIds.has(existing.id)) {
          await existing.destroy({ transaction });
        }
      }

      let lineNo = 1;
      for (const line of lines) {
        if (line.id && existingById.has(line.id)) {
          const existing = existingById.get(line.id)!;
          await existing.update(
            {
              lineNo: lineNo++,
              finalQuotePrice: line.finalQuotePrice ?? existing.finalQuotePrice,
              isVisible: line.isVisible ?? existing.isVisible,
              note: line.note !== undefined ? line.note : existing.note,
            },
            { transaction }
          );
          continue;
        }

        if (!line.productId) continue;
        const product = await loadProductForLine(line.productId);
        const fields = await buildLineFields(product, targetYearMonth, marginRate);
        await QuotationLine.create(
          {
            quotationId: id,
            lineNo: lineNo++,
            ...fields,
            finalQuotePrice: line.finalQuotePrice ?? fields.finalQuotePrice,
            isVisible: line.isVisible ?? true,
            note: line.note !== undefined ? line.note : fields.note,
          },
          { transaction }
        );

        // Keep 取扱商品 in sync when a product is added to a quotation.
        const linked = await ProductStore.findOne({
          where: { storeId: quotation.storeId, productId: product.id },
          transaction,
        });
        if (!linked) {
          await ProductStore.create(
            { storeId: quotation.storeId, productId: product.id },
            { transaction }
          );
        }
      }

      await transaction.commit();
      return this.getById(id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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
    const existing = await Quotation.findAll({
      attributes: ['quotationNo'],
      where: { quotationNo: { [Op.like]: `${prefix}-%` } },
    });
    let maxSeq = 0;
    for (const row of existing) {
      const suffix = row.quotationNo.slice(prefix.length + 1);
      const n = Number.parseInt(suffix, 10);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
    return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
  }
}

export default new QuotationService();
