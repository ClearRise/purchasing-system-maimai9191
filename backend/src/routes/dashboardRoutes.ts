import { Router } from 'express';
import * as ctrl from '@/controllers/dashboardController';
import { readOnlySales, adminOnly } from '@/middlewares/authorize';

const router = Router();

router.get('/summary', readOnlySales, ctrl.getDashboardSummary);

export default router;
