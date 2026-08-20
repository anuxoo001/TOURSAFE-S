import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  reportIncident,
  getIncidents,
  getIncident,
  updateIncidentStatus,
  deleteIncident,
} from '../controllers/incidentController.js';

const router = Router();

router.post('/', protect, reportIncident);
router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncident);
router.put('/:id/status', protect, authorize('authority', 'admin'), updateIncidentStatus);
router.delete('/:id', protect, authorize('authority', 'admin'), deleteIncident);

export default router;