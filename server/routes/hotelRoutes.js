import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  listHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  createBooking,
  myBookings,
  getAllBookings,
  updateBookingStatus,
} from '../controllers/hotelController.js';

const router = Router();

router.get('/', protect, listHotels);
router.get('/bookings/mine', protect, myBookings);
router.get('/bookings', protect, authorize('authority', 'admin'), getAllBookings);
router.get('/:id', protect, getHotel);

router.post('/', protect, authorize('authority', 'admin'), createHotel);
router.put('/:id', protect, authorize('authority', 'admin'), updateHotel);
router.delete('/:id', protect, authorize('authority', 'admin'), deleteHotel);

router.post('/:id/book', protect, createBooking);
router.put('/bookings/:id/status', protect, authorize('authority', 'admin'), updateBookingStatus);

export default router;