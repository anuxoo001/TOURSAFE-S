import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  triggerSOS,
  cancelSOS,
  getSOSStatus,
  getActiveSOS,
  getSOSLogs,
  acknowledgeSOS,
  resolveSOS,
} from '../controllers/sosController.js';

const router = Router();

router.post('/', protect, triggerSOS);
router.post('/cancel', protect, cancelSOS);
router.get('/status', protect, getSOSStatus);
router.get('/active', protect, getActiveSOS);
router.get('/logs', protect, authorize('authority', 'admin'), getSOSLogs);
router.put('/:id/acknowledge', protect, authorize('authority', 'admin'), acknowledgeSOS);
router.put('/:id/resolve', protect, authorize('authority', 'admin'), resolveSOS);

export default router;