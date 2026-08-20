import { useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../constants.js';

const Profile = () => {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    passport: user?.passport || '',
    emergencyContact: user?.emergencyContact || { name: '', phone: '' },
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const isTourist = user?.role === 'tourist';

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/auth/profile', form);
      await refresh();
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="mb-1">👤 My Profile</h1>
      <p className="text-muted mb-3">Role: <span className="badge badge-blue">{ROLE_LABELS[user.role]}</span></p>

      {msg && <div className={`alert ${msg.type === 'success' ? 'alert-green' : 'alert-red'} mb-2`}>{msg.text}</div>}

      <div className="card">
        <form onSubmit={submit}>
          <div className="grid grid-2">
            <div className="mb-2">
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} disabled />
            </div>
            <div className="mb-2">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            {isTourist && (
              <>
                <div className="mb-2">
                  <label className="label">Passport / ID</label>
                  <input className="input" value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="label">Tourist ID</label>
                  <input className="input" value={user?.touristId || '—'} disabled />
                </div>
              </>
            )}
          </div>

          {isTourist && (
            <div className="card" style={{ background: 'var(--bg)', boxShadow: 'none', marginBottom: '1rem' }}>
              <h3 className="mb-2">Emergency Contact</h3>
              <div className="grid grid-2">
                <div className="mb-2">
                  <label className="label">Contact name</label>
                  <input className="input" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
                </div>
                <div className="mb-2">
                  <label className="label">Contact phone</label>
                  <input className="input" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />
                </div>
              </div>
            </div>
          )}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;