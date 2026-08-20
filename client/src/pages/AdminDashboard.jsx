import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { timeAgo } from '../utils/format.js';

const AdminDashboard = () => {
  const { sosAlerts, livePositions } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, i, r] = await Promise.all([
          api.get('/analytics'),
          api.get('/incidents?limit=6'),
          api.get('/requests?status=pending&limit=5'),
        ]);
        setAnalytics(a.data.analytics);
        setRecentIncidents(i.data.incidents);
        setPendingRequests(r.data.requests);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  const t = analytics?.totals || {};
  const stats = [
    { label: 'Total Incidents', value: t.incidents, to: '/admin/incidents' },
    { label: 'Open Incidents', value: t.open, to: '/admin/incidents' },
    { label: 'Critical', value: t.critical, to: '/admin/incidents' },
    { label: 'Active SOS', value: sosAlerts.length || t.activeSOS, to: '/admin/sos' },
    { label: 'Pending Requests', value: pendingRequests.length, to: '/admin/requests' },
    { label: 'Tourists', value: t.tourists, to: '/admin/tourists' },
    { label: 'Online Now', value: t.online, to: '/admin/live-map' },
    { label: 'Services', value: t.services, to: '/admin/services' },
  ];

  return (
    <div className="container">
      <h1 className="mb-1">🛡️ Command Center</h1>
      <p className="text-muted mb-3">Real-time overview of tourist safety operations.</p>

      {sosAlerts.length > 0 && (
        <div className="alert alert-red mb-3">
          🚨 <strong>{sosAlerts.length} active SOS alert(s):</strong> {sosAlerts.map((a) => a.name).join(', ')}
          <Link to="/admin/sos" className="btn text-sm" style={{ marginLeft: 'auto', padding: '0.35rem 0.9rem', background: '#fff', color: 'var(--red)' }}>
            Respond →
          </Link>
        </div>
      )}

      <div className="grid grid-4 mb-3">
        {stats.map((s) => (
          <Link to={s.to} key={s.label} className="card stat" style={{ textDecoration: 'none' }}>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card">
          <div className="flex-between mb-2">
            <h3>📈 Today's Activity</h3>
            <Link to="/admin/analytics" className="btn btn-outline text-sm">Analytics →</Link>
          </div>
          <div className="grid grid-3">
            <div className="stat">
              <div className="value">{analytics?.periods?.today ?? 0}</div>
              <div className="label">Today</div>
            </div>
            <div className="stat">
              <div className="value">{analytics?.periods?.week ?? 0}</div>
              <div className="label">This Week</div>
            </div>
            <div className="stat">
              <div className="value">{analytics?.periods?.month ?? 0}</div>
              <div className="label">This Month</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2">📍 Live Tourists</h3>
          {Object.values(livePositions).length === 0 ? (
            <p className="text-muted text-sm">No tourists currently sharing live location.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {Object.values(livePositions)
                .slice(0, 6)
                .map((p) => (
                  <div key={p.userId} className="flex-between">
                    <span className="text-sm">
                      <span className={`status-dot ${p.sosActive ? 'red' : 'green'}`} /> {p.name}
                    </span>
                    <span className="text-sm text-muted">{p.sosActive ? 'SOS' : timeAgo(p.at)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between mb-2">
            <h3>🎫 Pending Help Requests</h3>
            <Link to="/admin/requests" className="btn btn-outline text-sm">Inbox →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-muted text-sm">No pending requests.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {pendingRequests.map((r) => (
                <div key={r._id} className="flex-between">
                  <div>
                    <strong className="text-sm">{r.subject}</strong>
                    <div className="text-sm text-muted">
                      {r.user?.name} · {timeAgo(r.createdAt)}
                    </div>
                  </div>
                  <span className={`badge badge-${r.priority === 'critical' || r.priority === 'high' ? 'red' : 'yellow'}`}>
                    {r.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex-between mb-2">
            <h3>🕐 Recent Incidents</h3>
            <Link to="/admin/incidents" className="btn btn-outline text-sm">View All →</Link>
          </div>
          {recentIncidents.length === 0 ? (
            <p className="text-muted text-sm">No incidents reported yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {recentIncidents.map((i) => (
                <div key={i._id} className="flex-between">
                  <div>
                    <strong className="text-sm">{i.title}</strong>
                    <div className="text-sm text-muted">{i.reporter?.name || 'Unknown'} · {timeAgo(i.createdAt)}</div>
                  </div>
                  <span className={`badge badge-${i.severity === 'critical' || i.severity === 'high' ? 'red' : i.severity === 'medium' ? 'yellow' : 'green'}`}>
                    {i.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;