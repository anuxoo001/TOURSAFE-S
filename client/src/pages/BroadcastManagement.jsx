import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { BROADCAST_LEVELS, BROADCAST_LEVEL_LABELS } from '../constants.js';
import { fmtDateTime } from '../utils/format.js';

const emptyForm = { title: '', body: '', level: BROADCAST_LEVELS.INFO, audience: 'all' };

const BroadcastManagement = () => {
  const { pushToast } = useSocket();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/broadcasts/all');
      setBroadcasts(data.broadcasts);
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
    if (!form.title || !form.body) {
      setError('Title and body are required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/broadcasts', form);
      pushToast('Broadcast sent', `Delivered to ${data.deliveredTo} users.`, 'blue');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b) => {
    try {
      await api.put(`/broadcasts/${b._id}/toggle`);
      load();
    } catch {
      // ignore
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete broadcast "${b.title}"?`)) return;
    try {
      await api.delete(`/broadcasts/${b._id}`);
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <div>
          <h1 className="mb-1">📢 Emergency Broadcasts</h1>
          <p className="text-muted">Send live announcements to all tourists instantly.</p>
        </div>
        <button className="btn" onClick={() => { setShowForm((s) => !s); setForm(emptyForm); setError(''); }}>
          {showForm ? '✕ Close' : '+ New Broadcast'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <h3 className="mb-2">Send Announcement</h3>
          {error && <div className="alert alert-red mb-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="grid grid-3">
              <div className="mb-2">
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weather advisory" />
              </div>
              <div className="mb-2">
                <label className="label">Level</label>
                <select className="select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  {Object.values(BROADCAST_LEVELS).map((l) => (
                    <option key={l} value={l}>{BROADCAST_LEVEL_LABELS[l]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="label">Audience</label>
                <select className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  <option value="all">All users</option>
                  <option value="tourists">Tourists only</option>
                </select>
              </div>
            </div>
            <div className="mb-2">
              <label className="label">Message *</label>
              <textarea className="textarea" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Important information for all tourists..." />
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : '🚀 Send Broadcast'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="card empty-state">
          <p>No broadcasts sent yet.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sent</th>
                <th>Title</th>
                <th>Message</th>
                <th>Level</th>
                <th>Audience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr key={b._id}>
                  <td className="text-muted">{fmtDateTime(b.createdAt)}</td>
                  <td><strong>{b.title}</strong></td>
                  <td className="text-sm text-muted">{b.body}</td>
                  <td><span className={`badge badge-${b.level === 'danger' ? 'red' : b.level === 'warning' ? 'yellow' : 'blue'}`}>{BROADCAST_LEVEL_LABELS[b.level]}</span></td>
                  <td className="text-sm">{b.audience}</td>
                  <td>
                    <button className={`badge ${b.active ? 'badge-green' : 'badge-gray'}`} onClick={() => toggle(b)} style={{ border: 'none', cursor: 'pointer' }}>
                      {b.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-danger text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => remove(b)}>🗑</button>
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

export default BroadcastManagement;