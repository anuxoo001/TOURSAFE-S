import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getAnalytics, getSeverityStats } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', protect, authorize('authority', 'admin'), getAnalytics);
router.get('/severity', protect, authorize('authority', 'admin'), getSeverityStats);

export default router;