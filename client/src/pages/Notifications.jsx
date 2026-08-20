import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { fmtDateTime } from '../utils/format.js';

const Notifications = () => {
  const { notifications, markRead, setNotifications } = useSocket();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/notifications?limit=50');
        setNotifications(data.notifications);
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [setNotifications]);

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="flex-between mb-3">
        <div>
          <h1 className="mb-1">🔔 Notifications</h1>
          <p className="text-muted">{unread} unread</p>
        </div>
        {unread > 0 && <button className="btn btn-outline" onClick={markAll}>Mark all read</button>}
      </div>

      {!loaded ? (
        <div className="page-loader">
          <div className="spinner spinner-dark" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card empty-state">
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {notifications.map((n) => (
            <div key={n._id} className={`card ${n.read ? '' : ''}`} style={{ opacity: n.read ? 0.7 : 1 }}>
              <div className="flex-between">
                <div className="flex gap-1" style={{ alignItems: 'center' }}>
                  {!n.read && <span className="status-dot red" />}
                  <strong>{n.title}</strong>
                </div>
                <span className="text-muted text-sm">{fmtDateTime(n.createdAt)}</span>
              </div>
              <p className="text-sm mt-1">{n.body}</p>
              {!n.read && (
                <button className="btn btn-outline text-sm mt-1" style={{ padding: '0.3rem 0.8rem' }} onClick={() => markRead(n._id)}>
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;