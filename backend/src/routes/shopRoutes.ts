import { Router } from 'express';
import {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getAllBalances,
  getShopBalance,
  updateShopPassword,
} from '../controllers/shopController';
import { getOrdersByShop } from '../controllers/orderController';
import { getPaymentsByShop } from '../controllers/paymentController';
import { getShopLedger } from '../controllers/ledgerController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin: all shops & balances
router.get('/', adminOnly, getAllShops);
router.post('/', adminOnly, createShop);

// Balances (admin)
// NOTE: /balances route is registered in main app to avoid conflict

// Individual shop
router.get('/:id', getShopById);
router.put('/:id', adminOnly, updateShop);
router.delete('/:id', adminOnly, deleteShop);

// Update shop password
router.put('/:shopId/password', adminOnly, updateShopPassword);

// Shop balance
router.get('/:shopId/balance', getShopBalance);

// Shop orders
router.get('/:shopId/orders', getOrdersByShop);

// Shop payments
router.get('/:shopId/payments', getPaymentsByShop);

// Shop ledger
router.get('/:shopId/ledger', getShopLedger);

export default router;
