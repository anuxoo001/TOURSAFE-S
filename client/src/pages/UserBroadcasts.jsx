import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { BROADCAST_LEVEL_LABELS } from '../constants.js';
import { timeAgo } from '../utils/format.js';

const UserBroadcasts = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/broadcasts');
        setBroadcasts(data.broadcasts);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <h1 className="mb-1">📢 Announcements</h1>
      <p className="text-muted mb-3">Official advisories and updates from TOURSAFE administrators.</p>

      {loading ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="card empty-state">
          <p>No announcements right now.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {broadcasts.map((b) => (
            <div className="card" key={b._id} style={{ borderLeft: `5px solid ${b.level === 'danger' ? 'var(--red)' : b.level === 'warning' ? 'var(--yellow)' : 'var(--primary-light)'}` }}>
              <div className="flex-between mb-1">
                <strong>{b.title}</strong>
                <span className={`badge badge-${b.level === 'danger' ? 'red' : b.level === 'warning' ? 'yellow' : 'blue'}`}>
                  {BROADCAST_LEVEL_LABELS[b.level]}
                </span>
              </div>
              <p className="text-sm text-muted">{b.body}</p>
              <div className="text-sm text-muted mt-1">
                {b.createdBy?.name} · {timeAgo(b.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBroadcasts;