import { Op } from 'sequelize';
import sequelize from '@/config/database';
import {
  Product,
  Supplier,
  PurchasePrice,
  PurchasePriceLog,
  Store,
  LookupOption,
} from '@/models';
import CustomError from '@/utils/customError';
import { buildPagination, parsePagination, pageWindow } from '@/utils/pagination';

function productUnit(product: Product): string {
  return ((product as any).unitOption?.value as string) || 'PC';
}

function productSpec(product: Product): string | undefined {
  return (product as any).specOption?.value as string | undefined;
}

interface BulkPriceItem {
  productId: number;
  supplierId: number;
  purchasePrice: number;
  unit: string;
  note?: string;
}

interface SupplierPriceRow {
  supplierId: number;
  supplierName: string;
  purchasePrice: number | null;
  unit: string;
  note: string | null;
  priceId: number | null;
}

class PurchasePriceService {
  private async loadProducts(storeId?: number) {
    const allSuppliers = await Supplier.findAll({ where: { isActive: true }, order: [['id', 'ASC']] });

    const products = await Product.findAll({
      where: { isActive: true },
      include: [
        { model: Supplier, as: 'suppliers', through: { attributes: [] } },
        { model: LookupOption, as: 'unitOption', attributes: ['id', 'value'] },
        { model: LookupOption, as: 'specOption', attributes: ['id', 'value'] },
        {
          model: Store,
          as: 'stores',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          ...(storeId ? { where: { id: storeId }, required: true } : { required: false }),
        },
      ],
      order: [['id', 'ASC']],
    });

    return products.map((product) => {
      let linkedSuppliers: Supplier[] = (product as any).suppliers || [];
      if (!linkedSuppliers.length && product.defaultSupplierId) {
        const defaultSupplier = allSuppliers.find((s) => s.id === product.defaultSupplierId);
        if (defaultSupplier) linkedSuppliers = [defaultSupplier];
      }
      if (!linkedSuppliers.length) linkedSuppliers = allSuppliers;
      return { product, linkedSuppliers };
    });
  }

  private getMonthsBetween(startYm: string, endYm: string): string[] {
    const [sy, sm] = startYm.split('-').map(Number);
    const [ey, em] = endYm.split('-').map(Number);
    const startKey = sy * 12 + sm;
    const endKey = ey * 12 + em;
    if (startKey > endKey) {
      throw new CustomError('開始年月は終了年月以前である必要があります', 400);
    }
    const span = endKey - startKey + 1;
    if (span > 24) {
      throw new CustomError('比較期間は24ヶ月以内にしてください', 400);
    }

    const months: string[] = [];
    let y = sy;
    let m = sm;
    while (y * 12 + m <= endKey) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return months;
  }

  async getGrid(targetYearMonth: string, storeId?: number, categoryId?: number, forEntry = false) {
    // storeId filters which products appear (via product_stores); prices stay store-agnostic.
    const productWhere: Record<string, unknown> = { isActive: true };
    if (categoryId) productWhere.categoryId = categoryId;

    const [products, allSuppliers] = await Promise.all([
      Product.findAll({
        where: productWhere,
        include: [
          { model: Supplier, as: 'suppliers', through: { attributes: [] } },
          { model: LookupOption, as: 'unitOption', attributes: ['id', 'value'] },
          { model: LookupOption, as: 'specOption', attributes: ['id', 'value'] },
          {
            model: Store,
            as: 'stores',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            ...(storeId
              ? { where: { id: storeId }, required: true }
              : { required: false }),
          },
        ],
        order: [['id', 'ASC']],
      }),
      Supplier.findAll({ where: { isActive: true }, order: [['id', 'ASC']] }),
    ]);

    const prices = await PurchasePrice.findAll({
      where: { targetYearMonth },
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
    });

    const priceMap = new Map<string, PurchasePrice>();
    prices.forEach((p) => priceMap.set(`${p.productId}-${p.supplierId}`, p));

    const prevMonth = this.getPrevMonth(targetYearMonth);

    const rows = await Promise.all(
      products.map(async (product) => {
        let linkedSuppliers: Supplier[] = (product as any).suppliers || [];
        if (!linkedSuppliers.length && product.defaultSupplierId) {
          const defaultSupplier = allSuppliers.find((s) => s.id === product.defaultSupplierId);
          if (defaultSupplier) linkedSuppliers = [defaultSupplier];
        }
        if (!linkedSuppliers.length) {
          linkedSuppliers = allSuppliers;
        }

        const supplierPrices: SupplierPriceRow[] = linkedSuppliers.map((supplier: Supplier) => {
          const key = `${product.id}-${supplier.id}`;
          const current = priceMap.get(key);
          return {
            supplierId: supplier.id,
            supplierName: supplier.name,
            purchasePrice: current ? Number(current.purchasePrice) : null,
            unit: current?.unit || productUnit(product),
            note: current?.note || null,
            priceId: current?.id || null,
          };
        });

        const enriched = forEntry
          ? supplierPrices
          : await Promise.all(
              supplierPrices.map(async (sp) => {
                const avg = await this.getYearAverage(product.id, sp.supplierId);
                const prev = await PurchasePrice.findOne({
                  where: { targetYearMonth: prevMonth, productId: product.id, supplierId: sp.supplierId },
                });
                const currentPrice = sp.purchasePrice;
                let changePct: number | null = null;
                if (currentPrice != null && prev) {
                  const prevPrice = Number(prev.purchasePrice);
                  if (prevPrice > 0) changePct = ((currentPrice - prevPrice) / prevPrice) * 100;
                }
                return { ...sp, yearAverage: avg, changePct, isAbnormal: changePct != null && Math.abs(changePct) > 30 };
              })
            );

        const validPrices = enriched.filter((e) => e.purchasePrice != null).map((e) => e.purchasePrice as number);
        const minPrice = validPrices.length ? Math.min(...validPrices) : null;
        const stores = ((product as any).stores || []) as { id: number; name: string }[];

        return {
          productId: product.id,
          productCode: product.productCode,
          name: product.name,
          spec: productSpec(product),
          unit: productUnit(product),
          note: product.note,
          stores,
          suppliers: enriched,
          minPrice,
        };
      })
    );

    return rows;
  }

  async getCompareMatrix(
    storeId: number,
    mode: 'supplier' | 'month',
    options: {
      targetYearMonth?: string;
      startYearMonth?: string;
      endYearMonth?: string;
      supplierId?: number;
    }
  ) {
    const { targetYearMonth, startYearMonth, endYearMonth, supplierId } = options;
    const storeProducts = await this.loadProducts(storeId);
    if (!storeProducts.length) {
      return mode === 'supplier'
        ? { mode, targetYearMonth, storeId, suppliers: [], products: [] }
        : { mode, startYearMonth, endYearMonth, storeId, months: [], supplierId, products: [] };
    }

    const supplierMap = new Map<number, string>();
    storeProducts.forEach(({ linkedSuppliers }) => {
      linkedSuppliers.forEach((s) => supplierMap.set(s.id, s.name));
    });
    const suppliers = Array.from(supplierMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    const productIds = storeProducts.map(({ product }) => product.id);

    if (mode === 'supplier') {
      if (!targetYearMonth) throw new CustomError('対象年月を指定してください', 400);
      const prices = await PurchasePrice.findAll({
        where: { targetYearMonth, productId: { [Op.in]: productIds } },
      });
      const priceMap = new Map<string, number>();
      prices.forEach((p) => priceMap.set(`${p.productId}-${p.supplierId}`, Number(p.purchasePrice)));

      const products = storeProducts.map(({ product, linkedSuppliers }) => {
        const pricesBySupplier: Record<number, number | null> = {};
        linkedSuppliers.forEach((s) => {
          pricesBySupplier[s.id] = priceMap.get(`${product.id}-${s.id}`) ?? null;
        });
        const valid = Object.values(pricesBySupplier).filter((v): v is number => v != null);
        const minPrice = valid.length ? Math.min(...valid) : null;
        return {
          productId: product.id,
          productCode: product.productCode,
          name: product.name,
          spec: productSpec(product),
          unit: productUnit(product),
          note: product.note,
          prices: pricesBySupplier,
          minPrice,
        };
      });

      return { mode, targetYearMonth, storeId, suppliers, products };
    }

    if (!startYearMonth || !endYearMonth) {
      throw new CustomError('開始年月と終了年月を指定してください', 400);
    }

    const months = this.getMonthsBetween(startYearMonth, endYearMonth);
    const priceWhere: Record<string, unknown> = {
      targetYearMonth: { [Op.in]: months },
      productId: { [Op.in]: productIds },
    };
    if (supplierId) priceWhere.supplierId = supplierId;

    const prices = await PurchasePrice.findAll({ where: priceWhere });

    const products = storeProducts.map(({ product }) => {
      const pricesByMonth: Record<string, number | null> = {};
      const changeByMonth: Record<string, number | null> = {};

      months.forEach((ym, idx) => {
        let price: number | null = null;
        if (supplierId) {
          const row = prices.find(
            (p) => p.productId === product.id && p.targetYearMonth === ym && p.supplierId === supplierId
          );
          price = row ? Number(row.purchasePrice) : null;
        } else {
          const monthPrices = prices
            .filter((p) => p.productId === product.id && p.targetYearMonth === ym)
            .map((p) => Number(p.purchasePrice));
          price = monthPrices.length ? Math.min(...monthPrices) : null;
        }
        pricesByMonth[ym] = price;

        if (idx > 0) {
          const prevYm = months[idx - 1];
          const prevPrice = pricesByMonth[prevYm];
          if (price != null && prevPrice != null && prevPrice > 0) {
            changeByMonth[ym] = Math.round(((price - prevPrice) / prevPrice) * 1000) / 10;
          } else {
            changeByMonth[ym] = null;
          }
        }
      });

      return {
        productId: product.id,
        productCode: product.productCode,
        name: product.name,
        spec: productSpec(product),
        unit: productUnit(product),
        note: product.note,
        prices: pricesByMonth,
        changePct: changeByMonth,
      };
    });

    const selectedSupplier = supplierId
      ? suppliers.find((s) => s.id === supplierId) || null
      : null;

    return {
      mode,
      startYearMonth,
      endYearMonth,
      storeId,
      months,
      suppliers,
      supplierId: supplierId || null,
      supplierName: selectedSupplier?.name || null,
      products,
    };
  }

  async bulkSave(targetYearMonth: string, items: BulkPriceItem[], userId: number) {
    const transaction = await sequelize.transaction();
    try {
      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          include: [{ model: LookupOption, as: 'unitOption', attributes: ['id', 'value'] }],
          transaction,
        });
        if (!product) continue;
        const resolvedUnit = productUnit(product);
        if (item.unit !== resolvedUnit) {
          throw new CustomError(`商品「${product.name}」の単位が一致しません`, 400);
        }

        const existing = await PurchasePrice.findOne({
          where: { targetYearMonth, productId: item.productId, supplierId: item.supplierId },
          transaction,
        });

        if (existing) {
          const before = Number(existing.purchasePrice);
          const after = Number(item.purchasePrice);
          // Skip no-op saves so history / alerts are not polluted
          if (before === after
            && (item.note ?? null) === (existing.note ?? null)
            && item.unit === existing.unit) {
            continue;
          }
          await existing.update(
            { purchasePrice: item.purchasePrice, unit: item.unit, note: item.note, createdBy: userId },
            { transaction }
          );
          if (before !== after) {
            await PurchasePriceLog.create(
              {
                purchasePriceId: existing.id,
                productId: item.productId,
                supplierId: item.supplierId,
                targetYearMonth,
                changeType: 'update',
                priceBefore: before,
                priceAfter: item.purchasePrice,
                unit: item.unit,
                changedBy: userId,
                changedAt: new Date(),
                note: item.note,
              },
              { transaction }
            );
          }
        } else {
          const created = await PurchasePrice.create(
            {
              targetYearMonth,
              productId: item.productId,
              supplierId: item.supplierId,
              purchasePrice: item.purchasePrice,
              unit: item.unit,
              note: item.note,
              createdBy: userId,
            },
            { transaction }
          );
          await PurchasePriceLog.create(
            {
              purchasePriceId: created.id,
              productId: item.productId,
              supplierId: item.supplierId,
              targetYearMonth,
              changeType: 'create',
              priceAfter: item.purchasePrice,
              unit: item.unit,
              changedBy: userId,
              changedAt: new Date(),
            },
            { transaction }
          );
        }
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getHistory(query: Record<string, unknown>) {
    const { page, limit } = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (query.productId) where.productId = query.productId;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.targetYearMonth) where.targetYearMonth = query.targetYearMonth;

    const { count, rows } = await PurchasePriceLog.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'productCode'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      ],
      ...pageWindow(page, limit),
      order: [['changedAt', 'DESC']],
    });
    return buildPagination(rows, count, page, limit);
  }

  private getPrevMonth(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private async getYearAverage(productId: number, supplierId: number): Promise<number | null> {
    const rows = await PurchasePrice.findAll({
      where: { productId, supplierId },
      order: [['targetYearMonth', 'DESC']],
      limit: 12,
    });
    if (!rows.length) return null;
    const sum = rows.reduce((acc, r) => acc + Number(r.purchasePrice), 0);
    return Math.round((sum / rows.length) * 100) / 100;
  }

  async getBestPrice(productId: number, targetYearMonth: string, supplierId?: number) {
    if (supplierId) {
      const price = await PurchasePrice.findOne({
        where: { productId, supplierId, targetYearMonth },
      });
      return price ? Number(price.purchasePrice) : null;
    }
    const prices = await PurchasePrice.findAll({ where: { productId, targetYearMonth } });
    if (!prices.length) return null;
    return Math.min(...prices.map((p) => Number(p.purchasePrice)));
  }
}

export default new PurchasePriceService();
