import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '../utils/format.js';

const TouristId = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/tourists/id');
        setData(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copy = () => {
    if (!data?.touristId) return;
    navigator.clipboard?.writeText(data.touristId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="mb-1">🪪 My Tourist ID</h1>
      <p className="text-muted mb-3">Your verified identity card with QR code for authorities.</p>

      <div className="tourist-card">
        <div className="header">
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>🛡️ TOURSAFE</div>
            <div className="text-sm" style={{ opacity: 0.85 }}>Digital Tourist ID</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{data.touristId}</div>
            <div className="text-sm" style={{ opacity: 0.85 }}>Issued {fmtDate(data.issuedAt)}</div>
          </div>
        </div>
        <div className="flex" style={{ gap: '1.25rem', padding: '1.25rem' }}>
          <div className="qr-box">
            {data.qr ? (
              <img src={data.qr} alt="Tourist ID QR" width={160} height={160} />
            ) : (
              <div style={{ width: 160, height: 160, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <span className="text-muted">QR unavailable</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="mb-2">
              <div className="label">Name</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{data.name}</div>
            </div>
            <div className="mb-2">
              <div className="label">Email</div>
              <div>{data.email}</div>
            </div>
            <div className="grid grid-2">
              <div>
                <div className="label">Country</div>
                <div>{data.country || '—'}</div>
              </div>
              <div>
                <div className="label">Passport</div>
                <div>{data.passport || '—'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-between" style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <button className="btn btn-outline text-sm" onClick={copy}>
            {copied ? '✅ Copied!' : '📋 Copy ID'}
          </button>
          <div className="text-sm text-muted">Scan to verify</div>
        </div>
      </div>

      {data.verificationUrl && (
        <div className="card mt-2">
          <div className="label">Verification URL</div>
          <a href={data.verificationUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
            {data.verificationUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default TouristId;