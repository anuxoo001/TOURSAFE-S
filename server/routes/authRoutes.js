import { Router } from 'express';
import { register, login, getMe, updateProfile, registerAuthority } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/register/authority', registerAuthority);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;