import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createBroadcast,
  getBroadcasts,
  getAllBroadcastsAdmin,
  toggleBroadcast,
  deleteBroadcast,
} from '../controllers/broadcastController.js';

const router = Router();

router.post('/', protect, authorize('authority', 'admin'), createBroadcast);
router.get('/', protect, getBroadcasts);
router.get('/all', protect, authorize('authority', 'admin'), getAllBroadcastsAdmin);
router.put('/:id/toggle', protect, authorize('authority', 'admin'), toggleBroadcast);
router.delete('/:id', protect, authorize('authority', 'admin'), deleteBroadcast);

export default router;