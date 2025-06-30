import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createExpense,
  getGroupExpenses,
  updateExpense,
  markSplitAsPaid,
  getUserExpenses,
} from '../controllers/expense.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createExpense as any);
router.get('/user', getUserExpenses as any);
router.get('/group/:groupId', getGroupExpenses as any);
router.put('/:id', updateExpense as any);
router.post('/:expenseId/mark-paid', markSplitAsPaid as any);

export default router;
