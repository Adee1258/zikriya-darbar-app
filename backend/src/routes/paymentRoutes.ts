import { Router } from 'express';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
} from '../controllers/paymentController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect);

// GET /api/payments — admin sees ALL payments from all shops
router.get('/', adminOnly, getAllPayments);

// POST /api/payments — admin records a payment for a shop
router.post('/', adminOnly, createPayment);

// GET /api/payments/:id
router.get('/:id', getPaymentById);

export default router;
