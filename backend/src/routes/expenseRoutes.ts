import { Router } from 'express';
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from '../controllers/expenseController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect, adminOnly);

// Summary must be before /:id to avoid conflict
router.get('/summary', getExpenseSummary);

router.get('/', getAllExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
