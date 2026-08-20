import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { HOTEL_TYPES, HOTEL_TYPE_LABELS, DEFAULT_CENTER } from '../constants.js';

const emptyForm = {
  name: '',
  type: HOTEL_TYPES.HOTEL,
  address: '',
  description: '',
  phone: '',
  pricePerNight: '',
  rating: 4.0,
  rooms: 10,
  amenities: '',
  lat: DEFAULT_CENTER[0],
  lng: DEFAULT_CENTER[1],
};

const ZONE_STYLE = {
  green: { label: 'SAFE ZONE', cls: 'badge-green' },
  yellow: { label: 'CAUTION ZONE', cls: 'badge-yellow' },
  red: { label: 'DANGER ZONE', cls: 'badge-red' },
};

const HotelsManagement = () => {
  const { pushToast } = useSocket();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.pricePerNight) {
      setError('Name and price per night are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        pricePerNight: Number(form.pricePerNight),
        rating: Number(form.rating) || 0,
        rooms: Number(form.rooms) || 1,
        lat: Number(form.lat),
        lng: Number(form.lng),
      };
      if (editing) {
        await api.put(`/hotels/${editing}`, payload);
        pushToast('Hotel updated', form.name, 'blue');
      } else {
        await api.post('/hotels', payload);
        pushToast('Hotel created', form.name, 'green');
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hotel');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (hotel) => {
    if (!window.confirm(`Delete hotel "${hotel.name}"?`)) return;
    try {
      await api.delete(`/hotels/${hotel._id}`);
      pushToast('Hotel deleted', hotel.name, 'gray');
      load();
    } catch {
      // ignore
    }
  };

  const toggleActive = async (hotel) => {
    try {
      await api.put(`/hotels/${hotel._id}`, { active: !hotel.active });
      load();
    } catch {
      // ignore
    }
  };

  const startEdit = (h) => {
    setEditing(h._id);
    setForm({
      name: h.name,
      type: h.type,
      address: h.address,
      description: h.description,
      phone: h.phone,
      pricePerNight: h.pricePerNight,
      rating: h.rating,
      rooms: h.rooms,
      amenities: (h.amenities || []).join(', '),
      lat: h.location.coordinates[1],
      lng: h.location.coordinates[0],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <div>
          <h1 className="mb-1">🏨 Hotel Management</h1>
          <p className="text-muted">Manage hotels. Each stay is automatically verified against safety zones for tourists.</p>
        </div>
        <button className="btn" onClick={() => { setShowForm((s) => !s); setEditing(null); setForm(emptyForm); setError(''); }}>
          {showForm ? '✕ Close' : '+ New Hotel'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <h3 className="mb-2">{editing ? 'Edit Hotel' : 'Create Hotel'}</h3>
          {error && <div className="alert alert-red mb-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="grid grid-2">
              <div className="mb-2">
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.values(HOTEL_TYPES).map((t) => (
                    <option key={t} value={t}>{HOTEL_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="label">Price / night (₹) *</label>
                <input className="input" type="number" min="0" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Rating (0-5)</label>
                <input className="input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Rooms</label>
                <input className="input" type="number" min="1" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Address</label>
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Amenities (comma separated)</label>
                <input className="input" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="Free WiFi, AC, Parking" />
              </div>
            </div>
            <div className="grid grid-3">
              <div className="mb-2">
                <label className="label">Latitude</label>
                <input className="input" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Longitude</label>
                <input className="input" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              </div>
              <div className="mb-2" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-outline btn-block" type="button" onClick={() => navigator.geolocation.getCurrentPosition((p) => setForm((f) => ({ ...f, lat: p.coords.latitude, lng: p.coords.longitude })))}>
                  📍 Use my location
                </button>
              </div>
            </div>
            <div className="mb-2">
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : editing ? 'Save Changes' : 'Create Hotel'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="card empty-state">
          <p>No hotels yet. Add one to let tourists book verified stays.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Hotel</th>
                <th>Zone</th>
                <th>Price</th>
                <th>Rooms</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => {
                const zs = h.zone ? ZONE_STYLE[h.zone.level] : null;
                return (
                  <tr key={h._id}>
                    <td>
                      <strong>{h.name}</strong>
                      <div className="text-sm text-muted">{HOTEL_TYPE_LABELS[h.type]} · {h.address}</div>
                    </td>
                    <td>
                      <span className={`badge ${zs ? zs.cls : 'badge-blue'}`}>{zs ? zs.label : 'No zone'}</span>
                      {zs && <div className="text-sm text-muted">{h.zone.name}</div>}
                    </td>
                    <td>₹{h.pricePerNight}</td>
                    <td>{h.rooms}</td>
                    <td>{h.rating.toFixed(1)}</td>
                    <td>
                      <button className={`badge ${h.active ? 'badge-green' : 'badge-gray'}`} onClick={() => toggleActive(h)} style={{ border: 'none', cursor: 'pointer' }}>
                        {h.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-outline text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => startEdit(h)}>Edit</button>
                        <button className="btn btn-danger text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => remove(h)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HotelsManagement;