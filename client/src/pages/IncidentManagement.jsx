import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  INCIDENT_SEVERITY,
  INCIDENT_STATUS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_CLASS,
  STATUS_CLASS,
  TYPE_CLASS,
} from '../constants.js';
import { fmtDateTime } from '../utils/format.js';

const IncidentManagement = () => {
  const { pushToast } = useSocket();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', severity: '', type: '', q: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      if (filters.type) params.type = filters.type;
      const { data } = await api.get('/incidents', { params });
      let list = data.incidents;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(
          (i) =>
            i.title?.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.reporter?.name?.toLowerCase().includes(q) ||
            i.reporter?.touristId?.toLowerCase().includes(q)
        );
      }
      setIncidents(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.severity, filters.type]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/incidents/${id}/status`, { status });
      pushToast('Incident updated', `Status set to ${status}`, 'blue');
      load();
    } catch {
      // ignore
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this incident?')) return;
    try {
      await api.delete(`/incidents/${id}`);
      pushToast('Incident deleted', '', 'gray');
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="container">
      <h1 className="mb-1">🚨 Incident Management</h1>
      <p className="text-muted mb-3">Review, triage and resolve tourist-reported incidents.</p>

      <div className="sidebar">
        <input
          className="input"
          style={{ width: 220 }}
          placeholder="🔍 Search title, reporter, ID..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select className="select" style={{ width: 'auto' }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {Object.values(INCIDENT_STATUS).map((s) => (
            <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">All severities</option>
          {Object.values(INCIDENT_SEVERITY).map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {Object.values(INCIDENT_TYPES).map((t) => (
            <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="card empty-state">
          <p>No incidents match your filters.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reported</th>
                <th>Reporter</th>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>AI</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i._id}>
                  <td className="text-muted">{fmtDateTime(i.createdAt)}</td>
                  <td>
                    <div>{i.reporter?.name || 'Unknown'}</div>
                    {i.reporter?.touristId && <div className="text-sm text-muted">{i.reporter.touristId}</div>}
                  </td>
                  <td>
                    <strong>{i.title}</strong>
                    <div className="text-sm text-muted">{i.description?.slice(0, 70)}...</div>
                  </td>
                  <td><span className={`badge badge-${TYPE_CLASS[i.type]}`}>{INCIDENT_TYPE_LABELS[i.type] || i.type}</span></td>
                  <td><span className={`badge badge-${SEVERITY_CLASS[i.severity]}`}>{i.severity.toUpperCase()}</span></td>
                  <td className="text-sm text-muted">{i.aiClassified ? `${Math.round((i.aiConfidence || 0) * 100)}%` : '—'}</td>
                  <td><span className={`badge badge-${STATUS_CLASS[i.status]}`}>{INCIDENT_STATUS_LABELS[i.status]}</span></td>
                  <td>
                    <div className="flex gap-1 wrap">
                      <select
                        className="select text-sm"
                        style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
                        value={i.status}
                        onChange={(e) => updateStatus(i._id, e.target.value)}
                      >
                        {Object.values(INCIDENT_STATUS).map((s) => (
                          <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button className="btn btn-danger text-sm" style={{ padding: '0.25rem 0.6rem' }} onClick={() => remove(i._id)}>🗑</button>
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

export default IncidentManagement;