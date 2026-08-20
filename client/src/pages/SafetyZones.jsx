import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { ZONE_LEVELS, ZONE_LEVEL_LABELS, ZONE_TYPES, ZONE_TYPE_LABELS, DEFAULT_CENTER } from '../constants.js';

const emptyForm = {
  name: '',
  description: '',
  level: ZONE_LEVELS.YELLOW,
  zoneType: '',
  lat: DEFAULT_CENTER[0],
  lng: DEFAULT_CENTER[1],
  radius: 500,
  alertOnEnter: true,
  polygon: '',
  mode: 'point',
};

const SafetyZones = () => {
  const { pushToast } = useSocket();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/zones');
      setZones(data.zones);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const buildGeometry = () => {
    if (form.mode === 'point') {
      return [Number(form.lng), Number(form.lat)];
    }
    try {
      return JSON.parse(form.polygon);
    } catch {
      throw new Error('Polygon must be valid GeoJSON');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.level) {
      setError('Name and level are required');
      return;
    }
    setSaving(true);
    try {
      const geometry = buildGeometry();
      const payload = {
        name: form.name,
        description: form.description,
        level: form.level,
        zoneType: form.zoneType || undefined,
        radius: Number(form.radius) || 500,
        alertOnEnter: form.alertOnEnter,
        geometry,
      };
      if (editing) {
        await api.put(`/zones/${editing}`, payload);
        pushToast('Zone updated', form.name, 'blue');
      } else {
        await api.post('/zones', payload);
        pushToast('Zone created', form.name, 'green');
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (zone) => {
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      await api.delete(`/zones/${zone._id}`);
      pushToast('Zone deleted', zone.name, 'gray');
      load();
    } catch {
      // ignore
    }
  };

  const toggleActive = async (zone) => {
    try {
      await api.put(`/zones/${zone._id}`, { active: !zone.active });
      load();
    } catch {
      // ignore
    }
  };

  const startEdit = (zone) => {
    const isPoly = zone.geometry?.type === 'Polygon';
    setEditing(zone._id);
    setForm({
      name: zone.name,
      description: zone.description,
      level: zone.level,
      zoneType: zone.zoneType,
      lat: zone.geometry?.type === 'Point' ? zone.geometry.coordinates[1] : DEFAULT_CENTER[0],
      lng: zone.geometry?.type === 'Point' ? zone.geometry.coordinates[0] : DEFAULT_CENTER[1],
      radius: zone.radius || 500,
      alertOnEnter: zone.alertOnEnter,
      polygon: isPoly ? JSON.stringify(zone.geometry, null, 2) : '',
      mode: isPoly ? 'polygon' : 'point',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <div>
          <h1 className="mb-1">🗺️ Safety Zones</h1>
          <p className="text-muted">Geofenced danger, caution and safe areas on the map.</p>
        </div>
        <button className="btn" onClick={() => { setShowForm((s) => !s); setEditing(null); setForm(emptyForm); }}>
          {showForm ? '✕ Close' : '+ New Zone'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <h3 className="mb-2">{editing ? 'Edit Zone' : 'Create Safety Zone'}</h3>
          {error && <div className="alert alert-red mb-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="grid grid-2">
              <div className="mb-2">
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Market Safe District" />
              </div>
              <div className="mb-2">
                <label className="label">Level *</label>
                <select className="select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value, zoneType: e.target.value === 'red' ? 'danger' : e.target.value === 'green' ? 'safe' : 'caution' })}>
                  {Object.values(ZONE_LEVELS).map((l) => (
                    <option key={l} value={l}>{ZONE_LEVEL_LABELS[l]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="label">Zone type</label>
                <select className="select" value={form.zoneType} onChange={(e) => setForm({ ...form, zoneType: e.target.value })}>
                  <option value="">Auto</option>
                  {Object.values(ZONE_TYPES).map((t) => (
                    <option key={t} value={t}>{ZONE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div className="mb-2">
              <label className="label">Geometry mode</label>
              <select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="point">Point + radius</option>
                <option value="polygon">GeoJSON Polygon</option>
              </select>
            </div>

            {form.mode === 'point' ? (
              <div className="grid grid-3">
                <div className="mb-2">
                  <label className="label">Latitude</label>
                  <input className="input" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="label">Longitude</label>
                  <input className="input" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="label">Radius (meters)</label>
                  <input className="input" type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="mb-2">
                <label className="label">GeoJSON Polygon</label>
                <textarea
                  className="textarea"
                  rows={6}
                  value={form.polygon}
                  onChange={(e) => setForm({ ...form, polygon: e.target.value })}
                  placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat],...]]}'
                />
              </div>
            )}

            <label className="flex gap-1 mb-2" style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={form.alertOnEnter} onChange={(e) => setForm({ ...form, alertOnEnter: e.target.checked })} />
              Alert tourists entering this zone
            </label>

            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : editing ? 'Save Changes' : 'Create Zone'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : zones.length === 0 ? (
        <div className="card empty-state">
          <p>No safety zones configured. Create one to start geofencing.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Level</th>
                <th>Type</th>
                <th>Geometry</th>
                <th>Alert on enter</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z._id}>
                  <td>
                    <strong>{z.name}</strong>
                    {z.description && <div className="text-sm text-muted">{z.description}</div>}
                  </td>
                  <td><span className={`badge badge-${z.level}`}>{ZONE_LEVEL_LABELS[z.level]}</span></td>
                  <td className="text-sm">{ZONE_TYPE_LABELS[z.zoneType] || z.zoneType}</td>
                  <td className="text-sm">
                    {z.geometry?.type === 'Polygon' ? `Polygon (${z.geometry.coordinates[0].length} pts)` : `Point · ${z.radius}m`}
                  </td>
                  <td>{z.alertOnEnter ? '✅' : '—'}</td>
                  <td>
                    <button className={`badge ${z.active ? 'badge-green' : 'badge-gray'}`} onClick={() => toggleActive(z)} style={{ border: 'none', cursor: 'pointer' }}>
                      {z.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-outline text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => startEdit(z)}>Edit</button>
                      <button className="btn btn-danger text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => remove(z)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SafetyZones;