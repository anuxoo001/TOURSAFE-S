import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import {
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_ICONS,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_CLASS,
  REQUEST_PRIORITY,
  REQUEST_PRIORITY_LABELS,
} from '../constants.js';
import { fmtDateTime, timeAgo } from '../utils/format.js';

const RequestsInbox = () => {
  const { pushToast } = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', priority: '', q: '' });
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      const { data } = await api.get('/requests', { params });
      let list = data.requests;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(
          (r) =>
            r.subject?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.user?.name?.toLowerCase().includes(q) ||
            r.user?.touristId?.toLowerCase().includes(q)
        );
      }
      setRequests(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type, filters.priority]);

  const update = async (id, body) => {
    try {
      const { data } = await api.put(`/requests/${id}/status`, body);
      pushToast('Request updated', `${data.request.subject} → ${body.status}`, 'blue');
      load();
    } catch {
      // ignore
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      pushToast('Request deleted', '', 'gray');
      load();
    } catch {
      // ignore
    }
  };

  const countBy = (s) => requests.filter((r) => r.status === s).length;

  return (
    <div className="container">
      <h1 className="mb-1">📨 Requests Inbox</h1>
      <p className="text-muted mb-3">Every help request and emergency submitted by users lands here in real time.</p>

      <div className="grid grid-4 mb-3">
        {Object.values(REQUEST_STATUS).map((s) => (
          <button key={s} className={`card stat ${filters.status === s ? 'sel' : ''}`} style={{ border: filters.status === s ? '2px solid var(--primary)' : undefined, cursor: 'pointer' }} onClick={() => setFilters({ ...filters, status: filters.status === s ? '' : s })}>
            <div className="value">{countBy(s)}</div>
            <div className="label">{REQUEST_STATUS_LABELS[s]}</div>
          </button>
        ))}
      </div>

      <div className="sidebar">
        <input className="input" style={{ width: 220 }} placeholder="🔍 Search subject, name, ID..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select className="select" style={{ width: 'auto' }} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {Object.values(REQUEST_TYPES).map((t) => (
            <option key={t} value={t}>{REQUEST_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {Object.values(REQUEST_PRIORITY).map((p) => (
            <option key={p} value={p}>{REQUEST_PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card empty-state">
          <p>No requests match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {requests.map((r) => (
            <div className="card" key={r._id} style={r.priority === 'critical' && r.status === 'pending' ? { borderLeft: '5px solid var(--red)' } : r.status === 'pending' ? { borderLeft: '5px solid var(--yellow)' } : undefined}>
              <div className="flex-between mb-1">
                <div className="flex gap-1" style={{ alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>{REQUEST_TYPE_ICONS[r.type]}</span>
                  <strong>{r.subject}</strong>
                </div>
                <div className="flex gap-1">
                  <span className={`badge badge-${r.priority === 'critical' ? 'red' : r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'yellow' : 'green'}`}>
                    {REQUEST_PRIORITY_LABELS[r.priority]}
                  </span>
                  <span className={`badge badge-${REQUEST_STATUS_CLASS[r.status]}`}>{REQUEST_STATUS_LABELS[r.status]}</span>
                </div>
              </div>
              <p className="text-sm text-muted mb-1">{r.description}</p>
              <div className="flex-between text-sm text-muted">
                <span>
                  👤 {r.user?.name} ({r.user?.touristId || 'No ID'}) · {r.user?.phone || 'no phone'} · {timeAgo(r.createdAt)}
                </span>
                <button className="btn btn-outline text-sm" style={{ padding: '0.2rem 0.6rem' }} onClick={() => setExpanded(expanded === r._id ? null : r._id)}>
                  {expanded === r._id ? '▲ Close' : '▼ Manage'}
                </button>
              </div>
              {r.location?.coordinates?.[0] !== 0 && (
                <div className="text-sm text-muted mt-1">
                  📍 {r.location.coordinates[1]?.toFixed(4)}, {r.location.coordinates[0]?.toFixed(4)}
                </div>
              )}

              {expanded === r._id && (
                <div className="card mt-2" style={{ background: 'var(--bg)', boxShadow: 'none' }}>
                  <div className="grid grid-2">
                    <div className="mb-1">
                      <label className="label">Status</label>
                      <select className="select" value={r.status} onChange={(e) => update(r._id, { status: e.target.value })}>
                        {Object.values(REQUEST_STATUS).map((s) => (
                          <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-1">
                      <label className="label">Priority</label>
                      <select className="select" value={r.priority} onChange={(e) => update(r._id, { priority: e.target.value })}>
                        {Object.values(REQUEST_PRIORITY).map((p) => (
                          <option key={p} value={p}>{REQUEST_PRIORITY_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <RequestNote r={r} onSave={(note) => update(r._id, { adminNote: note })} />
                  <div className="flex gap-1 mt-1">
                    <a href={`tel:${r.user?.phone}`} className="btn btn-outline text-sm" style={{ padding: '0.3rem 0.7rem' }}>📞 Call User</a>
                    {r.status === 'resolved' && <span className="text-sm text-muted">Resolved {fmtDateTime(r.resolvedAt)}</span>}
                    <button className="btn btn-danger text-sm" style={{ marginLeft: 'auto', padding: '0.3rem 0.7rem' }} onClick={() => remove(r._id)}>🗑 Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RequestNote = ({ r, onSave }) => {
  const [note, setNote] = useState(r.adminNote || '');
  return (
    <div className="flex gap-1 mb-1" style={{ alignItems: 'center' }}>
      <input className="input text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the user..." />
      <button className="btn text-sm" style={{ padding: '0.35rem 0.8rem' }} onClick={() => onSave(note)}>Send</button>
    </div>
  );
};

export default RequestsInbox;