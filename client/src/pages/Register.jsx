import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    passport: '',
  });
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      const user = await register(form);
      navigate(user.role === 'tourist' ? '/user/dashboard' : '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)' }}>🛡️ TOURSAFE</h1>
          <p className="text-muted">Create your tourist safety account</p>
        </div>
        {error && <div className="alert alert-red mb-2">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="mb-2">
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
          </div>
          <div className="mb-2">
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="mb-2">
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </div>
          <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="mb-2">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91-... (optional)" />
            </div>
            <div className="mb-2">
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. UK (optional)" />
            </div>
          </div>
          <div className="mb-2">
            <label className="label">Passport / ID</label>
            <input className="input" value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} placeholder="Passport number (optional)" />
          </div>
          <button className="btn btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span className="text-muted text-sm">Already have an account? </span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
      <p className="text-sm" style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="https://toursafe-s.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          🌐 Live Deployment
        </a>
      </p>
    </div>
  );
};

export default Register;