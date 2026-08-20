import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../constants.js';

const AdminLogin = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role !== ROLES.AUTHORITY && user.role !== ROLES.ADMIN) {
        setError('This portal is for administrators only. Tourists sign in on the tourist login page.');
        return;
      }
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="auth-page" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}>
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)' }}>🛡️ TOURSAFE</h1>
          <p className="text-muted">Administrator Portal — Sign in to continue</p>
        </div>
        {error && <div className="alert alert-red mb-2">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="mb-2">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="mb-2">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In to Admin'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span className="text-muted text-sm">Are you a tourist? </span>
          <Link to="/login">Go to Tourist Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;