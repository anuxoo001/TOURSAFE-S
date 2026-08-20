import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { SOS_STATUS_LABELS } from '../constants.js';
import { fmtDateTime, timeAgo } from '../utils/format.js';

const SOSCenter = () => {
  const { sosAlerts, pushToast } = useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await api.get('/sos/logs', { params });
      setLogs(data.logs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const acknowledge = async (id) => {
    try {
      await api.put(`/sos/${id}/acknowledge`);
      pushToast('SOS acknowledged', 'Tourist has been notified.', 'green');
      load();
    } catch {
      // ignore
    }
  };

  const resolve = async (log) => {
    const notes = window.prompt('Resolution notes (optional):', 'Unit reached, tourist safe.');
    if (notes === null) return;
    try {
      await api.put(`/sos/${log._id}/resolve`, { notes });
      pushToast('SOS resolved', 'Case closed and tourist notified.', 'green');
      load();
    } catch {
      // ignore
    }
  };

  const merged = [...logs];
  for (const a of sosAlerts) {
    if (!merged.find((l) => l.sosId === a.sosId) && a.type !== 'resolved') {
      merged.unshift({
        _id: `live-${a.sosId}`,
        sosId: a.sosId,
        tourist: { name: a.name, phone: a.phone, touristId: a.touristId },
        lat: a.lat,
        lng: a.lng,
        status: 'active',
        createdAt: new Date(a.at),
        live: true,
      });
    }
  }

  return (
    <div className="container">
      <h1 className="mb-1">🚨 SOS Response Center</h1>
      <p className="text-muted mb-3">Live emergency alerts from tourists. Acknowledge and resolve each case.</p>

      {sosAlerts.filter((a) => a.type !== 'resolved').length > 0 && (
        <div className="alert alert-red mb-3">
          <strong>{sosAlerts.filter((a) => a.type !== 'resolved').length} LIVE SOS alert(s).</strong> Respond immediately.
        </div>
      )}

      <div className="sidebar">
        <select className="select" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All cases</option>
          {Object.entries(SOS_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : merged.length === 0 ? (
        <div className="card empty-state">
          <p>No SOS cases. All clear.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Tourist</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((log) => {
                const status = log.status;
                const canAct = status === 'active' || status === 'acknowledged';
                return (
                  <tr key={log._id} style={status === 'active' ? { background: 'var(--danger-bg)' } : undefined}>
                    <td className="text-muted">{log.live ? '🔴 LIVE' : timeAgo(log.createdAt)}</td>
                    <td>
                      <strong>{log.tourist?.name || 'Unknown'}</strong>
                      {log.tourist?.touristId && <div className="text-sm text-muted">{log.tourist.touristId}</div>}
                    </td>
                    <td className="text-sm text-muted">
                      {log.lat ? `${log.lat.toFixed(4)}, ${log.lng?.toFixed(4)}` : '—'}
                    </td>
                    <td className="text-sm">
                      {log.tourist?.phone && <a href={`tel:${log.tourist.phone}`}>{log.tourist.phone}</a>}
                    </td>
                    <td>
                      <span className={`badge badge-${status === 'active' ? 'red' : status === 'acknowledged' ? 'yellow' : 'green'}`}>
                        {SOS_STATUS_LABELS[status] || status}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {log.acknowledgedBy?.name ? `Ack: ${log.acknowledgedBy.name}` : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {status === 'active' && (
                          <button className="btn text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => acknowledge(log._id)}>
                            ✅ Acknowledge
                          </button>
                        )}
                        {canAct && (
                          <button className="btn btn-success text-sm" style={{ padding: '0.3rem 0.7rem' }} onClick={() => resolve(log)}>
                            Resolve
                          </button>
                        )}
                        {status === 'resolved' && (
                          <span className="text-sm text-muted">
                            {log.resolvedAt ? fmtDateTime(log.resolvedAt) : ''}
                            {log.notes && <div className="text-sm">{log.notes}</div>}
                          </span>
                        )}
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

export default SOSCenter;