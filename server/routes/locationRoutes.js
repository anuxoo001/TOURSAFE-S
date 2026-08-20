import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { updateLocation, getLivePositions } from '../controllers/locationController.js';

const router = Router();

router.put('/', protect, updateLocation);
router.get('/live', protect, authorize('authority', 'admin'), getLivePositions);

export default router;