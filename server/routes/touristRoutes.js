import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getTouristId,
  verifyTouristId,
  getMyLocation,
  getAllTourists,
  getTouristHistory,
} from '../controllers/touristController.js';

const router = Router();

router.get('/id', protect, getTouristId);
router.get('/verify/:touristId', verifyTouristId);
router.get('/me/location', protect, getMyLocation);
router.get('/', protect, authorize('authority', 'admin'), getAllTourists);
router.get('/:id/history', protect, authorize('authority', 'admin'), getTouristHistory);

export default router;