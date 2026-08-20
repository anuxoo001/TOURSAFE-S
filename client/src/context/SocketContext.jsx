import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [livePositions, setLivePositions] = useState({});
  const [connected, setConnected] = useState(false);
  const notifRef = useRef([]);

  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }
    const token = localStorage.getItem('ts_token');
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));

    s.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      pushToast(notif.title, notif.body, notif.type);
    });

    s.on('geofence-alert', (alert) => {
      pushToast(alert.type === 'danger' ? '⚠️ Danger zone' : '🟡 Caution zone', alert.message, alert.type === 'danger' ? 'red' : 'yellow');
    });

    s.on('sos-alert', (alert) => {
      if (alert.type === 'resolved') {
        setSosAlerts((prev) => prev.filter((a) => a.userId !== alert.userId));
        pushToast('SOS Resolved', `SOS for tourist resolved`, 'green');
        return;
      }
      setSosAlerts((prev) => [alert, ...prev.filter((a) => a.userId !== alert.userId)]);
      pushToast('🚨 SOS', `${alert.name} pressed SOS`, 'red');
    });

    s.on('location-update', (loc) => {
      setLivePositions((prev) => ({ ...prev, [loc.userId]: loc }));
    });

    s.on('presence', (p) => {
      setLivePositions((prev) =>
        p.online
          ? prev
          : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== p.userId))
      );
    });

    s.on('authority-alert', (alert) => {
      pushToast(alert.title, alert.body, alert.type === 'sos' ? 'red' : alert.type === 'request' ? 'blue' : 'blue');
    });

    s.on('broadcast', (msg) => {
      pushToast('📢 ' + msg.title, msg.body, msg.level === 'danger' ? 'red' : msg.level === 'warning' ? 'yellow' : 'blue');
    });

    s.on('sos-ack', (ack) => {
      if (ack.ok && !ack.type) {
        pushToast('🚨 SOS Sent', ack.message || 'Emergency alert sent. Help is on the way.', 'red');
      } else if (ack.type === 'resolved') {
        pushToast('SOS Resolved', ack.message || 'Your SOS has been resolved.', 'green');
      } else {
        pushToast('✅ SOS Acknowledged', ack.message || 'An administrator acknowledged your SOS.', 'green');
      }
    });

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const pushToast = useCallback((title, body, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, body, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const emitLocation = (lat, lng) => {
    socket?.emit('location-update', { lat, lng });
    socket?.emit('geofence-check', { lat, lng });
  };

  const triggerSOS = (lat, lng) => socket?.emit('sos-trigger', { lat, lng });
  const cancelSOS = () => socket?.emit('sos-cancel');

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        toasts,
        sosAlerts,
        livePositions,
        emitLocation,
        triggerSOS,
        cancelSOS,
        pushToast,
        markRead,
        setNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);