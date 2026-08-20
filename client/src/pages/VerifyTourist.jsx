import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import { fmtDate } from '../utils/format.js';

const VerifyTourist = () => {
  const { touristId } = useParams();
  const [state, setState] = useState({ loading: true, verified: false, tourist: null, error: '' });

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.get(`/tourists/verify/${touristId}`);
        setState({ loading: false, verified: data.verified, tourist: data.tourist, error: '' });
      } catch (err) {
        setState({ loading: false, verified: false, tourist: null, error: err.response?.data?.message || 'Verification failed' });
      }
    };
    verify();
  }, [touristId]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🛡️ TOURSAFE</h1>
        {state.loading ? (
          <div className="page-loader" style={{ minHeight: 'auto', padding: '2rem' }}>
            <div className="spinner spinner-dark" />
          </div>
        ) : state.verified && state.tourist ? (
          <>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <h2 style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>Verified Tourist</h2>
            <p className="text-muted mb-2">This is a valid TOURSAFE registered tourist.</p>
            <div className="card" style={{ background: 'var(--bg)', boxShadow: 'none', marginTop: '1rem' }}>
              <div className="mb-2">
                <div className="label">Name</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{state.tourist.name}</div>
              </div>
              <div className="mb-2">
                <div className="label">Tourist ID</div>
                <div className="chip badge-green">{state.tourist.touristId}</div>
              </div>
              <div className="mb-2">
                <div className="label">Country</div>
                <div>{state.tourist.country || '—'}</div>
              </div>
              <div>
                <div className="label">Registered</div>
                <div>{fmtDate(state.tourist.registered)}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem' }}>❌</div>
            <h2 style={{ color: 'var(--red)', marginBottom: '0.5rem' }}>Verification Failed</h2>
            <p className="text-muted">{state.error}</p>
            <p className="text-sm mt-2">The tourist ID could not be verified.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyTourist;