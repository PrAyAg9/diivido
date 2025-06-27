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

router.post('/', createExpense);
router.get('/user', getUserExpenses);
router.get('/group/:groupId', getGroupExpenses);
router.put('/:id', updateExpense);
router.post('/:expenseId/mark-paid', markSplitAsPaid);

export default router;
