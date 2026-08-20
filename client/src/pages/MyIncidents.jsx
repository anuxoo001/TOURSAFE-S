import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { INCIDENT_TYPE_LABELS, SEVERITY_CLASS, STATUS_CLASS, INCIDENT_STATUS_LABELS } from '../constants.js';
import { fmtDateTime } from '../utils/format.js';

const MyIncidents = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/incidents?limit=100');
        setIncidents(data.incidents.filter((i) => String(i.reporter?._id) === String(user._id)));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user._id]);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-1">📝 My Incident Reports</h1>
      <p className="text-muted mb-3">Track the status of everything you've reported.</p>

      {incidents.length === 0 ? (
        <div className="card empty-state">
          <p>You haven't reported any incidents yet.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reported</th>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>AI Confidence</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i._id}>
                  <td className="text-muted">{fmtDateTime(i.createdAt)}</td>
                  <td>
                    <strong>{i.title}</strong>
                    <div className="text-sm text-muted">{i.description?.slice(0, 80)}...</div>
                  </td>
                  <td><span className={`badge badge-${STATUS_CLASS[i.status]}`}>{INCIDENT_TYPE_LABELS[i.type] || i.type}</span></td>
                  <td><span className={`badge badge-${SEVERITY_CLASS[i.severity]}`}>{i.severity.toUpperCase()}</span></td>
                  <td><span className={`badge badge-${STATUS_CLASS[i.status]}`}>{INCIDENT_STATUS_LABELS[i.status]}</span></td>
                  <td className="text-muted">{i.aiClassified ? `${Math.round(i.aiConfidence * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyIncidents;