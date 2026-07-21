import { Router } from 'express';
import * as master from '@/controllers/masterController';
import { purchaseAccess, salesAccess, readOnlySales, adminOnly } from '@/middlewares/authorize';

const router = Router();

router.get('/lookup', readOnlySales, master.getLookupData);

router.get('/suppliers', readOnlySales, master.listSuppliers);
router.post('/suppliers', purchaseAccess, master.createSupplier);
router.put('/suppliers/:id', purchaseAccess, master.updateSupplier);
router.delete('/suppliers/:id', purchaseAccess, master.deleteSupplier);

router.get('/stores', readOnlySales, master.listStores);
router.post('/stores', purchaseAccess, master.createStore);
router.put('/stores/:id', purchaseAccess, master.updateStore);
router.delete('/stores/:id', purchaseAccess, master.deleteStore);

router.get('/categories', readOnlySales, master.listCategories);
router.put('/categories', purchaseAccess, master.replaceCategories);

router.get('/customers', salesAccess, master.listCustomers);
router.get('/customers/:id', salesAccess, master.getCustomer);
router.post('/customers', salesAccess, master.createCustomer);
router.put('/customers/:id', salesAccess, master.updateCustomer);
router.delete('/customers/:id', salesAccess, master.deleteCustomer);

router.get('/products', readOnlySales, master.listProducts);
router.get('/products/catalog', readOnlySales, master.searchProductCatalog);
router.get('/products/:id', readOnlySales, master.getProduct);
router.post('/products', purchaseAccess, master.createProduct);
router.put('/products/:id', purchaseAccess, master.updateProduct);
router.delete('/products/:id', purchaseAccess, master.deleteProduct);

export default router;
