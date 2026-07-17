import { Router } from 'express';
import * as ctrl from '@/controllers/dashboardController';
import { adminOnly } from '@/middlewares/authorize';

const router = Router();

router.get('/rank-margins', adminOnly, ctrl.getRankMargins);
router.put('/rank-margins/:rank', adminOnly, ctrl.updateRankMargin);
router.get('/settings', adminOnly, ctrl.getSystemSettings);
router.put('/settings', adminOnly, ctrl.updateSystemSettings);
router.get('/lookup-options/:kind', adminOnly, ctrl.getLookupOptions);
router.put('/lookup-options/:kind', adminOnly, ctrl.replaceLookupOptions);

export default router;
