import { Router } from 'express';
import * as master from '@/controllers/masterController';
import { purchaseAccess, readOnlySales, authorize } from '@/middlewares/authorize';

const router = Router();

/** 得意先 (= stores) may be managed by purchase or sales */
const storeManage = authorize('admin', 'purchase', 'sales');

router.get('/lookup', readOnlySales, master.getLookupData);

router.get('/suppliers', readOnlySales, master.listSuppliers);
router.post('/suppliers', purchaseAccess, master.createSupplier);
router.put('/suppliers/:id', purchaseAccess, master.updateSupplier);
router.delete('/suppliers/:id', purchaseAccess, master.deleteSupplier);

router.get('/stores', readOnlySales, master.listStores);
router.get('/stores/:id', readOnlySales, master.getStore);
router.post('/stores', storeManage, master.createStore);
router.put('/stores/:id', storeManage, master.updateStore);
router.delete('/stores/:id', storeManage, master.deleteStore);
router.put('/stores/:id/products', storeManage, master.replaceStoreProducts);

router.get('/categories', readOnlySales, master.listCategories);
router.put('/categories', purchaseAccess, master.replaceCategories);

router.get('/products', readOnlySales, master.listProducts);
router.get('/products/catalog', readOnlySales, master.searchProductCatalog);
router.get('/products/:id', readOnlySales, master.getProduct);
router.post('/products', purchaseAccess, master.createProduct);
router.put('/products/:id', purchaseAccess, master.updateProduct);
router.delete('/products/:id', purchaseAccess, master.deleteProduct);

export default router;
