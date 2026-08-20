import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import SafetyMap from '../components/SafetyMap.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { INCIDENT_TYPES, INCIDENT_TYPE_LABELS, DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants.js';

const ReportIncident = () => {
  const navigate = useNavigate();
  const { pushToast } = useSocket();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    address: '',
  });
  const [picked, setPicked] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onPick = ([lat, lng]) => setPicked([lat, lng]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!picked) {
      setError('Click on the map to set the incident location.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        type: form.type || undefined,
        lat: picked[0],
        lng: picked[1],
      };
      const { data } = await api.post('/incidents', payload);
      setResult({ incident: data.incident, ai: data.ai });
      pushToast('Incident reported', 'Authorities have been notified.', data.ai?.severity === 'critical' || data.ai?.severity === 'high' ? 'red' : 'blue');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report incident');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const { incident, ai } = result;
    return (
      <div className="container" style={{ maxWidth: 640 }}>
        <div className={`alert ${ai?.severity === 'critical' || ai?.severity === 'high' ? 'alert-red' : 'alert-green'} mb-2`}>
          <span style={{ fontSize: '1.4rem' }}>{ai?.severity === 'critical' || ai?.severity === 'high' ? '🚨' : '✅'}</span>
          <div>
            <strong>Incident reported successfully</strong>
            <div className="text-sm">Reference: {incident._id}</div>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2">🤖 AI Classification</h3>
          <div className="grid grid-3">
            <div className="stat">
              <div className="value">{INCIDENT_TYPE_LABELS[incident.type] || incident.type}</div>
              <div className="label">Type</div>
            </div>
            <div className="stat">
              <div className="value" style={{ color: ai?.severity === 'critical' ? 'var(--red)' : ai?.severity === 'high' ? '#f97316' : 'var(--primary)' }}>
                {incident.severity.toUpperCase()}
              </div>
              <div className="label">Severity</div>
            </div>
            <div className="stat">
              <div className="value">{Math.round((ai?.confidence || 0) * 100)}%</div>
              <div className="label">Confidence</div>
            </div>
          </div>
          {incident.status === 'reported' && (
            <div className="alert alert-blue mt-2">
              Authorities have been notified. Track its progress in "My Incidents".
            </div>
          )}
          <div className="flex gap-1 mt-2">
            <button className="btn btn-outline" onClick={() => navigate('/user/incidents')}>View My Incidents</button>
            <button className="btn" onClick={() => { setResult(null); setForm({ title: '', description: '', type: '', address: '' }); setPicked(null); }}>
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-1">📝 Report an Incident</h1>
      <p className="text-muted mb-3">AI will classify severity and notify authorities automatically.</p>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 480 }}>
            <SafetyMap
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              picked={picked}
              onPick={onPick}
              height="480px"
            />
          </div>
          <div style={{ padding: '0.75rem 1rem' }}>
            {picked ? (
              <span className="chip badge-blue">📍 Selected: {picked[0].toFixed(5)}, {picked[1].toFixed(5)}</span>
            ) : (
              <span className="chip">Click on the map to pin the location</span>
            )}
          </div>
        </div>

        <div className="card">
          {error && <div className="alert alert-red mb-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-2">
              <label className="label">Title *</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Pickpocketing near metro station" />
            </div>
            <div className="mb-2">
              <label className="label">Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="">Let AI decide</option>
                {Object.entries(INCIDENT_TYPES).map(([k, v]) => (
                  <option key={v} value={v}>{INCIDENT_TYPE_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="label">Description *</label>
              <textarea className="textarea" rows={5} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what happened..." />
            </div>
            <div className="mb-2">
              <label className="label">Address (optional)</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Nearby landmark or address" />
            </div>
            <button className="btn btn-block btn-lg" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Report Incident'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIncident;