import { Router } from 'express';
import { login, getMe, registerAdmin, updateProfile, changePassword } from '../controllers/authController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', protect, adminOnly, registerAdmin); // Admin only — protected
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

export default router;
