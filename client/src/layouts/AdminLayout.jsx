import { PortalLayout } from './PortalLayout.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const AdminLayout = ({ children }) => {
  const { sosAlerts, notifications } = useSocket();
  const { user } = useAuth();
  const unread = notifications.filter((n) => !n.read).length;

  const navItems = [
    { to: '/admin/dashboard', label: 'Command Center', icon: '📊', end: true },
    { to: '/admin/sos', label: 'SOS Response', icon: '🚨', badge: sosAlerts.length },
    { to: '/admin/requests', label: 'Requests Inbox', icon: '📨' },
    { to: '/admin/live-map', label: 'Live Tracking', icon: '📍' },
    { to: '/admin/incidents', label: 'Incidents', icon: '🚨' },
    { to: '/admin/zones', label: 'Safety Zones', icon: '🗺️' },
    { to: '/admin/tourists', label: 'Tourists', icon: '🧳' },
    { to: '/admin/broadcasts', label: 'Broadcasts', icon: '📢' },
    { to: '/admin/services', label: 'Services', icon: '🏥' },
    { to: '/admin/hotels', label: 'Hotels', icon: '🏨' },
    { to: '/admin/bookings', label: 'Bookings', icon: '🛏️' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { to: '/admin/reports', label: 'Reports', icon: '📄' },
    { to: '/admin/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <PortalLayout navItems={navItems} brand={`TOURSAFE — ${user?.role === 'admin' ? 'Admin' : 'Authority'} Panel`} accent="blue">
      {children}
    </PortalLayout>
  );
};

export default AdminLayout;