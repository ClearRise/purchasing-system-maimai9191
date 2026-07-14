import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import masterRoutes from './masterRoutes';
import purchasePriceRoutes from './purchasePriceRoutes';
import quotationRoutes from './quotationRoutes';
import dashboardRoutes from './dashboardRoutes';
import settingsRoutes from './settingsRoutes';
import { isAuthenticated } from '@/middlewares/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', isAuthenticated, userRoutes);
router.use('/masters', isAuthenticated, masterRoutes);
router.use('/purchase-prices', isAuthenticated, purchasePriceRoutes);
router.use('/quotations', isAuthenticated, quotationRoutes);
router.use('/dashboard', isAuthenticated, dashboardRoutes);
router.use('/admin', isAuthenticated, settingsRoutes);

export default router;
