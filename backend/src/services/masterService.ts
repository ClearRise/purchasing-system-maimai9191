import { Op } from 'sequelize';
import {
  Supplier,
  Store,
  Customer,
  Category,
  Product,
  ProductSupplier,
  CustomerStore,
} from '@/models';
import CustomError from '@/utils/customError';
import { buildPagination, parsePagination, searchCondition } from '@/utils/pagination';

class MasterService {
  // --- Suppliers ---
  async listSuppliers(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where = { isActive: true, ...searchCondition(['name', 'shortName'], search) };
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy || 'name', sortOrder || 'DESC']],
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
    const where = { isActive: true, ...searchCondition(['name', 'storeCode', 'groupName'], search) };
    const { count, rows } = await Store.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy || 'name', sortOrder || 'DESC']],
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
    return Category.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
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
      order: [[sortBy || 'name', sortOrder || 'DESC']],
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
  async listProducts(query: Record<string, unknown>) {
    const { page, limit, search, sortBy, sortOrder } = parsePagination(query);
    const where: Record<string, unknown> = { isActive: true, ...searchCondition(['name', 'productCode'], search) };
    if (query.storeId) where.storeId = query.storeId;
    if (query.categoryId) where.categoryId = query.categoryId;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'storeCode'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'categoryCode'] },
        { model: Supplier, as: 'suppliers', through: { attributes: [] }, attributes: ['id', 'name'] },
      ],
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy || 'id', sortOrder || 'ASC'], ['name', 'ASC']],
    });
    return buildPagination(rows, count, page, limit);
  }

  async getProduct(id: number) {
    const item = await Product.findByPk(id, {
      include: [
        { model: Store, as: 'store' },
        { model: Supplier, as: 'suppliers', through: { attributes: ['sortOrder'] } },
      ],
    });
    if (!item) throw new CustomError('商品が見つかりません', 404);
    return item;
  }

  async createProduct(data: Record<string, unknown>, supplierIds?: number[]) {
    const product = await Product.create({ ...data, productCode: '_pending_', isActive: true } as Product);
    await product.update({ productCode: String(product.id) });
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
    await item.update(data);
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

  async deleteProduct(id: number) {
    const item = await Product.findByPk(id);
    if (!item) throw new CustomError('商品が見つかりません', 404);
    await item.update({ isActive: false });
  }

  async getAllActiveSuppliers() {
    return Supplier.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
  }

  async getAllActiveStores() {
    return Store.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
  }
}

export default new MasterService();
