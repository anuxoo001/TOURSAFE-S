import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getNearbyServices,
  createService,
  deleteService,
} from '../controllers/emergencyController.js';

const router = Router();

router.get('/', protect, getNearbyServices);
router.post('/', protect, authorize('authority', 'admin'), createService);
router.delete('/:id', protect, authorize('authority', 'admin'), deleteService);

export default router;