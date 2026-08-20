import { PortalLayout } from './PortalLayout.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const navItems = [
  { to: '/user/dashboard', label: 'Dashboard', icon: '📊', end: true },
  { to: '/user/map', label: 'Safety Map', icon: '🗺️' },
  { to: '/user/report', label: 'Report Incident', icon: '📝' },
  { to: '/user/incidents', label: 'My Incidents', icon: '🗂️' },
  { to: '/user/emergency', label: 'Emergency & Dial', icon: '🏥' },
  { to: '/user/hotels', label: 'Hotels & Stays', icon: '🏨' },
  { to: '/user/bookings', label: 'My Bookings', icon: '🛏️' },
  { to: '/user/tourist-id', label: 'My Tourist ID', icon: '🪪' },
  { to: '/user/tips', label: 'Safety Tips', icon: '💡' },
  { to: '/user/broadcasts', label: 'Announcements', icon: '📢' },
  { to: '/user/profile', label: 'Profile', icon: '👤' },
];

const UserLayout = ({ children }) => {
  const { notifications } = useSocket();
  const unread = notifications.filter((n) => !n.read).length;
  const withBadge = navItems.map((n) =>
    n.to === '/user/notifications' ? { ...n, badge: unread } : n
  );
  return (
    <PortalLayout navItems={withBadge} brand="TOURSAFE — Tourist Portal" accent="green">
      {children}
    </PortalLayout>
  );
};

export default UserLayout;