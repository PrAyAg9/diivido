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

router.post('/', createPayment);
router.get('/', getPayments);
router.get('/user', getUserPayments);
router.get('/group/:groupId', getGroupPayments);
router.put('/:id/status', updatePaymentStatus);
router.put('/:id/confirm', confirmPayment);

export default router;
