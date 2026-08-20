import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const SOSBanner = () => {
  const { user } = useAuth();
  const { cancelSOS, sosAlerts } = useSocket();

  const isTourist = user?.role === 'tourist';
  const mine = sosAlerts.find((a) => a.userId === String(user?._id));
  const show = (isTourist && mine) || (!isTourist && sosAlerts.length > 0);

  if (!show) return null;

  return (
    <div className="sos-banner flex-between wrap" style={{ gap: '0.5rem' }}>
      <span>
        🚨 {isTourist ? 'SOS ACTIVE — Emergency services notified. Stay where you are.' : `${sosAlerts.length} SOS alert${sosAlerts.length > 1 ? 's' : ''} in progress`}
      </span>
      {isTourist && (
        <button className="btn" style={{ background: '#fff', color: 'var(--red)', padding: '0.3rem 0.9rem' }} onClick={cancelSOS}>
          Cancel SOS
        </button>
      )}
      {!isTourist && <span className="badge badge-red">{sosAlerts.map((a) => a.name).join(', ')}</span>}
    </div>
  );
};

export default SOSBanner;