import { Router } from 'express';
import { resetAllData } from '../controllers/resetController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// DELETE /api/admin/reset — admin only, wipes all data except admin accounts
router.delete('/reset', protect, adminOnly, resetAllData);

export default router;
