import { Request, Response } from 'express';
import masterService from '@/services/masterService';
import logger from '@/utils/logger';

const handle = (fn: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error: any) {
      logger.error(error);
      res.status(error.statusCode || 500).json({ success: false, message: error.message || 'エラーが発生しました' });
    }
  };

export const listSuppliers = handle(async (req, res) => {
  const data = await masterService.listSuppliers(req.query);
  res.json({ success: true, data });
});

export const createSupplier = handle(async (req, res) => {
  const data = await masterService.createSupplier(req.body);
  res.status(201).json({ success: true, message: '発注先を登録しました', data });
});

export const updateSupplier = handle(async (req, res) => {
  const data = await masterService.updateSupplier(Number(req.params.id), req.body);
  res.json({ success: true, message: '発注先を更新しました', data });
});

export const deleteSupplier = handle(async (req, res) => {
  await masterService.deleteSupplier(Number(req.params.id));
  res.json({ success: true, message: '発注先を削除しました' });
});

export const listStores = handle(async (req, res) => {
  const data = await masterService.listStores(req.query);
  res.json({ success: true, data });
});

export const createStore = handle(async (req, res) => {
  const data = await masterService.createStore(req.body);
  res.status(201).json({ success: true, message: '店舗を登録しました', data });
});

export const updateStore = handle(async (req, res) => {
  const data = await masterService.updateStore(Number(req.params.id), req.body);
  res.json({ success: true, message: '店舗を更新しました', data });
});

export const deleteStore = handle(async (req, res) => {
  await masterService.deleteStore(Number(req.params.id));
  res.json({ success: true, message: '店舗を削除しました' });
});

export const listCategories = handle(async (_req, res) => {
  const data = await masterService.listCategories();
  res.json({ success: true, data });
});

export const listCustomers = handle(async (req, res) => {
  const data = await masterService.listCustomers(req.query);
  res.json({ success: true, data });
});

export const getCustomer = handle(async (req, res) => {
  const data = await masterService.getCustomer(Number(req.params.id));
  res.json({ success: true, data });
});

export const createCustomer = handle(async (req, res) => {
  const { storeIds, ...body } = req.body;
  const data = await masterService.createCustomer(body, storeIds);
  res.status(201).json({ success: true, message: '得意先を登録しました', data });
});

export const updateCustomer = handle(async (req, res) => {
  const { storeIds, ...body } = req.body;
  const data = await masterService.updateCustomer(Number(req.params.id), body, storeIds);
  res.json({ success: true, message: '得意先を更新しました', data });
});

export const deleteCustomer = handle(async (req, res) => {
  await masterService.deleteCustomer(Number(req.params.id));
  res.json({ success: true, message: '得意先を削除しました' });
});

export const listProducts = handle(async (req, res) => {
  const data = await masterService.listProducts(req.query);
  res.json({ success: true, data });
});

export const searchProductCatalog = handle(async (req, res) => {
  const data = await masterService.searchProductCatalog(req.query);
  res.json({ success: true, data });
});

export const getProduct = handle(async (req, res) => {
  const data = await masterService.getProduct(Number(req.params.id));
  res.json({ success: true, data });
});

export const createProduct = handle(async (req, res) => {
  const { supplierIds, ...body } = req.body;
  const data = await masterService.createProduct(body, supplierIds);
  const linked = Boolean(body.productId);
  res.status(201).json({
    success: true,
    message: linked ? '既存商品を店舗に追加しました' : '商品を登録しました',
    data,
  });
});

export const updateProduct = handle(async (req, res) => {
  const { supplierIds, ...body } = req.body;
  const data = await masterService.updateProduct(Number(req.params.id), body, supplierIds);
  res.json({ success: true, message: '商品を更新しました', data });
});

export const deleteProduct = handle(async (req, res) => {
  const storeId = req.query.storeId ? Number(req.query.storeId) : undefined;
  await masterService.deleteProduct(Number(req.params.id), storeId);
  res.json({
    success: true,
    message: storeId ? '店舗から商品を外しました' : '商品を削除しました',
  });
});

export const getLookupData = handle(async (_req, res) => {
  const lookupOptionService = (await import('@/services/lookupOptionService')).default;
  const [suppliers, stores, categories, options] = await Promise.all([
    masterService.getAllActiveSuppliers(),
    masterService.getAllActiveStores(),
    masterService.listCategories(),
    lookupOptionService.listGrouped(true),
  ]);
  res.json({
    success: true,
    data: {
      suppliers,
      stores,
      categories,
      units: options.units,
      specs: options.specs,
      specItems: options.specItems,
      specsByUnit: options.specsByUnit,
    },
  });
});
