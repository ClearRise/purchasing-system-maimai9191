import { Router } from 'express';
import * as ctrl from '@/controllers/purchasePriceController';
import { purchaseAccess, readOnlySales } from '@/middlewares/authorize';

const router = Router();

router.get('/grid', readOnlySales, ctrl.getPriceGrid);
router.get('/compare', readOnlySales, ctrl.getCompareMatrix);
router.post('/bulk', purchaseAccess, ctrl.bulkSavePrices);

export default router;
