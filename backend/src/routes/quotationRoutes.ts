import { Router } from 'express';
import * as ctrl from '@/controllers/quotationController';
import { salesAccess } from '@/middlewares/authorize';

const router = Router();

router.get('/', salesAccess, ctrl.listQuotations);
router.post('/simulate', salesAccess, ctrl.simulateQuotation);
router.get('/:id/pdf', salesAccess, ctrl.exportQuotationPdf);
router.get('/:id', salesAccess, ctrl.getQuotation);
router.post('/', salesAccess, ctrl.createQuotation);
router.put('/:id/lines', salesAccess, ctrl.updateQuotationLines);
router.patch('/:id/status', salesAccess, ctrl.updateQuotationStatus);
router.delete('/:id', salesAccess, ctrl.deleteQuotation);

export default router;
