import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { ZONE_LEVEL_LABELS, INCIDENT_TYPE_LABELS, SEVERITY_CLASS } from '../constants.js';
import { timeAgo } from '../utils/format.js';

const UserDashboard = () => {
  const { user } = useAuth();
  const { emitLocation } = useSocket();
  const [myLocation, setMyLocation] = useState(null);
  const [currentZone, setCurrentZone] = useState(null);
  const [zones, setZones] = useState([]);
  const [myIncidents, setMyIncidents] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [locRes, zoneRes, incRes, bcRes] = await Promise.all([
          api.get('/tourists/me/location'),
          api.get('/zones'),
          api.get('/incidents?limit=100'),
          api.get('/broadcasts'),
        ]);
        setMyLocation(locRes.data.location);
        setCurrentZone(locRes.data.currentZone);
        setZones(zoneRes.data.zones);
        setMyIncidents(incRes.data.incidents.filter((i) => String(i.reporter?._id) === String(user._id)));
        setBroadcasts(bcRes.data.broadcasts.slice(0, 3));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user._id]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watch = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setMyLocation((prev) => ({ ...prev, lat, lng }));
          emitLocation(lat, lng);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watch);
    }
  }, [emitLocation]);

  const activeReports = myIncidents.filter((i) => i.status === 'reported' || i.status === 'reviewing').length;

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '0.25rem' }}>Welcome back, {user.name.split(' ')[0]} 👋</h1>
      <p className="text-muted mb-3">Your personal tourist safety overview.</p>

      <div className="grid grid-4 mb-3">
        <div className="card stat">
          <div className="value">{currentZone ? ZONE_LEVEL_LABELS[currentZone.level] : 'Safe'}</div>
          <div className="label">Current Zone</div>
          {currentZone && <div className="text-sm text-muted">{currentZone.name}</div>}
        </div>
        <div className="card stat">
          <div className="value">{myIncidents.length}</div>
          <div className="label">My Reports</div>
        </div>
        <div className="card stat">
          <div className="value">{activeReports}</div>
          <div className="label">Active Reports</div>
        </div>
        <div className="card stat">
          <div className="value">{broadcasts.length}</div>
          <div className="label">Announcements</div>
        </div>
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card">
          <div className="flex-between mb-2">
            <h3>🗺️ Safety Zones</h3>
            <Link to="/user/map" className="btn btn-outline text-sm">Open Map →</Link>
          </div>
          {zones.length === 0 ? (
            <p className="text-muted text-sm">No zones configured yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {zones.slice(0, 5).map((z) => (
                <div key={z._id} className="flex-between">
                  <div>
                    <strong className="text-sm">{z.name}</strong>
                    <div className="text-sm text-muted">{z.description}</div>
                  </div>
                  <span className={`badge badge-${z.level}`}>{ZONE_LEVEL_LABELS[z.level]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

<div className="card">
          <div className="flex-between mb-2">
            <h3>📝 Recent Reports</h3>
            <Link to="/user/report" className="btn btn-outline text-sm">Report Now</Link>
          </div>
          {myIncidents.length === 0 ? (
            <p className="text-muted text-sm">You haven't reported any incidents yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {myIncidents.slice(0, 4).map((i) => (
                <div key={i._id} className="flex-between">
                  <div>
                    <strong className="text-sm">{i.title}</strong>
                    <div className="text-sm text-muted">
                      {INCIDENT_TYPE_LABELS[i.type]} · {timeAgo(i.createdAt)}
                    </div>
                  </div>
                  <span className={`badge badge-${SEVERITY_CLASS[i.severity]}`}>{i.severity.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card">
          <div className="flex-between mb-2">
            <h3>📢 Latest Announcements</h3>
            <Link to="/user/broadcasts" className="btn btn-outline text-sm">All →</Link>
          </div>
          {broadcasts.length === 0 ? (
            <p className="text-muted text-sm">No announcements yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {broadcasts.map((b) => (
                <div key={b._id} className="flex-between">
                  <div>
                    <strong className="text-sm">{b.title}</strong>
                    <div className="text-sm text-muted">{b.body}</div>
                  </div>
                  <span className={`badge badge-${b.level === 'danger' ? 'red' : b.level === 'warning' ? 'yellow' : 'blue'}`}>
                    {b.level.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-2">📍 Your Location</h3>
          {myLocation?.lat && myLocation?.lng ? (
            <>
              <p className="text-sm">
                <strong>{myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}</strong>
              </p>
              <p className="text-sm text-muted">Updated {myLocation.at ? timeAgo(myLocation.at) : 'just now'}</p>
              <p className="text-sm mt-2">
                Status:{' '}
                {currentZone ? (
                  <span className={`badge badge-${currentZone.level}`}>{ZONE_LEVEL_LABELS[currentZone.level]} · {currentZone.name}</span>
                ) : (
                  <span className="badge badge-green">In a safe area</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-muted text-sm">Enable location sharing to get zone alerts.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', color: '#fff', border: 'none' }}>
        <div className="flex-between wrap gap-1" style={{ alignItems: 'center' }}>
          <div>
            <h3 className="mb-1" style={{ color: '#fff' }}>🆘 In an emergency?</h3>
            <p className="text-sm" style={{ opacity: 0.9 }}>
              One-tap SOS instantly alerts administrators and shares your live location.
            </p>
          </div>
          <Link to="/user/emergency" className="btn btn-lg" style={{ background: '#fff', color: '#dc2626' }}>
            🚨 Emergency Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;