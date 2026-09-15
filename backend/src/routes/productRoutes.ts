import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
} from '../controllers/productController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', adminOnly, createProduct);
router.put('/:id', adminOnly, updateProduct);

export default router;
