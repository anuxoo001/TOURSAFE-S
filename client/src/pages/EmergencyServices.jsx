import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { REQUEST_TYPES, REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../constants.js';

const QUICK_DIAL = [
  { name: 'Police', number: '100', color: 'var(--primary)' },
  { name: 'Fire & Rescue', number: '101', color: 'var(--red)' },
  { name: 'Ambulance', number: '102', color: 'var(--green)' },
  { name: 'Tourist Helpline', number: '1363', color: 'var(--yellow)' },
];

const EmergencyServices = () => {
  const { user } = useAuth();
  const { triggerSOS, cancelSOS, sosAlerts, pushToast } = useSocket();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [radius, setRadius] = useState(20000);
  const [myPos, setMyPos] = useState(null);
  const mySos = sosAlerts.find((a) => a.userId === String(user._id));

  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({ type: REQUEST_TYPES.ASSISTANCE, subject: '', description: '' });
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setMyPos(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const load = async (lat, lng, t, r) => {
    setLoading(true);
    try {
      const params = { radius: r || 50000, limit: 30 };
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      if (t) params.type = t;
      const { data } = await api.get('/emergency-services', { params });
      setServices(data.services);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(myPos?.lat, myPos?.lng, type, radius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPos, type, radius]);

  const sos = () => (mySos ? cancelSOS() : triggerSOS(myPos?.lat, myPos?.lng));

  const sendContact = async (e) => {
    e.preventDefault();
    setContactError('');
    if (!contact.subject || !contact.description) {
      setContactError('Subject and message are required');
      return;
    }
    setSending(true);
    try {
      await api.post('/requests', { ...contact, type: contact.type || undefined });
      pushToast('Message sent', 'An administrator has been notified.', 'blue');
      setContact({ type: REQUEST_TYPES.ASSISTANCE, subject: '', description: '' });
      setShowContact(false);
    } catch (err) {
      setContactError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container">
      <h1 className="mb-1">🏥 Emergency & Quick Dial</h1>
      <p className="text-muted mb-3">One-tap emergency calls and nearby services.</p>

      <div className="grid grid-2 mb-3">
        <div className="card" style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none' }}>
          <h3 style={{ color: '#fff' }} className="mb-1">🚨 SOS Emergency</h3>
          <p className="text-sm mb-2" style={{ opacity: 0.9 }}>
            {mySos ? 'SOS alert sent to administrators.' : 'Instantly alert administrators with your live location.'}
          </p>
          <button className={`btn btn-lg btn-block ${mySos ? '' : 'btn-pulse'}`} style={{ background: '#fff', color: mySos ? 'var(--green)' : '#dc2626' }} onClick={sos}>
            {mySos ? '✅ SOS Sent — Cancel' : '🚨 PRESS SOS'}
          </button>
        </div>

        <div className="card">
          <h3 className="mb-2">📞 Quick Dial</h3>
          <div className="grid grid-2">
            {QUICK_DIAL.map((q) => (
              <a key={q.number} href={`tel:${q.number}`} className="btn btn-lg btn-block" style={{ background: q.color }}>
                <span style={{ display: 'block' }}>{q.name}</span>
                <span style={{ fontSize: '1.3rem' }}>{q.number}</span>
              </a>
            ))}
          </div>
          <Link to="/user/report" className="btn btn-outline btn-block mt-2">📝 Report an Incident Instead</Link>
        </div>
      </div>

      <div className="sidebar">
        <select className="select" style={{ width: 'auto' }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.values(SERVICE_TYPES).map((t) => (
            <option key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
          <option value={5000}>Within 5 km</option>
          <option value={10000}>Within 10 km</option>
          <option value={20000}>Within 20 km</option>
          <option value={50000}>Within 50 km</option>
        </select>
        {!myPos && <span className="chip">⚠️ Share location for distance sorting</span>}
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : services.length === 0 ? (
        <div className="card empty-state">
          <p>No services found for these filters.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {services.map((s) => (
            <div className="card" key={s._id}>
              <div className="flex-between mb-1">
                <span className="badge badge-blue">{SERVICE_TYPE_LABELS[s.type]}</span>
                {s.distance !== undefined && <span className="chip">{s.distance} m</span>}
              </div>
              <h3 className="mb-1">{s.name}</h3>
              {s.address && <p className="text-sm text-muted mb-1">{s.address}</p>}
              {s.hours && <p className="text-sm mb-1">🕒 {s.hours}</p>}
              {s.emergencyNumber && (
                <p className="mb-1">
                  <a href={`tel:${s.emergencyNumber}`} className="btn btn-danger text-sm" style={{ padding: '0.35rem 0.9rem' }}>
                    📞 Emergency: {s.emergencyNumber}
                  </a>
                </p>
              )}
              {s.phone && (
                <p className="text-sm">
                  <a href={`tel:${s.phone}`}>{s.phone}</a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card mt-3">
        <button className="flex-between" style={{ width: '100%', padding: '0.5rem 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowContact((s) => !s)}>
          <span className="flex gap-1" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '1.3rem' }}>📨</span>
            <strong>Need to talk to an administrator?</strong>
          </span>
          <span>{showContact ? '▾' : '▸'}</span>
        </button>
        {showContact && (
          <form onSubmit={sendContact} className="mt-2">
            {contactError && <div className="alert alert-red mb-2">{contactError}</div>}
            <div className="grid grid-2">
              <div className="mb-2">
                <label className="label">Topic</label>
                <select className="select" value={contact.type} onChange={(e) => setContact({ ...contact, type: e.target.value })}>
                  {Object.values(REQUEST_TYPES).map((t) => (
                    <option key={t} value={t}>{REQUEST_TYPE_ICONS[t]} {REQUEST_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="label">Subject *</label>
                <input className="input" value={contact.subject} onChange={(e) => setContact({ ...contact, subject: e.target.value })} placeholder="Brief summary" />
              </div>
            </div>
            <div className="mb-2">
              <label className="label">Message *</label>
              <textarea className="textarea" rows={3} value={contact.description} onChange={(e) => setContact({ ...contact, description: e.target.value })} placeholder="Describe how an administrator can help you..." />
            </div>
            <button className="btn" type="submit" disabled={sending}>
              {sending ? <span className="spinner" /> : 'Send to Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmergencyServices;