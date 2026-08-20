import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { HOTEL_TYPE_LABELS, BOOKING_STATUS_LABELS } from '../constants.js';

const ZONE_STYLE = {
  green: { label: 'SAFE ZONE', cls: 'badge-green', color: '#16a34a', bg: '#dcfce7' },
  yellow: { label: 'CAUTION ZONE', cls: 'badge-yellow', color: '#ca8a04', bg: '#fef9c3' },
  red: { label: 'DANGER ZONE', cls: 'badge-red', color: '#dc2626', bg: '#fee2e2' },
};

const Hotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [booking, setBooking] = useState(null);
  const [dates, setDates] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/hotels');
        setHotels(data.hotels);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = filter === 'all' ? hotels : hotels.filter((h) => h.zone?.level === filter);

  const openBook = (hotel) => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
    const fmt = (d) => d.toISOString().split('T')[0];
    setDates({ checkIn: fmt(tomorrow), checkOut: fmt(new Date(tomorrow.getTime() + 2 * 24 * 3600 * 1000)), guests: 1 });
    setBookingError('');
    setBooking(hotel);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    if (!dates.checkIn || !dates.checkOut || new Date(dates.checkOut) <= new Date(dates.checkIn)) {
      setBookingError('Check-out must be after check-in.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/hotels/${booking._id}/book`, dates);
      setBooking(null);
      window.alert(`Booking request submitted! Status: ${BOOKING_STATUS_LABELS[data.booking.status]}. ${data.booking.nights} night(s) — ₹${data.booking.totalPrice}`);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nights =
    dates.checkIn && dates.checkOut && new Date(dates.checkOut) > new Date(dates.checkIn)
      ? Math.round((new Date(dates.checkOut) - new Date(dates.checkIn)) / (1000 * 60 * 60 * 24))
      : 0;

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <h1 className="mb-1">🏨 Hotels & Stays</h1>
      <p className="text-muted mb-3">
        Browse verified stays. Every hotel is checked against live safety zones — so you can choose a hotel in a{' '}
        <span style={{ color: '#16a34a', fontWeight: 600 }}>SAFE</span> zone and avoid{' '}
        <span style={{ color: '#dc2626', fontWeight: 600 }}>DANGER</span> zones.
      </p>

      <div className="flex gap-1 wrap mb-3">
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All</button>
        <button className={`btn btn-sm ${filter === 'green' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('green')}>🟢 Safe Zones</button>
        <button className={`btn btn-sm ${filter === 'yellow' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('yellow')}>🟡 Caution Zones</button>
        <button className={`btn btn-sm ${filter === 'red' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('red')}>🔴 Danger Zones</button>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <p>No hotels in this zone category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {filtered.map((h) => {
            const zs = h.zone ? ZONE_STYLE[h.zone.level] : null;
            return (
              <div className="card" key={h._id} style={{ borderLeft: `5px solid ${zs ? zs.color : 'var(--primary-light)'}` }}>
                <div className="flex-between wrap gap-1" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div className="flex-between wrap gap-1" style={{ alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>{h.name}</h3>
                      <span className={`badge ${zs ? zs.cls : 'badge-blue'}`} style={{ fontWeight: 700 }}>
                        {zs ? `${h.zone.level === 'red' ? '🔴' : h.zone.level === 'yellow' ? '🟡' : '🟢'} ${zs.label}` : 'NO ZONE DATA'}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {HOTEL_TYPE_LABELS[h.type]} · {h.address}
                    </p>
                    {zs && <p className="text-sm mt-1" style={{ color: zs.color }}>In: <strong>{h.zone.name}</strong></p>}
                    <p className="text-sm text-muted mt-1">{h.description}</p>
                    <div className="text-sm mt-1">
                      <span style={{ color: '#ca8a04' }}>{'★'.repeat(Math.round(h.rating))}{'☆'.repeat(5 - Math.round(h.rating))}</span>{' '}
                      <span className="text-muted">{h.rating.toFixed(1)}</span>
                      {h.phone && <span className="text-muted"> · 📞 <a href={`tel:${h.phone}`}>{h.phone}</a></span>}
                    </div>
                    {h.amenities?.length > 0 && (
                      <div className="flex gap-1 wrap mt-1">
                        {h.amenities.map((a) => (
                          <span key={a} className="badge badge-blue">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{h.pricePerNight}<span className="text-sm text-muted">/night</span></div>
                    <button
                      className={`btn btn-sm mt-2 ${h.zone?.level === 'red' ? 'btn-danger' : ''}`}
                      onClick={() => openBook(h)}
                      disabled={h.zone?.level === 'red'}
                    >
                      {h.zone?.level === 'red' ? '🚫 Not available' : 'Book Now'}
                    </button>
                    {h.zone?.level === 'red' && (
                      <p className="text-sm mt-1" style={{ color: '#dc2626' }}>Booking blocked in danger zone.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {booking && (
        <div className="modal-backdrop" onClick={() => setBooking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1">Book {booking.name}</h3>
            <p className="text-sm text-muted mb-2">
              ₹{booking.pricePerNight}/night · {nights || '—'} night(s) · Total: ₹{booking.pricePerNight * nights}
            </p>
            {bookingError && <div className="alert alert-red mb-2">{bookingError}</div>}
            <form onSubmit={submitBooking}>
              <div className="grid grid-2">
                <div className="mb-2">
                  <label className="label">Check-in *</label>
                  <input className="input" type="date" required value={dates.checkIn} onChange={(e) => setDates({ ...dates, checkIn: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="label">Check-out *</label>
                  <input className="input" type="date" required value={dates.checkOut} onChange={(e) => setDates({ ...dates, checkOut: e.target.value })} />
                </div>
              </div>
              <div className="mb-2">
                <label className="label">Guests</label>
                <input className="input" type="number" min="1" max="10" value={dates.guests} onChange={(e) => setDates({ ...dates, guests: Number(e.target.value) })} />
              </div>
              <div className="flex gap-1">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Confirm Booking'}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setBooking(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hotels;