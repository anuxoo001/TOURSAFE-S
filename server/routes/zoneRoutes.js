import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getZones, createZone, updateZone, deleteZone } from '../controllers/zoneController.js';

const router = Router();

router.get('/', protect, getZones);
router.post('/', protect, authorize('authority', 'admin'), createZone);
router.put('/:id', protect, authorize('authority', 'admin'), updateZone);
router.delete('/:id', protect, authorize('authority', 'admin'), deleteZone);

export default router;