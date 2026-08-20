import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS, HOTEL_TYPE_LABELS } from '../constants.js';
import { fmtDate, fmtDateTime } from '../utils/format.js';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/hotels/bookings/mine');
        setBookings(data.bookings);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <h1 className="mb-1">🛏️ My Bookings</h1>
      <p className="text-muted mb-3">Your hotel booking requests and their confirmation status.</p>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card empty-state">
          <p>You have no bookings yet.</p>
          <Link to="/user/hotels" className="btn mt-2">Browse Hotels</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {bookings.map((b) => (
            <div className="card" key={b._id}>
              <div className="flex-between wrap gap-1" style={{ alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{b.hotel?.name}</h3>
                  <p className="text-sm text-muted mt-1">
                    {b.hotel ? HOTEL_TYPE_LABELS[b.hotel.type] : ''} · {b.hotel?.address}
                  </p>
                </div>
                <span className={`badge badge-${BOOKING_STATUS_CLASS[b.status]}`}>{BOOKING_STATUS_LABELS[b.status]}</span>
              </div>
              <div className="grid grid-3 text-sm mt-2" style={{ gap: '0.75rem' }}>
                <div>
                  <div className="text-muted">Check-in</div>
                  <strong>{fmtDate(b.checkIn)}</strong>
                </div>
                <div>
                  <div className="text-muted">Check-out</div>
                  <strong>{fmtDate(b.checkOut)}</strong>
                </div>
                <div>
                  <div className="text-muted">Guests · Nights · Total</div>
                  <strong>{b.guests} · {b.nights} · ₹{b.totalPrice}</strong>
                </div>
              </div>
              {b.adminNote && <div className="text-sm mt-2" style={{ color: 'var(--primary)' }}>Note: {b.adminNote}</div>}
              <div className="text-sm text-muted mt-1">Requested {fmtDateTime(b.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;