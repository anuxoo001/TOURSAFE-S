import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS } from '../constants.js';
import { fmtDate } from '../utils/format.js';

const BookingsManagement = () => {
  const { pushToast } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/hotels/bookings');
      setBookings(data.bookings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (b, status, note) => {
    try {
      await api.put(`/hotels/bookings/${b._id}/status`, { status, adminNote: note });
      pushToast('Booking updated', `${b.hotel?.name} → ${BOOKING_STATUS_LABELS[status]}`, status === 'cancelled' ? 'red' : 'blue');
      load();
    } catch {
      // ignore
    }
  };

  const cancel = async (b) => {
    const note = window.prompt('Cancellation reason (optional):', '');
    if (note === null) return;
    await updateStatus(b, BOOKING_STATUS.CANCELLED, note);
  };

  const stats = {
    pending: bookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length,
    confirmed: bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
    cancelled: bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED).length,
    revenue: bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).reduce((s, b) => s + b.totalPrice, 0),
  };

  return (
    <div className="container">
      <h1 className="mb-1">🛏️ Hotel Bookings</h1>
      <p className="text-muted mb-3">Approve, cancel or track tourist hotel bookings.</p>

      <div className="grid grid-4 mb-3">
        <div className="card stat">
          <div className="value">{stats.pending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.confirmed}</div>
          <div className="label">Confirmed</div>
        </div>
        <div className="card stat">
          <div className="value">{stats.cancelled}</div>
          <div className="label">Cancelled</div>
        </div>
        <div className="card stat">
          <div className="value">₹{stats.revenue}</div>
          <div className="label">Revenue</div>
        </div>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card empty-state">
          <p>No bookings yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {bookings.map((b) => (
            <div className="card" key={b._id}>
              <div className="flex-between wrap gap-1" style={{ alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{b.hotel?.name}</h3>
                  <p className="text-sm text-muted mt-1">
                    👤 {b.tourist?.name} · {b.tourist?.email} · {b.tourist?.phone || '—'}
                  </p>
                </div>
                <span className={`badge badge-${BOOKING_STATUS_CLASS[b.status]}`}>{BOOKING_STATUS_LABELS[b.status]}</span>
              </div>
              <div className="grid grid-3 text-sm mt-2" style={{ gap: '0.75rem' }}>
                <div>
                  <div className="text-muted">Stay</div>
                  <strong>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</strong>
                </div>
                <div>
                  <div className="text-muted">Guests · Nights · Total</div>
                  <strong>{b.guests} · {b.nights} · ₹{b.totalPrice}</strong>
                </div>
                <div>
                  <div className="text-muted">Requested</div>
                  <strong>{fmtDate(b.createdAt)}</strong>
                </div>
              </div>
              {b.adminNote && <div className="text-sm mt-2" style={{ color: 'var(--primary)' }}>Note: {b.adminNote}</div>}
              <div className="flex gap-1 mt-2 wrap">
                {b.status === BOOKING_STATUS.PENDING && (
                  <>
                    <button className="btn btn-sm" onClick={() => updateStatus(b, BOOKING_STATUS.CONFIRMED)}>✅ Confirm</button>
                    <button className="btn btn-sm btn-danger" onClick={() => cancel(b)}>❌ Cancel</button>
                  </>
                )}
                {b.status === BOOKING_STATUS.CONFIRMED && (
                  <>
                    <button className="btn btn-sm btn-outline" onClick={() => updateStatus(b, BOOKING_STATUS.COMPLETED)}>✔ Mark Completed</button>
                    <button className="btn btn-sm btn-danger" onClick={() => cancel(b)}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;