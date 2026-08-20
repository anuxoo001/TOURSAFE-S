import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { timeAgo } from '../utils/format.js';

const Tourists = () => {
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/tourists');
      setTourists(data.tourists);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = tourists.filter(
    (t) =>
      t.name?.toLowerCase().includes(q.toLowerCase()) ||
      t.email?.toLowerCase().includes(q.toLowerCase()) ||
      t.touristId?.toLowerCase().includes(q.toLowerCase()) ||
      t.country?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container">
      <h1 className="mb-1">🧳 Registered Tourists</h1>
      <p className="text-muted mb-3">{tourists.length} tourists registered with TOURSAFE.</p>

      <div className="sidebar">
        <input className="input" style={{ width: 260 }} placeholder="🔍 Search name, email, ID..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <p>No tourists found.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tourist</th>
                <th>Tourist ID</th>
                <th>Country</th>
                <th>Last Seen</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id}>
                  <td>
                    <strong>{t.name}</strong>
                    <div className="text-sm text-muted">{t.email}</div>
                  </td>
                  <td className="text-sm">{t.touristId || '—'}</td>
                  <td>{t.country || '—'}</td>
                  <td className="text-muted">{t.lastLocationAt ? timeAgo(t.lastLocationAt) : 'Never'}</td>
                  <td className="text-sm text-muted">
                    {t.lat != null && t.lng != null ? `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}` : '—'}
                  </td>
                  <td>
                    {t.sosActive ? (
                      <span className="badge badge-red">🚨 SOS</span>
                    ) : t.isOnline ? (
                      <span className="badge badge-green">Online</span>
                    ) : (
                      <span className="badge badge-gray">Offline</span>
                    )}
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

export default Tourists;