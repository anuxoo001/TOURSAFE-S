import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, DEFAULT_CENTER } from '../constants.js';

const emptyForm = { name: '', type: 'hospital', phone: '', address: '', emergencyNumber: '', lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1], hours: '24/7' };

const ServicesManagement = () => {
  const { pushToast } = useSocket();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/emergency-services?radius=2000000&limit=200');
      setServices(data.services);
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
    if (!form.name || !form.type) {
      setError('Name and type are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/emergency-services', { ...form, lat: Number(form.lat), lng: Number(form.lng) });
      pushToast('Service added', form.name, 'green');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try {
      await api.delete(`/emergency-services/${s._id}`);
      pushToast('Service deleted', s.name, 'gray');
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <div>
          <h1 className="mb-1">🏥 Emergency Services</h1>
          <p className="text-muted">Manage hospitals, police, fire, pharmacies and embassies shown on the map.</p>
        </div>
        <button className="btn" onClick={() => { setShowForm((s) => !s); setForm(emptyForm); }}>
          {showForm ? '✕ Close' : '+ Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <h3 className="mb-2">Add Emergency Service</h3>
          {error && <div className="alert alert-red mb-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="grid grid-2">
              <div className="mb-2">
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Type *</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.values(SERVICE_TYPES).map((t) => (
                    <option key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Emergency number</label>
                <input className="input" value={form.emergencyNumber} onChange={(e) => setForm({ ...form, emergencyNumber: e.target.value })} placeholder="e.g. 100 / 102 / 101" />
              </div>
              <div className="mb-2">
                <label className="label">Address</label>
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Hours</label>
                <input className="input" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Latitude</label>
                <input className="input" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="label">Longitude</label>
                <input className="input" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Add Service'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : services.length === 0 ? (
        <div className="card empty-state">
          <p>No services configured.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {services.map((s) => (
            <div className="card" key={s._id}>
              <div className="flex-between mb-1">
                <span className="badge badge-blue">{SERVICE_TYPE_LABELS[s.type]}</span>
                <button className="btn btn-danger text-sm" style={{ padding: '0.2rem 0.5rem' }} onClick={() => remove(s)}>🗑</button>
              </div>
              <h3 className="mb-1">{s.name}</h3>
              {s.address && <p className="text-sm text-muted mb-1">{s.address}</p>}
              {s.hours && <p className="text-sm mb-1">🕒 {s.hours}</p>}
              <div className="text-sm text-muted">
                📍 {s.location?.coordinates?.[1]?.toFixed(4)}, {s.location?.coordinates?.[0]?.toFixed(4)}
              </div>
              {s.phone && <p className="text-sm mt-1"><a href={`tel:${s.phone}`}>{s.phone}</a></p>}
              {s.emergencyNumber && <p className="text-sm">Emergency: <strong>{s.emergencyNumber}</strong></p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;