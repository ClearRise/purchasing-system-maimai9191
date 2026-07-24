import { Op } from 'sequelize';
import {
  Supplier,
  Store,
  Category,
  Product,
  ProductStore,
  ProductSupplier,
  LookupOption,
} from '@/models';
import CustomError from '@/utils/customError';
import { buildPagination, parsePagination, pageWindow, searchCondition } from '@/utils/pagination';
import { toProductDto, toProductDtoList } from '@/utils/productDto';
import { CUSTOMER_RANKS, type CustomerRank } from '@/config/constants';

function normalizeRank(raw: unknown): CustomerRank {
  const v = String(raw || 'C').toUpperCase();
  return (CUSTOMER_RANKS as readonly string[]).includes(v) ? (v as CustomerRank) : 'C';
}

class MasterService {
  // --- Suppliers ---
  async listSuppliers(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where = { isActive: true, ...searchCondition(['name', 'shortName'], search) };
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      ...pageWindow(page, limit),
      order: [[sortBy, sortOrder]],
    });
    return buildPagination(rows, count, page, limit);
  }

  async createSupplier(data: Partial<Supplier>) {
    return Supplier.create({ ...data, isActive: true } as Supplier);
  }

  async updateSupplier(id: number, data: Partial<Supplier>) {
    const item = await Supplier.findByPk(id);
    if (!item) throw new CustomError('発注先が見つかりません', 404);
    await item.update(data);
    return item;
  }

  async deleteSupplier(id: number) {
    const item = await Supplier.findByPk(id);
    if (!item) throw new CustomError('発注先が見つかりません', 404);
    await item.update({ isActive: false });
  }

  // --- Stores (= 得意先) ---
  async listStores(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where = {
      isActive: true,
      ...searchCondition(['name', 'groupName', 'nameKana', 'nameAbbr'], search),
    };
    if (query.rank) (where as any).rank = query.rank;
    const { count, rows } = await Store.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id'],
          where: { isActive: true },
          required: false,
          through: { attributes: [] },
        },
      ],
      ...pageWindow(page, limit),
      order: [[sortBy, sortOrder]],
      distinct: true,
    });
    const data = rows.map((row) => {
      const json = row.toJSON() as any;
      const productCount = Array.isArray(json.products) ? json.products.length : 0;
      delete json.products;
      return { ...json, productCount };
    });
    return buildPagination(data, count, page, limit);
  }

  async getStore(id: number) {
    const item = await Store.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false,
          through: { attributes: [] },
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name', 'categoryCode'] },
            { model: LookupOption, as: 'unitOption', attributes: ['id', 'value', 'kind'] },
            { model: LookupOption, as: 'specOption', attributes: ['id', 'value', 'kind'] },
          ],
        },
      ],
    });
    if (!item || !item.isActive) throw new CustomError('得意先が見つかりません', 404);
    const json = item.toJSON() as any;
    const productModels = ((item as any).products || []) as Product[];
    return {
      ...json,
      products: toProductDtoList(productModels),
    };
  }

  async createStore(data: Record<string, unknown>) {
    const { productIds, ...rest } = data;
    const store = await Store.create({
      ...rest,
      rank: normalizeRank(rest.rank),
      isActive: true,
    } as Store);
    if (Array.isArray(productIds)) {
      await this.replaceStoreProducts(store.id, productIds.map(Number));
    }
    return this.getStore(store.id);
  }

  async updateStore(id: number, data: Record<string, unknown>) {
    const item = await Store.findByPk(id);
    if (!item) throw new CustomError('得意先が見つかりません', 404);
    const { productIds, ...rest } = data;
    const patch: Record<string, unknown> = { ...rest };
    if ('rank' in rest) patch.rank = normalizeRank(rest.rank);
    await item.update(patch);
    if (Array.isArray(productIds)) {
      await this.replaceStoreProducts(id, productIds.map(Number));
    }
    return this.getStore(id);
  }

  async deleteStore(id: number) {
    const item = await Store.findByPk(id);
    if (!item) throw new CustomError('得意先が見つかりません', 404);
    await item.update({ isActive: false });
  }

  /** Replace the product assortment for a 得意先. */
  async replaceStoreProducts(storeId: number, productIds: number[]) {
    const store = await Store.findByPk(storeId);
    if (!store || !store.isActive) throw new CustomError('得意先が見つかりません', 404);

    const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))];
    if (unique.length) {
      const found = await Product.findAll({
        where: { id: unique, isActive: true },
        attributes: ['id'],
      });
      if (found.length !== unique.length) {
        throw new CustomError('存在しない商品が含まれています', 400);
      }
    }

    await ProductStore.destroy({ where: { storeId } });
    if (unique.length) {
      await ProductStore.bulkCreate(unique.map((productId) => ({ productId, storeId })));
    }
    return this.getStore(storeId);
  }

  async linkProductToStore(productId: number, storeId: number) {
    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) throw new CustomError('商品が見つかりません', 404);
    const store = await Store.findByPk(storeId);
    if (!store || !store.isActive) throw new CustomError('得意先が見つかりません', 404);

    const existing = await ProductStore.findOne({ where: { productId, storeId } });
    if (existing) throw new CustomError('この得意先には既に同じ商品が登録されています', 400);

    await ProductStore.create({ productId, storeId });
    return this.getProduct(productId);
  }

  async unlinkProductFromStore(productId: number, storeId: number) {
    await ProductStore.destroy({ where: { productId, storeId } });
  }

  // --- Categories ---
  async listCategories() {
    return Category.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
  }

  private async uniqueCategoryCode(name: string): Promise<string> {
    const base = name
      .replace(/[^\w\u3040-\u30ff\u4e00-\u9faf]+/g, '')
      .slice(0, 12)
      .toUpperCase() || 'CAT';
    let code = base.slice(0, 20);
    let n = 0;
    while (await Category.findOne({ where: { categoryCode: code } })) {
      n += 1;
      const suffix = String(n);
      code = `${base.slice(0, Math.max(1, 20 - suffix.length))}${suffix}`;
    }
    return code;
  }

  /** Replace full category list (order = array order). Renames keep IDs so product FKs stay valid. */
  async replaceCategories(names: string[]) {
    const unique: string[] = [];
    for (const raw of names) {
      const v = String(raw || '').trim().slice(0, 50);
      if (!v || unique.some((u) => u.toLowerCase() === v.toLowerCase())) continue;
      unique.push(v);
    }

    const existing = await Category.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] });

    // Same length → in-place rename / reorder by index (preserves category ids)
    if (existing.length === unique.length && existing.length > 0) {
      for (let i = 0; i < unique.length; i++) {
        const row = existing[i];
        await row.update({ name: unique[i], sortOrder: i });
      }
      return this.listCategories();
    }

    const byLower = new Map(existing.map((c) => [c.name.toLowerCase(), c]));
    const keep = new Set(unique.map((n) => n.toLowerCase()));

    for (const row of existing) {
      if (!keep.has(row.name.toLowerCase())) {
        await Product.update({ categoryId: null }, { where: { categoryId: row.id } });
        await row.destroy();
      }
    }

    for (let i = 0; i < unique.length; i++) {
      const name = unique[i];
      const found = byLower.get(name.toLowerCase());
      if (found && keep.has(name.toLowerCase())) {
        await found.update({ name, sortOrder: i });
      } else if (!byLower.has(name.toLowerCase())) {
        await Category.create({
          name,
          categoryCode: await this.uniqueCategoryCode(name),
          sortOrder: i,
        });
      }
    }

    const refreshed = await Category.findAll();
    for (let i = 0; i < unique.length; i++) {
      const row = refreshed.find((c) => c.name.toLowerCase() === unique[i].toLowerCase());
      if (row) await row.update({ name: unique[i], sortOrder: i });
    }

    return this.listCategories();
  }

  async createCategory(data: Partial<Category>) {
    return Category.create(data as Category);
  }

  // --- Products ---
  private productIncludes(storeId?: number) {
    return [
      {
        model: Store,
        as: 'stores',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        ...(storeId
          ? { where: { id: storeId }, required: true }
          : { required: false }),
      },
      { model: Category, as: 'category', attributes: ['id', 'name', 'categoryCode'] },
      { model: LookupOption, as: 'unitOption', attributes: ['id', 'value', 'kind'] },
      { model: LookupOption, as: 'specOption', attributes: ['id', 'value', 'kind'] },
      { model: Supplier, as: 'suppliers', through: { attributes: [] }, attributes: ['id', 'name'] },
    ];
  }

  private async resolveCategoryId(data: Record<string, unknown>): Promise<number | null | undefined> {
    if (data.categoryId != null && data.categoryId !== '') {
      const id = Number(data.categoryId);
      const cat = await Category.findByPk(id);
      if (!cat) throw new CustomError('カテゴリが見つかりません', 400);
      return id;
    }
    if (typeof data.categoryLabel === 'string' && data.categoryLabel.trim()) {
      const label = data.categoryLabel.trim();
      let cat = await Category.findOne({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: label } },
            { categoryCode: { [Op.iLike]: label } },
          ],
        },
      });
      if (!cat) {
        const code = `C${Date.now().toString(36).slice(-6)}`.toUpperCase();
        cat = await Category.create({
          categoryCode: code.slice(0, 20),
          name: label.slice(0, 50),
          sortOrder: 100,
        });
      }
      return cat.id;
    }
    if ('categoryId' in data || 'categoryLabel' in data) return null;
    return undefined;
  }

  private async resolveUnitOptionId(data: Record<string, unknown>): Promise<number | undefined> {
    if (data.unitOptionId != null && data.unitOptionId !== '') {
      const id = Number(data.unitOptionId);
      const opt = await LookupOption.findByPk(id);
      if (!opt || opt.kind !== 'unit') throw new CustomError('単位が見つかりません', 400);
      return id;
    }
    if (typeof data.unit === 'string' && data.unit.trim()) {
      const value = data.unit.trim();
      let opt = await LookupOption.findOne({ where: { kind: 'unit', value } });
      if (!opt) {
        opt = await LookupOption.create({ kind: 'unit', value, sortOrder: 50, isActive: true });
      }
      return opt.id;
    }
    return undefined;
  }

  private async resolveSpecOptionId(
    data: Record<string, unknown>,
    unitOptionId?: number
  ): Promise<number | null | undefined> {
    if (data.specOptionId != null && data.specOptionId !== '') {
      const id = Number(data.specOptionId);
      const opt = await LookupOption.findByPk(id);
      if (!opt || opt.kind !== 'spec') throw new CustomError('規格が見つかりません', 400);
      return id;
    }
    if (typeof data.spec === 'string') {
      const value = data.spec.trim();
      if (!value) return null;
      let opt = await LookupOption.findOne({ where: { kind: 'spec', value } });
      if (!opt) {
        opt = await LookupOption.create({
          kind: 'spec',
          value,
          relatedUnitId: unitOptionId || null,
          sortOrder: 50,
          isActive: true,
        });
      } else if (unitOptionId && !opt.relatedUnitId) {
        await opt.update({ relatedUnitId: unitOptionId });
      }
      return opt.id;
    }
    if ('specOptionId' in data || 'spec' in data) return null;
    return undefined;
  }

  private async resolveProductFields(data: Record<string, unknown>) {
    const unitOptionId = await this.resolveUnitOptionId(data);
    const specOptionId = await this.resolveSpecOptionId(data, unitOptionId);
    const categoryId = await this.resolveCategoryId(data);

    const {
      storeId: _s,
      productId: _p,
      supplierIds: _sup,
      unit: _u,
      spec: _sp,
      categoryLabel: _cl,
      unitOptionId: _uo,
      specOptionId: _so,
      categoryId: _ci,
      ...rest
    } = data;

    const fields: Record<string, unknown> = { ...rest };
    if (unitOptionId !== undefined) fields.unitOptionId = unitOptionId;
    if (specOptionId !== undefined) fields.specOptionId = specOptionId;
    if (categoryId !== undefined) fields.categoryId = categoryId;
    return fields;
  }

  async listProducts(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where: Record<string, unknown> = { isActive: true, ...searchCondition(['name', 'productCode'], search) };
    if (query.categoryId) where.categoryId = query.categoryId;
    const storeId = query.storeId ? Number(query.storeId) : undefined;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: this.productIncludes(storeId),
      ...pageWindow(page, limit),
      order: [[sortBy, sortOrder]],
      distinct: true,
    });
    return buildPagination(toProductDtoList(rows), count, page, limit);
  }

  /** Catalog search for linking an existing product to a store. */
  async searchProductCatalog(query: Record<string, unknown>) {
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    const excludeStoreId = query.excludeStoreId ? Number(query.excludeStoreId) : undefined;
    const rawLimit = Number(query.limit);
    const take = !Number.isNaN(rawLimit) && rawLimit > 0 ? rawLimit : undefined;

    const where: Record<string, unknown> = {
      isActive: true,
      ...searchCondition(['name', 'productCode'], search || undefined),
    };

    if (excludeStoreId) {
      const linked = await ProductStore.findAll({
        where: { storeId: excludeStoreId },
        attributes: ['productId'],
      });
      const linkedIds = linked.map((r) => r.productId);
      if (linkedIds.length) {
        where.id = { [Op.notIn]: linkedIds };
      }
    }

    const rows = await Product.findAll({
      where,
      include: [
        { model: Store, as: 'stores', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Category, as: 'category', attributes: ['id', 'name', 'categoryCode'] },
        { model: LookupOption, as: 'unitOption', attributes: ['id', 'value', 'kind'] },
        { model: LookupOption, as: 'specOption', attributes: ['id', 'value', 'kind'] },
      ],
      order: [['name', 'ASC'], ['id', 'ASC']],
      ...(take ? { limit: take } : {}),
    });
    return toProductDtoList(rows);
  }

  async getProduct(id: number) {
    const item = await Product.findByPk(id, {
      include: this.productIncludes(),
    });
    if (!item) throw new CustomError('商品が見つかりません', 404);
    return toProductDto(item);
  }

  async createProduct(data: Record<string, unknown>, supplierIds?: number[]) {
    const storeId = data.storeId != null ? Number(data.storeId) : undefined;
    const existingProductId = data.productId != null ? Number(data.productId) : undefined;

    if (existingProductId) {
      if (!storeId) throw new CustomError('得意先を指定してください', 400);
      return this.linkProductToStore(existingProductId, storeId);
    }

    const fields = await this.resolveProductFields(data);
    const name = typeof fields.name === 'string' ? fields.name.trim() : '';
    if (!name) throw new CustomError('品名は必須です', 400);

    if (fields.unitOptionId == null) {
      throw new CustomError('単位は必須です', 400);
    }

    const existing = await Product.findOne({
      where: {
        isActive: true,
        name: { [Op.iLike]: name },
      },
    });
    if (existing) {
      if (storeId) {
        const linked = await ProductStore.findOne({
          where: { productId: existing.id, storeId },
        });
        if (linked) throw new CustomError('この得意先には既に同じ商品が登録されています', 400);
        await ProductStore.create({ productId: existing.id, storeId });
        return this.getProduct(existing.id);
      }
      throw new CustomError('同じ品名の商品が既に登録されています', 400);
    }

    const product = await Product.create({
      ...fields,
      name,
      productCode: '_pending_',
      isActive: true,
    } as Product);
    await product.update({ productCode: String(product.id) });

    if (storeId) {
      await ProductStore.create({ productId: product.id, storeId });
    }
    if (supplierIds?.length) {
      await ProductSupplier.bulkCreate(
        supplierIds.map((supplierId, i) => ({ productId: product.id, supplierId, sortOrder: i }))
      );
    }
    return this.getProduct(product.id);
  }

  async updateProduct(id: number, data: Record<string, unknown>, supplierIds?: number[]) {
    const item = await Product.findByPk(id);
    if (!item) throw new CustomError('商品が見つかりません', 404);
    const fields = await this.resolveProductFields(data);
    await item.update(fields);
    if (supplierIds) {
      await ProductSupplier.destroy({ where: { productId: id } });
      if (supplierIds.length) {
        await ProductSupplier.bulkCreate(
          supplierIds.map((supplierId, i) => ({ productId: id, supplierId, sortOrder: i }))
        );
      }
    }
    return this.getProduct(id);
  }

  async deleteProduct(id: number, storeId?: number) {
    const item = await Product.findByPk(id);
    if (!item) throw new CustomError('商品が見つかりません', 404);

    if (storeId) {
      await ProductStore.destroy({ where: { productId: id, storeId } });
      const remaining = await ProductStore.count({ where: { productId: id } });
      if (remaining === 0) {
        await item.update({ isActive: false });
      }
      return;
    }

    await ProductStore.destroy({ where: { productId: id } });
    await item.update({ isActive: false });
  }

  async getAllActiveSuppliers() {
    return Supplier.findAll({ where: { isActive: true }, order: [['id', 'ASC']] });
  }

  async getAllActiveStores() {
    return Store.findAll({ where: { isActive: true }, order: [['id', 'ASC']] });
  }
}

export default new MasterService();
