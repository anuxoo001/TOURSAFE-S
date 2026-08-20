import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequest,
  updateRequestStatus,
  deleteRequest,
} from '../controllers/requestController.js';

const router = Router();

router.post('/', protect, createRequest);
router.get('/mine', protect, getMyRequests);
router.get('/', protect, authorize('authority', 'admin'), getAllRequests);
router.get('/:id', protect, getRequest);
router.put('/:id/status', protect, authorize('authority', 'admin'), updateRequestStatus);
router.delete('/:id', protect, authorize('authority', 'admin'), deleteRequest);

export default router;