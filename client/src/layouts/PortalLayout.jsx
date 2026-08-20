import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../api/client.js';
import { ROLE_LABELS } from '../constants.js';

const NotificationBell = () => {
  const { notifications, markRead, setNotifications } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <span>🔔</span>
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-popover">
          <div className="flex-between" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="btn-outline text-sm" style={{ padding: '0.2rem 0.6rem' }} onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>No notifications yet</div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <button
                key={n._id || n.createdAt}
                className={`notif-item ${n.read ? '' : 'unread'}`}
                onClick={() => markRead(n._id)}
              >
                <div className="flex-between gap-1">
                  <strong className="text-sm">{n.title}</strong>
                  {!n.read && <span className="status-dot red" />}
                </div>
                <div className="text-sm text-muted" style={{ marginTop: '0.15rem' }}>{n.body}</div>
                <div className="text-sm text-muted" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const PortalLayout = ({ navItems, brand = 'TOURSAFE', accent = 'blue', children }) => {
  const { user, logout } = useAuth();
  const { connected, sosAlerts } = useSocket();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className={`portal portal-${accent}`}>
      <aside className={`sidebar-panel ${sideOpen ? 'open' : ''}`}>
        <div className="side-brand">
          <span className="brand-logo">🛡️</span>
          <span>{brand}</span>
        </div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSideOpen(false)}
            >
              <span className="side-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && <span className="side-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-footer">
          <div className="side-user">
            <span className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</span>
            <div>
              <div className="text-sm" style={{ fontWeight: 700 }}>{user?.name}</div>
              <div className="text-sm text-muted">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            <button className="icon-btn" title="Logout" onClick={() => { logout(); navigate('/'); }}>
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {sideOpen && <div className="side-backdrop" onClick={() => setSideOpen(false)} />}

      <div className="portal-main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSideOpen(true)}>☰</button>
          <div className="topbar-status">
            <span className={`chip ${connected ? 'badge-green' : 'badge-gray'}`}>
              <span className={`status-dot ${connected ? 'green' : 'red'}`} /> {connected ? 'Live' : 'Offline'}
            </span>
            {sosAlerts.length > 0 && <span className="badge badge-red">🚨 {sosAlerts.length} SOS</span>}
          </div>
          <div className="topbar-actions">
            <a href="https://toursafe-s.vercel.app/" target="_blank" rel="noopener noreferrer" className="chip badge-green" title="Live Deployment">
              🌐 Live
            </a>
            <NotificationBell />
            <div style={{ position: 'relative' }}>
              <button className="user-chip" onClick={() => setMenuOpen((o) => !o)}>
                <span className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</span>
                <span className="user-chip-name">{user?.name?.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="user-menu">
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                  <Link to="/notifications" onClick={() => setMenuOpen(false)}>🔔 Notifications</Link>
                  <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}>🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="portal-content">
          {children}
        </main>
        <footer className="portal-footer">
          <span>© {new Date().getFullYear()} TOURSAFE</span>
          <a href="https://toursafe-s.vercel.app/" target="_blank" rel="noopener noreferrer">🌐 Live Deployment</a>
        </footer>
      </div>
    </div>
  );
};

export { PortalLayout, NotificationBell };