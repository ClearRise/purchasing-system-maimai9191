import { Op } from 'sequelize';
import {
  Supplier,
  Store,
  Customer,
  Category,
  Product,
  ProductStore,
  ProductSupplier,
  CustomerStore,
  LookupOption,
} from '@/models';
import CustomError from '@/utils/customError';
import { buildPagination, parsePagination, searchCondition } from '@/utils/pagination';
import { toProductDto, toProductDtoList } from '@/utils/productDto';

class MasterService {
  // --- Suppliers ---
  async listSuppliers(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where = { isActive: true, ...searchCondition(['name', 'shortName'], search) };
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
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

  // --- Stores ---
  async listStores(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where = { isActive: true, ...searchCondition(['name', 'groupName'], search) };
    const { count, rows } = await Store.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder]],
    });
    return buildPagination(rows, count, page, limit);
  }

  async createStore(data: Partial<Store>) {
    return Store.create({ ...data, isActive: true } as Store);
  }

  async updateStore(id: number, data: Partial<Store>) {
    const item = await Store.findByPk(id);
    if (!item) throw new CustomError('店舗が見つかりません', 404);
    await item.update(data);
    return item;
  }

  async deleteStore(id: number) {
    const item = await Store.findByPk(id);
    if (!item) throw new CustomError('店舗が見つかりません', 404);
    await item.update({ isActive: false });
  }

  // --- Categories ---
  async listCategories() {
    return Category.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
  }

  async createCategory(data: Partial<Category>) {
    return Category.create(data as Category);
  }

  // --- Customers ---
  async listCustomers(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where: Record<string, unknown> = { isActive: true, ...searchCondition(['name', 'nameKana'], search) };
    if (query.rank) where.rank = query.rank;
    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [{ model: Store, as: 'stores', through: { attributes: [] } }],
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder]],
    });
    return buildPagination(rows, count, page, limit);
  }

  async getCustomer(id: number) {
    const item = await Customer.findByPk(id, {
      include: [{ model: Store, as: 'stores', through: { attributes: [] } }],
    });
    if (!item) throw new CustomError('得意先が見つかりません', 404);
    return item;
  }

  async createCustomer(data: Record<string, unknown>, storeIds?: number[]) {
    const customer = await Customer.create({ ...data, isActive: true } as Customer);
    if (storeIds?.length) {
      await CustomerStore.bulkCreate(storeIds.map((storeId) => ({ customerId: customer.id, storeId })));
    }
    return this.getCustomer(customer.id);
  }

  async updateCustomer(id: number, data: Record<string, unknown>, storeIds?: number[]) {
    const item = await Customer.findByPk(id);
    if (!item) throw new CustomError('得意先が見つかりません', 404);
    await item.update(data);
    if (storeIds) {
      await CustomerStore.destroy({ where: { customerId: id } });
      if (storeIds.length) {
        await CustomerStore.bulkCreate(storeIds.map((storeId) => ({ customerId: id, storeId })));
      }
    }
    return this.getCustomer(id);
  }

  async deleteCustomer(id: number) {
    const item = await Customer.findByPk(id);
    if (!item) throw new CustomError('得意先が見つかりません', 404);
    await item.update({ isActive: false });
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
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder]],
      distinct: true,
    });
    return buildPagination(toProductDtoList(rows), count, page, limit);
  }

  /** Catalog search for linking an existing product to a store. */
  async searchProductCatalog(query: Record<string, unknown>) {
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    const excludeStoreId = query.excludeStoreId ? Number(query.excludeStoreId) : undefined;
    const limit = Math.min(Number(query.limit) || 30, 100);

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
      limit,
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

  async linkProductToStore(productId: number, storeId: number) {
    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) throw new CustomError('商品が見つかりません', 404);
    const store = await Store.findByPk(storeId);
    if (!store || !store.isActive) throw new CustomError('店舗が見つかりません', 404);

    const existing = await ProductStore.findOne({ where: { productId, storeId } });
    if (existing) throw new CustomError('この店舗には既に同じ商品が登録されています', 400);

    await ProductStore.create({ productId, storeId });
    return this.getProduct(productId);
  }

  async createProduct(data: Record<string, unknown>, supplierIds?: number[]) {
    const storeId = data.storeId != null ? Number(data.storeId) : undefined;
    const existingProductId = data.productId != null ? Number(data.productId) : undefined;

    if (existingProductId) {
      if (!storeId) throw new CustomError('店舗を指定してください', 400);
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
        if (linked) throw new CustomError('この店舗には既に同じ商品が登録されています', 400);
        await ProductStore.create({ productId: existing.id, storeId });
      }
      return this.getProduct(existing.id);
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
