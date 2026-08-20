import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Landing = () => {
  const { user } = useAuth();
  const home = user ? (user.role === 'tourist' ? '/user/dashboard' : '/admin/dashboard') : '/login';

  const features = [
    { icon: '🗺️', title: 'Live Safety Map', desc: 'Color-coded danger, caution and safe zones around the city.' },
    { icon: '🚨', title: 'One-Tap SOS', desc: 'Instantly alert authorities and emergency contacts with your location.' },
    { icon: '🪪', title: 'Digital Tourist ID', desc: 'QR-verified identity card for hassle-free checks and help.' },
    { icon: '📝', title: 'Incident Reporting', desc: 'Report incidents with AI-powered severity classification.' },
    { icon: '🏥', title: 'Nearby Help', desc: 'Find hospitals, police stations, pharmacies and embassies nearby.' },
    { icon: '📡', title: 'Real-Time Alerts', desc: 'Instant push notifications when you enter a risky area.' },
  ];

  return (
    <div>
      <div className="hero">
        <h1>🛡️ TOURSAFE</h1>
        <p>
          A smart tourist safety platform with geofencing, emergency SOS, incident reporting and live
          authority monitoring — so you can explore with peace of mind.
        </p>
        {user ? (
          <div className="flex-center gap-1" style={{ marginTop: '1.5rem' }}>
            <Link to={home} className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)' }}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex-center gap-1 wrap" style={{ marginTop: '1.5rem' }}>
            <Link to="/login" className="btn btn-lg" style={{ background: '#fff', color: 'var(--green)' }}>
              🧳 Tourist Portal
            </Link>
            <Link to="/admin/login" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              🛡️ Admin Portal
            </Link>
            <Link to="/register" className="btn btn-lg btn-outline" style={{ borderColor: '#fff', color: '#fff' }}>
              Create Tourist Account
            </Link>
          </div>
        )}
      </div>

      <div className="container">
        <div className="grid grid-3" style={{ margin: '2rem 0' }}>
          {features.map((f) => (
            <div className="card feature-card" key={f.title}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: '#fff', textAlign: 'center', padding: '2.5rem' }}>
          <h2>How it works</h2>
          <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '1.8rem' }}>1️⃣</div>
              <p><strong>Register</strong> and get your digital Tourist ID with QR code.</p>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem' }}>2️⃣</div>
              <p><strong>Travel</strong> with live zone awareness and one-tap SOS.</p>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem' }}>3️⃣</div>
              <p><strong>Report</strong> incidents and get help from local authorities.</p>
            </div>
          </div>
          {!user && (
            <Link to="/login" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)', marginTop: '1.5rem' }}>
              Start Now — It&apos;s Free
            </Link>
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)' }}>
        <p className="text-sm">© {new Date().getFullYear()} TOURSAFE — Tourist Safety Platform</p>
      </footer>
    </div>
  );
};

export default Landing;