import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createPayment,
  getPayments,
  updatePaymentStatus,
  getUserPayments,
  getGroupPayments,
  confirmPayment,
} from '../controllers/payment.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createPayment as any);
router.get('/', getPayments as any);
router.get('/user', getUserPayments as any);
router.get('/group/:groupId', getGroupPayments as any);
router.put('/:id/status', updatePaymentStatus as any);
router.put('/:id/confirm', confirmPayment as any);

export default router;
