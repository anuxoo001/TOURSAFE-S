import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Toasts from './components/Toasts.jsx';
import SOSBanner from './components/SOSBanner.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import { ROLES } from './constants.js';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Register from './pages/Register.jsx';
import VerifyTourist from './pages/VerifyTourist.jsx';

import UserDashboard from './pages/UserDashboard.jsx';
import TouristMap from './pages/TouristMap.jsx';
import ReportIncident from './pages/ReportIncident.jsx';
import MyIncidents from './pages/MyIncidents.jsx';
import EmergencyServices from './pages/EmergencyServices.jsx';
import Hotels from './pages/Hotels.jsx';
import MyBookings from './pages/MyBookings.jsx';
import TouristId from './pages/TouristId.jsx';
import SafetyTips from './pages/SafetyTips.jsx';
import UserBroadcasts from './pages/UserBroadcasts.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';
import SOSCenter from './pages/SOSCenter.jsx';
import RequestsInbox from './pages/RequestsInbox.jsx';
import LiveMap from './pages/LiveMap.jsx';
import IncidentManagement from './pages/IncidentManagement.jsx';
import SafetyZones from './pages/SafetyZones.jsx';
import Tourists from './pages/Tourists.jsx';
import BroadcastManagement from './pages/BroadcastManagement.jsx';
import ServicesManagement from './pages/ServicesManagement.jsx';
import HotelsManagement from './pages/HotelsManagement.jsx';
import BookingsManagement from './pages/BookingsManagement.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';

const App = () => {
  const { user } = useAuth();
  const isAuthority = user?.role === ROLES.AUTHORITY || user?.role === ROLES.ADMIN;
  const home = isAuthority ? '/admin/dashboard' : '/user/dashboard';

  return (
    <>
      {user && <SOSBanner />}
      <Toasts />
      <Routes>
        <Route path="/" element={user ? <Navigate to={home} replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={home} replace /> : <Login />} />
        <Route path="/admin/login" element={user ? <Navigate to={home} replace /> : <AdminLogin />} />
        <Route path="/register" element={user ? <Navigate to={home} replace /> : <Register />} />
        <Route path="/verify/:touristId" element={<VerifyTourist />} />

        {/* ---------- USER PORTAL ---------- */}
        <Route
          path="/user"
          element={
            <ProtectedRoute roles={[ROLES.TOURIST]}>
              <UserLayout>
                <Outlet />
              </UserLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="map" element={<TouristMap />} />
          <Route path="report" element={<ReportIncident />} />
          <Route path="incidents" element={<MyIncidents />} />
          <Route path="emergency" element={<EmergencyServices />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="tourist-id" element={<TouristId />} />
          <Route path="tips" element={<SafetyTips />} />
          <Route path="broadcasts" element={<UserBroadcasts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ---------- ADMIN PORTAL ---------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={[ROLES.AUTHORITY, ROLES.ADMIN]}>
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="sos" element={<SOSCenter />} />
          <Route path="requests" element={<RequestsInbox />} />
          <Route path="live-map" element={<LiveMap />} />
          <Route path="incidents" element={<IncidentManagement />} />
          <Route path="zones" element={<SafetyZones />} />
          <Route path="tourists" element={<Tourists />} />
          <Route path="broadcasts" element={<BroadcastManagement />} />
          <Route path="services" element={<ServicesManagement />} />
          <Route path="hotels" element={<HotelsManagement />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;