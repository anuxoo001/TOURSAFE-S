import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyNotifications,
  markRead,
  markAllRead,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', protect, getMyNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);

export default router;