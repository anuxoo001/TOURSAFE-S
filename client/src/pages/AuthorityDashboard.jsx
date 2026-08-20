import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { timeAgo } from '../utils/format.js';

const AuthorityDashboard = () => {
  const { sosAlerts, livePositions } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, i] = await Promise.all([api.get('/analytics'), api.get('/incidents?limit=8')]);
        setAnalytics(a.data.analytics);
        setRecentIncidents(i.data.incidents);
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
    { label: 'Total Incidents', value: t.incidents, to: '/incidents/all' },
    { label: 'Open', value: t.open, to: '/incidents/all' },
    { label: 'Critical', value: t.critical, to: '/incidents/all' },
    { label: 'Active SOS', value: t.activeSOS, to: '/live-map' },
    { label: 'Tourists', value: t.tourists, to: '/tourists' },
    { label: 'Online Now', value: t.online, to: '/live-map' },
    { label: 'Services', value: t.services, to: '/services' },
    { label: 'Avg Res. (h)', value: t.avgResolutionHours, to: '/analytics' },
  ];

  return (
    <div className="container">
      <h1 className="mb-1">🛡️ Authority Dashboard</h1>
      <p className="text-muted mb-3">Real-time overview of tourist safety in the city.</p>

      {sosAlerts.length > 0 && (
        <div className="alert alert-red mb-3">
          🚨 <strong>{sosAlerts.length} active SOS alert(s):</strong> {sosAlerts.map((a) => a.name).join(', ')}
          <Link to="/live-map" className="btn text-sm" style={{ marginLeft: 'auto', padding: '0.35rem 0.9rem' }}>
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

      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between mb-2">
            <h3>📈 Today's Activity</h3>
            <Link to="/analytics" className="btn btn-outline text-sm">Full Analytics →</Link>
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

      <div className="card mt-3">
        <div className="flex-between mb-2">
          <h3>🕐 Recent Incidents</h3>
          <Link to="/incidents/all" className="btn btn-outline text-sm">View All →</Link>
        </div>
        {recentIncidents.length === 0 ? (
          <p className="text-muted text-sm">No incidents reported yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Reporter</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map((i) => (
                  <tr key={i._id}>
                    <td className="text-muted">{timeAgo(i.createdAt)}</td>
                    <td>{i.reporter?.name || 'Unknown'}</td>
                    <td><strong>{i.title}</strong></td>
                    <td><span className={`badge badge-${i.severity === 'critical' || i.severity === 'high' ? 'red' : i.severity === 'medium' ? 'yellow' : 'green'}`}>{i.severity.toUpperCase()}</span></td>
                    <td><span className={`badge badge-${i.status === 'resolved' ? 'green' : i.status === 'reviewing' ? 'blue' : 'yellow'}`}>{i.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;