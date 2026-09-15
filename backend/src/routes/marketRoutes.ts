import { Router } from 'express';
import {
  getAllMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
  getMarketReport,
  getAllMarketsReport,
} from '../controllers/marketController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// All market routes require authentication
router.use(protect);

// GET /api/markets/report/all — combined report across all markets (must be before /:id)
router.get('/report/all', adminOnly, getAllMarketsReport);

// GET /api/markets
router.get('/', adminOnly, getAllMarkets);

// POST /api/markets
router.post('/', adminOnly, createMarket);

// GET /api/markets/:id
router.get('/:id', adminOnly, getMarketById);

// PUT /api/markets/:id
router.put('/:id', adminOnly, updateMarket);

// DELETE /api/markets/:id
router.delete('/:id', adminOnly, deleteMarket);

// GET /api/markets/:id/report?days=7
router.get('/:id/report', adminOnly, getMarketReport);

export default router;
